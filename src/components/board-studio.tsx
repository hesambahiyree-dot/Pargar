import { useEffect, useState } from "react";
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
import type { BoardDoc } from "@/lib/geometry/types";
import { inspect } from "@/lib/inspect";
import { applyTap, applyXform, closePolygon, type ModalReq } from "@/lib/interact";
import { useBoards } from "@/lib/store";
import { GROUPS, HINTS, SUBS, initialSession, type Group, type Session, type Sub } from "@/lib/tools";
import {
  IconBtn,
  Toggle,
  NumberDialog,
  RotateDialog,
  ComponentDialog,
  downloadText,
  exportPng,
  safe,
} from "./board-studio-helpers";

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
  const point = doc.objects.find((o) => o.id === session.pending[0] && o.kind === "point");

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-line bg-board px-2 py-1.5">
        <input
          aria-label="نام تخته"
          value={doc.name}
          onChange={(e) => rename(doc.id, e.target.value)}
          className="h-10 min-w-28 max-w-[40vw] rounded-xl border border-line bg-paper px-2 text-sm font-bold"
        />
        <IconBtn label="برگرداندن" disabled={!past} onClick={undo}>
          <Undo2 className="size-4" />
        </IconBtn>
        <IconBtn label="از نو" disabled={!future} onClick={redo}>
          <Redo2 className="size-4" />
        </IconBtn>
        <IconBtn label="بزرگ‌نمایی" onClick={() => live({ ...doc, view: { ...doc.view, scale: Math.min(180, doc.view.scale * 1.15) } })}>
          +
        </IconBtn>
        <IconBtn label="کوچک‌نمایی" onClick={() => live({ ...doc, view: { ...doc.view, scale: Math.max(18, doc.view.scale / 1.15) } })}>
          −
        </IconBtn>
        <Toggle on={doc.snap} label="چسباندن به شبکه" onClick={() => commit({ ...doc, snap: !doc.snap })}>
          <Grid3x3 className="size-4" />
        </Toggle>
        <IconBtn label="خروجی تصویر" onClick={() => void exportPng(doc)}>
          <Download className="size-4" />
        </IconBtn>
        <IconBtn label="پاک کردن تخته" onClick={() => setAskClear(true)}>
          <Trash2 className="size-4" />
        </IconBtn>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-e border-line bg-board py-2">
          {GROUPS.map((g) => {
            const Icon = ICONS[g.id as keyof typeof ICONS] ?? Ruler;
            const on = session.group === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className={`rounded-xl p-2 ${on ? "bg-navy text-paper" : "text-ink hover:bg-paper"}`}
                onClick={() => pickGroup(g.id as Exclude<Group, "select">)}
                title={g.label}
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {session.group !== "select" && SUBS[session.group]?.length ? (
            <div className="flex flex-wrap gap-1 border-b border-line bg-board px-2 py-1">
              {SUBS[session.group].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${session.sub === s.id ? "bg-navy text-paper" : "bg-paper"}`}
                  onClick={() => pickSub(s.id)}
                >
                  {s.label}
                </button>
              ))}
              {session.sub === "polygon" ? (
                <button
                  type="button"
                  className="rounded-lg bg-teal/20 px-2 py-1 text-xs font-bold"
                  onClick={() => {
                    const out = closePolygon(doc, session);
                    if (out.doc !== doc) commit(out.doc);
                    setSession(out.session);
                  }}
                >
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
            <p className={`border-t border-line px-3 py-2 text-sm ${session.error ? "text-red-600" : "text-muted"}`}>
              {session.error ?? session.hint}
            </p>
          ) : null}
        </div>

        {propsOpen && info ? (
          <aside className="hidden w-64 shrink-0 overflow-auto border-s border-line bg-board p-3 text-sm md:block">
            <h3 className="mb-2 font-black">{info.title}</h3>
            <dl className="space-y-1">
              {info.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-end font-bold">{typeof v === "number" ? faNum(v) : v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        ) : null}
      </div>

      {modal?.t === "radius" ? (
        <NumberDialog
          title="شعاع دایره"
          label="شعاع را به واحد تخته وارد کنید."
          onClose={closeModal}
          onOk={(n) => {
            const center = session.pending[0];
            if (!center) return;
            const made = addCircleRadius(doc, center, n);
            if (!made.id) setSession((s) => ({ ...s, error: made.error ?? "ساخته نشد." }));
            else {
              commit(made.doc);
              setSession((s) => ({ ...s, pending: [], error: null }));
            }
            closeModal();
          }}
        />
      ) : null}
      {modal?.t === "rotate" ? (
        <RotateDialog
          onClose={closeModal}
          onOk={(deg) => {
            const center = session.pending[1];
            if (!center) return;
            const out = applyXform(doc, session, { t: "rotate", center, deg });
            if (out.doc !== doc) commit(out.doc);
            setSession(out.session);
            closeModal();
          }}
        />
      ) : null}
      {modal?.t === "translate" ? (
        <ComponentDialog
          onClose={closeModal}
          onOk={(x, y) => {
            const out = applyXform(doc, session, { t: "translate", dx: x, dy: y });
            if (out.doc !== doc) commit(out.doc);
            setSession(out.session);
            closeModal();
          }}
        />
      ) : null}
      {modal?.t === "scale" ? (
        <NumberDialog
          title="ضریب تجانس"
          label="ضریب مقیاس را وارد کنید."
          onClose={closeModal}
          allowNegative
          onOk={(n) => {
            const center = session.pending[1];
            if (!center) return;
            const out = applyXform(doc, session, { t: "scale", center, k: n });
            if (out.doc !== doc) commit(out.doc);
            setSession(out.session);
            closeModal();
          }}
        />
      ) : null}

      {askClear ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/55 p-3">
          <div className="w-full max-w-sm rounded-3xl bg-board p-5">
            <p className="font-bold">همهٔ شکل‌های تخته پاک شوند؟</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="h-11 flex-1 rounded-xl bg-paper font-bold" onClick={closeClear}>
                انصراف
              </button>
              <button
                type="button"
                className="h-11 flex-1 rounded-xl bg-navy font-bold text-paper"
                onClick={() => {
                  commit(clearObjects(cleanupBroken(doc)));
                  setSession(initialSession());
                  setAskClear(false);
                }}
              >
                پاک کردن
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
