/**
 * Full-mesh WebRTC rooms: one RTCPeerConnection per remote peer, signaled
 * through /api/rtc. Perfect negotiation pattern for glare handling.
 */

export type SignalKind = "offer" | "answer" | "ice";

export interface PeerRow {
  id: string;
  name: string;
}
export interface SignalRow {
  id: number;
  from: string;
  kind: SignalKind;
  payload: unknown;
}
export interface RtcPollResponse {
  peers: PeerRow[];
  signals: SignalRow[];
}

export interface PeerInfo {
  id: string;
  name: string;
  connectionState: RTCPeerConnectionState;
  candidateType: string | null;
  rttMs: number | null;
}

export interface P2PRoomOptions {
  room: string;
  selfId: string;
  name?: string;
  iceServers?: RTCIceServer[];
  onPeersChanged?: (peers: PeerInfo[]) => void;
  onMessage?: (from: string, data: unknown, channel: "state" | "reliable") => void;
  onConnected?: () => void;
}

interface PeerSlot {
  pc: RTCPeerConnection;
  state?: RTCDataChannel;
  reliable?: RTCDataChannel;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pendingCandidates: RTCIceCandidateInit[];
  lastProgressAt: number;
  recoveryAttempts: number;
  terminal?: boolean;
  recreatedForOffer?: boolean;
  info: PeerInfo;
  pingSentAt?: number;
}

const FAST_POLL_MS = 400;
const IDLE_POLL_MS = 2000;
const PING_INTERVAL_MS = 2000;
const STALL_MS = 10_000;
const MAX_RECOVERY_ATTEMPTS = 3;

export function defaultIceServers(): RTCIceServer[] {
  const urls = (import.meta.env.VITE_STUN_URLS as string | undefined)
    ?.split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  return [
    {
      urls: urls?.length ? urls : ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"],
    },
  ];
}

export class P2PRoom {
  private readonly opts: P2PRoomOptions;
  private readonly peers = new Map<string, PeerSlot>();
  private readonly signalQueues = new Map<string, Promise<void>>();
  private cursor = 0;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private everPolled = false;
  private lastPeersFingerprint = "";

  constructor(opts: P2PRoomOptions) {
    this.opts = opts;
  }

  async join(): Promise<void> {
    try {
      await this.poll();
    } catch (err) {
      console.error("[p2p] first poll failed", err);
    }
    this.schedulePoll();
    this.pingTimer = setInterval(() => this.pingPeers(), PING_INTERVAL_MS);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    for (const slot of this.peers.values()) {
      try {
        slot.pc.close();
      } catch {}
    }
    this.peers.clear();
  }

  broadcast(data: unknown, channel: "state" | "reliable" = "state"): void {
    const wire = JSON.stringify(data);
    for (const slot of this.peers.values()) {
      const ch = channel === "reliable" ? slot.reliable : slot.state;
      if (ch && ch.readyState === "open") {
        try {
          ch.send(wire);
        } catch {}
      }
    }
  }

  send(peerId: string, data: unknown, channel: "state" | "reliable" = "state"): void {
    const slot = this.peers.get(peerId);
    if (!slot) return;
    const ch = channel === "reliable" ? slot.reliable : slot.state;
    if (ch && ch.readyState === "open") {
      try {
        ch.send(JSON.stringify(data));
      } catch {}
    }
  }

  peerList(): PeerInfo[] {
    return [...this.peers.values()].map((s) => ({ ...s.info }));
  }

  private schedulePoll(): void {
    if (this.closed) return;
    const ms = this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS;
    this.pollTimer = setTimeout(() => {
      void this.poll()
        .catch((err) => console.error("[p2p] poll failed", err))
        .finally(() => this.schedulePoll());
    }, ms);
  }

  private anyPairConnecting(): boolean {
    for (const slot of this.peers.values()) {
      if (slot.terminal) continue;
      const st = slot.pc.connectionState;
      if (st === "connecting" || st === "new") return true;
    }
    return false;
  }

  private async poll(): Promise<void> {
    if (this.closed) return;
    const params = new URLSearchParams({
      room: this.opts.room,
      self: this.opts.selfId,
      name: this.opts.name ?? this.opts.selfId,
      cursor: String(this.cursor),
    });
    const res = await fetch(`/api/rtc?${params}`, { method: "GET", credentials: "same-origin" });
    if (!res.ok) throw new Error(`rtc poll HTTP ${res.status}`);
    const body = (await res.json()) as RtcPollResponse;
    if (!this.everPolled) {
      this.everPolled = true;
      this.opts.onConnected?.();
    }
    this.syncRoster(body.peers ?? []);
    for (const sig of body.signals ?? []) {
      if (sig.id > this.cursor) this.cursor = sig.id;
      this.enqueueSignal(sig);
    }
  }

  private syncRoster(roster: PeerRow[]): void {
    const alive = new Set(roster.map((p) => p.id));
    for (const [id, slot] of this.peers) {
      if (!alive.has(id)) {
        try {
          slot.pc.close();
        } catch {}
        this.peers.delete(id);
      }
    }
    for (const row of roster) {
      if (row.id === this.opts.selfId) continue;
      if (!this.peers.has(row.id)) {
        this.ensurePeer(row.id, row.name);
      } else {
        const slot = this.peers.get(row.id)!;
        slot.info.name = row.name;
      }
    }
    const fp = roster
      .map((p) => p.id)
      .sort()
      .join(",");
    if (fp !== this.lastPeersFingerprint) {
      this.lastPeersFingerprint = fp;
      this.opts.onPeersChanged?.(this.peerList());
    }
  }

