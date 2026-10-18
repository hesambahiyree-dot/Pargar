import { angleDeg, clipLine, clipRay, dist, sub, type Rect, type V } from "./math.ts";
import { evaluate } from "./eval.ts";
import type { BoardDoc } from "./types.ts";

export type Prim =
  | { t: "line"; id: string; a: V; b: V; dashed?: boolean; aux?: boolean; arrow?: boolean; kind: "line" | "ray" | "segment" }
  | { t: "circle"; id: string; c: V; r: number }
  | { t: "polygon"; id: string; pts: V[] }
  | { t: "point"; id: string; p: V; label?: string }
  | { t: "angle"; id: string; v: V; a: V; b: V; deg: number }
  | { t: "arc"; id: string; c: V; r: number; start: V; end: V };

export function visibleRect(doc: BoardDoc, w: number, h: number, pad = 0): Rect {
  const halfW = w / 2 / doc.view.scale + pad;
  const halfH = h / 2 / doc.view.scale + pad;
  return {
    minX: doc.view.cx - halfW,
    maxX: doc.view.cx + halfW,
    minY: doc.view.cy - halfH,
    maxY: doc.view.cy + halfH,
  };
}

export function scene(doc: BoardDoc, rect: Rect): Prim[] {
  const ev = evaluate(doc);
  const prims: Prim[] = [];
  for (const o of doc.objects) {
    if (ev.broken.has(o.id)) continue;
    if (o.kind === "polygon") {
      const pts = o.verts.map((id) => ev.pos.get(id)).filter((p): p is V => !!p);
      if (pts.length === o.verts.length) prims.push({ t: "polygon", id: o.id, pts });
    } else if (o.kind === "line") {
      const a = ev.pos.get(o.a);
      const b = ev.pos.get(o.b);
      if (!a || !b) continue;
      const clipped = clipLine(a, b, rect);
      if (clipped) prims.push({ t: "line", id: o.id, a: clipped[0], b: clipped[1], dashed: o.dashed, aux: o.aux, kind: "line" });
    } else if (o.kind === "ray") {
      const a = ev.pos.get(o.a);
      const b = ev.pos.get(o.b);
      if (!a || !b) continue;
      const clipped = clipRay(a, b, rect);
      if (clipped) prims.push({ t: "line", id: o.id, a: clipped[0], b: clipped[1], dashed: o.dashed, aux: o.aux, kind: "ray" });
    } else if (o.kind === "segment") {
      const a = ev.pos.get(o.a);
      const b = ev.pos.get(o.b);
      if (!a || !b) continue;
      prims.push({ t: "line", id: o.id, a, b, dashed: o.dashed, aux: o.aux, arrow: o.arrow, kind: "segment" });
    } else if (o.kind === "circle") {
      const c = ev.pos.get(o.center);
      const r = ev.radius.get(o.id);
      if (c && r != null) prims.push({ t: "circle", id: o.id, c, r });
    } else if (o.kind === "angle") {
      const a = ev.pos.get(o.a);
      const v = ev.pos.get(o.v);
      const b = ev.pos.get(o.b);
      if (!a || !v || !b) continue;
      const deg = angleDeg(sub(a, v), sub(b, v));
      if (Number.isFinite(deg)) prims.push({ t: "angle", id: o.id, a, v, b, deg });
    } else if (o.kind === "arc") {
      const circle = doc.objects.find((x) => x.id === o.circle);
      if (!circle || circle.kind !== "circle") continue;
      const c = ev.pos.get(circle.center);
      const r = ev.radius.get(circle.id);
      const a = ev.pos.get(o.a);
      const b = ev.pos.get(o.b);
      if (c && r != null && a && b) prims.push({ t: "arc", id: o.id, c, r, start: a, end: b });
    }
  }
  for (const o of doc.objects) {
    if (o.kind !== "point" || o.hidden || ev.broken.has(o.id)) continue;
    const p = ev.pos.get(o.id);
    if (p) prims.push({ t: "point", id: o.id, p, label: o.label });
  }
  return prims;
}

export function toScreen(p: V, doc: BoardDoc, w: number, h: number): V {
  return {
    x: (p.x - doc.view.cx) * doc.view.scale + w / 2,
    y: (doc.view.cy - p.y) * doc.view.scale + h / 2,
  };
}

export function fromScreen(p: V, doc: BoardDoc, w: number, h: number): V {
  return {
    x: (p.x - w / 2) / doc.view.scale + doc.view.cx,
    y: doc.view.cy - (p.y - h / 2) / doc.view.scale,
  };
}

function xml(s: string): string {
  return s.replace(/&/g, "&" + "amp;").replace(/</g, "&" + "lt;").replace(/>/g, "&" + "gt;");
}

