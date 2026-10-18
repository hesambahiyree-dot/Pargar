import { useEffect, useState, type ReactNode } from "react";
import {
  Circle,
  Download,
  Eraser,
  Grid3x3,
  Redo2,
  RotateCcw,
  Ruler,
  Trash2,
  Undo2,
} from "lucide-react";
import { BoardCanvas } from "@/components/board-canvas";
import { useDismissLayer } from "@/components/shell";
import { faNum } from "@/lib/format";
import { addCircleRadius, cleanupBroken, clearObjects, deleteIds } from "@/lib/geometry/ops";
import { boardSvg } from "@/lib/geometry/svg";
import type { BoardDoc } from "@/lib/geometry/types";
import { inspect } from "@/lib/inspect";
import { applyTap, applyXform, closePolygon, type ModalReq } from "@/lib/interact";
import { useBoards } from "@/lib/store";
import { GROUPS, HINTS, SUBS, initialSession, type Group, type Session, type Sub } from "@/lib/tools";

const ICONS = {
  eraser: Eraser,
  ruler: Ruler,
  circle: Circle,
  transform: RotateCcw,
} as const;

export function BoardStudio() {
  const doc = useBoards((s) => s.boards.find((b) => b.id === s.activeId) ?? null);
  const commit = useBoards((s) => s.commit);
  const live = useBoards((s) => s.live);
  const begin = useBoards((s) => s.begin);
  const undo = useBoards((s) => s.undo);
  const redo = useBoards((s) => s.redo);
  const past = useBoards((s) => s.past.length);
  const future = useBoards((s) => s.future.length);
  const rename = useBoards((s) => s.rename);
  const [session, setSession] = useState<Session>(initialSession);
  const [modal, setModal] = useState<ModalReq>(null);
  const [askClear, setAskClear] = useState(false);
  const [propsOpen, setPropsOpen] = useState(true);
  const closeModal = useDismissLayer(modal != null, () => setModal(null));
  const closeClear = useDismissLayer(askClear, () => setAskClear(false));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Escape") {
        setSession((s) => ({ ...s, pending: [], error: null, sub: s.group === "select" ? null : s.sub }));
        setModal(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (!doc || session.pending.length === 0 || session.group !== "select") return;
        e.preventDefault();
        commit(deleteIds(doc, session.pending));
        setSession((s) => ({ ...s, pending: [] }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit, doc, redo, session.group, session.pending, undo]);

  if (!doc) {
    return <p className="p-6 text-sm text-muted">تخته‌ای باز نیست.</p>;
  }

  function pickGroup(id: Exclude<Group, "select">) {
    setSession((s) => ({
      ...initialSession(),
      group: s.group === id ? "select" : id,
      sub: s.group === id ? null : (SUBS[id][0]?.id ?? null),
      polyN: s.polyN,
      hint: s.group === id ? initialSession().hint : (HINTS[SUBS[id][0]!.id] ?? ""),
    }));
    setModal(null);
  }

  function pickSub(sub: Sub) {
    setSession((s) => ({ ...s, sub, pending: [], error: null, hint: HINTS[sub] }));
  }

  function runTap(geo: { x: number; y: number }, hit: string | null, shift: boolean) {
    const out = applyTap(doc!, session, geo, hit, shift);
    if (out.doc !== doc) commit(out.doc);
    setSession(out.session);
    if (out.modal) setModal(out.modal);
  }

  const info = session.group === "select" || session.group === "eraser" ? inspect(doc, session.pending) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-line bg-board px-3 py-1.5 text-sm"
          value={doc.name}
          onChange={(e) => rename(doc.id, e.target.value)}
        />
        <button type="button" className="btn" onClick={() => undo()} disabled={!past} title="واگرد">
          <Undo2 size={16} />
        </button>
        <button type="button" className="btn" onClick={() => redo()} disabled={!future} title="ازنو">
          <Redo2 size={16} />
        </button>
        <button type="button" className="btn" onClick={() => exportPng(doc)} title="خروجی تصویر">
          <Download size={16} />
        </button>
        <button type="button" className="btn" onClick={() => setAskClear(true)} title="پاک کردن">
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => commit({ ...doc, showGrid: !doc.showGrid })}
          title="شبکه"
        >
          <Grid3x3 size={16} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-14 flex-col items-center gap-1 border-e border-line py-2">
          {GROUPS.map((g) => {
            const Icon = ICONS[g.id as keyof typeof ICONS] ?? Ruler;
            const on = session.group === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className={`rounded-xl p-2 ${on ? "bg-orange text-white" : "text-ink hover:bg-line/40"}`}
                onClick={() => pickGroup(g.id as Exclude<Group, "select">)}
                title={g.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {session.group !== "select" && SUBS[session.group]?.length ? (
            <div className="flex flex-wrap gap-1 border-b border-line px-2 py-1">
              {SUBS[session.group].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`rounded-lg px-2 py-1 text-xs ${session.sub === s.id ? "bg-orange text-white" : "bg-board"}`}
                  onClick={() => pickSub(s.id)}
                >
                  {s.label}
                </button>
              ))}
              {session.group === "polygon" ? (
                <button type="button" className="btn text-xs" onClick={() => {
                  const out = closePolygon(doc, session);
                  if (out.doc !== doc) commit(out.doc);
                  setSession(out.session);
                }}>
                  بستن چندضلعی
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="min-h-0 flex-1">
            <BoardCanvas
              doc={doc}
              selected={session.pending}
              allowPointDrag={session.group === "select"}
              onLive={live}
              onBegin={begin}
              onTap={runTap}
            />
          </div>

          {session.hint || session.error ? (
            <p className={`border-t border-line px-3 py-2 text-sm ${session.error ? "text-red-500" : "text-muted"}`}>
              {session.error ?? session.hint}
            </p>
          ) : null}
        </div>

        {propsOpen && info ? (
          <aside className="hidden w-64 shrink-0 overflow-auto border-s border-line p-3 text-sm md:block">
            <h3 className="mb-2 font-semibold">{info.title}</h3>
            <dl className="space-y-1">
              {info.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-end">{v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        ) : null}
      </div>

      {modal ? (
        <ModalShell onClose={closeModal}>
          <ModalBody
            req={modal}
            onCancel={closeModal}
            onSubmit={(value) => {
              if (modal.kind === "number" && typeof value === "number") {
                if (session.sub === "circleRadius" && session.pending[0]) {
                  const made = addCircleRadius(doc, session.pending[0], value);
                  if (made.id) commit(made.doc);
                }
              }
              if (modal.kind === "choice" && typeof value === "string") {
                const out = applyXform(doc, session, value as never);
                if (out.doc !== doc) commit(out.doc);
                setSession(out.session);
              }
              setModal(null);
            }}
          />
        </ModalShell>
      ) : null}

      {askClear ? (
        <ModalShell onClose={closeClear}>
          <p className="mb-3">همهٔ شکل‌های تخته پاک شوند؟</p>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn" onClick={closeClear}>انصراف</button>
            <button
              type="button"
              className="btn bg-orange text-white"
              onClick={() => {
                commit(clearObjects(cleanupBroken(doc)));
                setSession(initialSession());
                setAskClear(false);
              }}
            >
              پاک کردن
            </button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function ModalShell({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-surface p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalBody({
  req,
  onCancel,
  onSubmit,
}: {
  req: NonNullable<ModalReq>;
  onCancel: () => void;
  onSubmit: (value: number | string) => void;
}) {
  const [value, setValue] = useState(req.kind === "number" ? String(req.defaultValue) : "");
  return (
    <div>
      <h3 className="mb-2 font-semibold">{req.title}</h3>
      {req.kind === "number" ? (
        <label className="block text-sm">
          {req.label}
          <input
            className="mt-1 w-full rounded-lg border border-line bg-board px-3 py-2"
            type="number"
            value={value}
            min={req.min}
            max={req.max}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
      ) : (
        <div className="flex flex-col gap-1">
          {req.options.map((o) => (
            <button key={o.id} type="button" className="btn text-start" onClick={() => onSubmit(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel}>انصراف</button>
        {req.kind === "number" ? (
          <button type="button" className="btn bg-orange text-white" onClick={() => onSubmit(Number(value))}>
            تأیید
          </button>
        ) : null}
      </div>
    </div>
  );
}

function safe(name: string) {
  return name.replace(/[^\w\u0600-\u06FF-]+/g, "_").slice(0, 40) || "board";
}

async function exportPng(doc: BoardDoc) {
  const svg = boardSvg(doc, 960, 640);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("svg load failed"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!png) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(png);
  a.download = `${safe(doc.name)}.png`;
  a.click();
}