  private ensurePeer(remoteId: string, name: string): PeerSlot {
    const existing = this.peers.get(remoteId);
    if (existing) return existing;
    const polite = this.opts.selfId < remoteId;
    const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers ?? defaultIceServers() });
    const info: PeerInfo = {
      id: remoteId,
      name,
      connectionState: pc.connectionState,
      candidateType: null,
      rttMs: null,
    };
    const slot: PeerSlot = {
      pc,
      makingOffer: false,
      ignoreOffer: false,
      pendingCandidates: [],
      lastProgressAt: Date.now(),
      recoveryAttempts: 0,
      info,
    };
    this.peers.set(remoteId, slot);

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        void this.postSignal(remoteId, "ice", ev.candidate.toJSON());
      }
    };
    pc.onconnectionstatechange = () => {
      slot.info.connectionState = pc.connectionState;
      if (pc.connectionState === "connected") slot.lastProgressAt = Date.now();
      this.opts.onPeersChanged?.(this.peerList());
    };
    pc.ondatachannel = (ev) => {
      this.bindChannel(slot, ev.channel);
    };

    if (!polite) {
      const state = pc.createDataChannel("state", { ordered: false, maxRetransmits: 0 });
      const reliable = pc.createDataChannel("reliable", { ordered: true });
      this.bindChannel(slot, state);
      this.bindChannel(slot, reliable);
      void this.makeOffer(slot, remoteId);
    }
    return slot;
  }

  private bindChannel(slot: PeerSlot, ch: RTCDataChannel): void {
    if (ch.label === "reliable") slot.reliable = ch;
    else slot.state = ch;
    ch.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data));
        if (data && data.__ping === true) {
          ch.send(JSON.stringify({ __pong: true, t: data.t }));
          return;
        }
        if (data && data.__pong === true && slot.pingSentAt) {
          slot.info.rttMs = Date.now() - Number(data.t ?? slot.pingSentAt);
          slot.pingSentAt = undefined;
          this.opts.onPeersChanged?.(this.peerList());
          return;
        }
        this.opts.onMessage?.(slot.info.id, data, ch.label === "reliable" ? "reliable" : "state");
      } catch {}
    };
  }

  private async makeOffer(slot: PeerSlot, remoteId: string): Promise<void> {
    try {
      slot.makingOffer = true;
      const offer = await slot.pc.createOffer();
      await slot.pc.setLocalDescription(offer);
      await this.postSignal(remoteId, "offer", slot.pc.localDescription);
    } catch (err) {
      console.error("[p2p] makeOffer failed", err);
    } finally {
      slot.makingOffer = false;
    }
  }

  private enqueueSignal(sig: SignalRow): void {
    const prev = this.signalQueues.get(sig.from) ?? Promise.resolve();
    const next = prev
      .then(() => this.handleSignal(sig))
      .catch((err) => console.error("[p2p] signal handling failed", err));
    this.signalQueues.set(sig.from, next);
  }

  private async handleSignal(sig: SignalRow): Promise<void> {
    if (sig.from === this.opts.selfId) return;
    const slot = this.ensurePeer(sig.from, sig.from);
    const polite = this.opts.selfId < sig.from;
    if (sig.kind === "offer") {
      const offerCollision = slot.makingOffer || slot.pc.signalingState !== "stable";
      slot.ignoreOffer = !polite && offerCollision;
      if (slot.ignoreOffer) return;
      await slot.pc.setRemoteDescription(sig.payload as RTCSessionDescriptionInit);
      for (const c of slot.pendingCandidates) {
        try {
          await slot.pc.addIceCandidate(c);
        } catch {}
      }
      slot.pendingCandidates = [];
      const answer = await slot.pc.createAnswer();
      await slot.pc.setLocalDescription(answer);
      await this.postSignal(sig.from, "answer", slot.pc.localDescription);
    } else if (sig.kind === "answer") {
      await slot.pc.setRemoteDescription(sig.payload as RTCSessionDescriptionInit);
      for (const c of slot.pendingCandidates) {
        try {
          await slot.pc.addIceCandidate(c);
        } catch {}
      }
      slot.pendingCandidates = [];
    } else if (sig.kind === "ice") {
      const cand = sig.payload as RTCIceCandidateInit;
      if (slot.pc.remoteDescription) {
        try {
          await slot.pc.addIceCandidate(cand);
        } catch {}
      } else {
        slot.pendingCandidates.push(cand);
      }
    }
  }

  private async postSignal(to: string, kind: SignalKind, payload: unknown): Promise<void> {
    await fetch("/api/rtc", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        room: this.opts.room,
        from: this.opts.selfId,
        to,
        kind,
        payload,
      }),
    });
  }

  private pingPeers(): void {
    for (const slot of this.peers.values()) {
      if (slot.state?.readyState === "open") {
        slot.pingSentAt = Date.now();
        try {
          slot.state.send(JSON.stringify({ __ping: true, t: slot.pingSentAt }));
        } catch {}
      }
      if (
        !slot.terminal &&
        slot.pc.connectionState !== "connected" &&
        Date.now() - slot.lastProgressAt > STALL_MS
      ) {
        slot.recoveryAttempts += 1;
        if (slot.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
          slot.terminal = true;
        }
      }
    }
  }
}