export function boardSvg(doc: BoardDoc, w: number, h: number): string {
  const rect = visibleRect(doc, w, h);
  const prims = scene(doc, rect);
  const parts: string[] = [];
  parts.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
  if (doc.showGrid) {
    const step = doc.view.scale;
    const ox = w / 2 - doc.view.cx * doc.view.scale;
    const oy = h / 2 + doc.view.cy * doc.view.scale;
    for (let x = ox % step; x < w; x += step) {
      parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#E0E7F0" stroke-width="1"/>`);
    }
    for (let y = oy % step; y < h; y += step) {
      parts.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#E0E7F0" stroke-width="1"/>`);
    }
  }
  if (doc.showAxes) {
    const origin = toScreen({ x: 0, y: 0 }, doc, w, h);
    parts.push(`<line x1="0" y1="${origin.y}" x2="${w}" y2="${origin.y}" stroke="#94A3B8" stroke-width="1.25"/>`);
    parts.push(`<line x1="${origin.x}" y1="0" x2="${origin.x}" y2="${h}" stroke="#94A3B8" stroke-width="1.25"/>`);
  }
  for (const p of prims) {
    if (p.t === "polygon") {
      const d = p.pts.map((pt) => toScreen(pt, doc, w, h));
      const pts = d.map((q) => `${q.x},${q.y}`).join(" ");
      parts.push(`<polygon points="${pts}" fill="rgba(53,106,230,0.12)" stroke="#356AE6" stroke-width="2"/>`);
    } else if (p.t === "line") {
      const a = toScreen(p.a, doc, w, h);
      const b = toScreen(p.b, doc, w, h);
      const dash = p.dashed ? ` stroke-dasharray="7 5"` : "";
      parts.push(
        `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${p.aux ? "#26B7C8" : "#18263D"}" stroke-width="${p.aux ? 1.5 : 2}"${dash}/>`,
      );
      if (p.arrow) {
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const s = 12;
        const x1 = b.x - s * Math.cos(ang - 0.4);
        const y1 = b.y - s * Math.sin(ang - 0.4);
        const x2 = b.x - s * Math.cos(ang + 0.4);
        const y2 = b.y - s * Math.sin(ang + 0.4);
        parts.push(`<polygon points="${b.x},${b.y} ${x1},${y1} ${x2},${y2}" fill="#18263D"/>`);
      }
      if (doc.showMeasures && p.kind === "segment" && !p.aux) {
        const mid = toScreen({ x: (p.a.x + p.b.x) / 2, y: (p.a.y + p.b.y) / 2 }, doc, w, h);
        parts.push(
          `<text x="${mid.x + 6}" y="${mid.y - 6}" font-size="13" fill="#172033" font-family="Vazirmatn, sans-serif">${xml(dist(p.a, p.b).toFixed(2))}</text>`,
        );
      }
    } else if (p.t === "circle") {
      const c = toScreen(p.c, doc, w, h);
      parts.push(
        `<circle cx="${c.x}" cy="${c.y}" r="${p.r * doc.view.scale}" fill="none" stroke="#356AE6" stroke-width="2"/>`,
      );
    } else if (p.t === "arc") {
      const c = toScreen(p.c, doc, w, h);
      const s = toScreen(p.start, doc, w, h);
      const e = toScreen(p.end, doc, w, h);
      const r = p.r * doc.view.scale;
      parts.push(`<path d="M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}" fill="none" stroke="#F39A54" stroke-width="2.5"/>`);
      void c;
    } else if (p.t === "angle") {
      const v = toScreen(p.v, doc, w, h);
      const a = toScreen(p.a, doc, w, h);
      const b = toScreen(p.b, doc, w, h);
      const ra = Math.hypot(a.x - v.x, a.y - v.y) || 1;
      const rb = Math.hypot(b.x - v.x, b.y - v.y) || 1;
      const rad = 22;
      const a1 = { x: v.x + ((a.x - v.x) / ra) * rad, y: v.y + ((a.y - v.y) / ra) * rad };
      const b1 = { x: v.x + ((b.x - v.x) / rb) * rad, y: v.y + ((b.y - v.y) / rb) * rad };
      parts.push(`<path d="M ${a1.x} ${a1.y} A ${rad} ${rad} 0 0 1 ${b1.x} ${b1.y}" fill="none" stroke="#F39A54" stroke-width="2"/>`);
      parts.push(
        `<text x="${(a1.x + b1.x) / 2}" y="${(a1.y + b1.y) / 2}" font-size="12" fill="#172033" font-family="Vazirmatn, sans-serif">${xml(p.deg.toFixed(1))}°</text>`,
      );
    } else if (p.t === "point") {
      const s = toScreen(p.p, doc, w, h);
      parts.push(`<circle cx="${s.x}" cy="${s.y}" r="4.5" fill="#356AE6" stroke="#ffffff" stroke-width="1.5"/>`);
      if (p.label) {
        parts.push(
          `<text x="${s.x + 8}" y="${s.y - 8}" font-size="14" fill="#172033" font-family="Vazirmatn, sans-serif">${xml(p.label)}</text>`,
        );
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join("")}</svg>`;
}

export function serializeBoard(doc: BoardDoc): string {
  return JSON.stringify(doc);
}

export function restoreBoard(raw: string): BoardDoc | null {
  try {
    const data = JSON.parse(raw) as BoardDoc;
    if (!data || !Array.isArray(data.objects) || !data.view) return null;
    return data;
  } catch {
    return null;
  }
}

export function segmentExact(prims: Prim[], id: string): [V, V] | null {
  const p = prims.find((x) => x.t === "line" && x.id === id && x.kind === "segment");
  if (!p || p.t !== "line") return null;
  return [p.a, p.b];
}
