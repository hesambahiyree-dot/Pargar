import { useEffect, useRef, useState } from "react";
import { dragPoint, hitTest, isDraggable } from "@/lib/geometry/ops";
import { fromScreen, scene, toScreen, visibleRect } from "@/lib/geometry/svg";
import type { BoardDoc } from "@/lib/geometry/types";
import { faNum } from "@/lib/format";

type Props = {
  doc: BoardDoc;
  selected: string[];
  allowPointDrag: boolean;
  onLive: (doc: BoardDoc) => void;
  onBegin: () => void;
  onTap: (geo: { x: number; y: number }, hit: string | null, shift: boolean) => void;
};

export function BoardCanvas({ doc, selected, allowPointDrag, onLive, onBegin, onTap }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 520 });
  const docRef = useRef(doc);
  docRef.current = doc;
  const drag = useRef<{
    id: number;
    mode: "none" | "pan" | "point" | "pinch" | "hold";
    sx: number;
    sy: number;
    moved: boolean;
    pointId: string | null;
    began: boolean;
    pointers: Map<number, { x: number; y: number }>;
    pinchDist: number;
  }>({
    id: 0,
    mode: "none",
    sx: 0,
    sy: 0,
    moved: false,
    pointId: null,
    began: false,
    pointers: new Map(),
    pinchDist: 0,
  });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { w, h } = size;
  const rect = visibleRect(doc, w, h);
  const prims = scene(doc, rect);
  const selectedSet = new Set(selected);

  function local(e: { clientX: number; clientY: number }) {
    const box = host.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  function onDown(e: React.PointerEvent) {
    const p = local(e);
    drag.current.pointers.set(e.pointerId, p);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (drag.current.pointers.size === 2) {
      const [a, b] = [...drag.current.pointers.values()];
      drag.current.mode = "pinch";
      drag.current.pinchDist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      return;
    }
    const geo = fromScreen(p, docRef.current, w, h);
    const tol = 14 / docRef.current.view.scale;
    const hit = hitTest(docRef.current, geo, tol);
    const obj = docRef.current.objects.find((o) => o.id === hit);
    drag.current.mode = "pan";
    drag.current.pointId = null;
    drag.current.moved = false;
    drag.current.began = false;
    drag.current.sx = p.x;
    drag.current.sy = p.y;
    drag.current.id = e.pointerId;
    if (allowPointDrag && obj && isDraggable(obj)) {
      drag.current.mode = "point";
      drag.current.pointId = obj.id;
    } else if (hit) {
      drag.current.mode = "hold";
    }
  }

  function onMove(e: React.PointerEvent) {
    const p = local(e);
    if (drag.current.pointers.has(e.pointerId)) drag.current.pointers.set(e.pointerId, p);
    const current = docRef.current;
    if (drag.current.mode === "pinch" && drag.current.pointers.size >= 2) {
      const [a, b] = [...drag.current.pointers.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const mid = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 };
      if (drag.current.pinchDist > 8) {
        const factor = dist / drag.current.pinchDist;
        zoomAt(current, mid, factor, w, h, onLive);
      }
      drag.current.pinchDist = dist;
      return;
    }
    if (e.pointerId !== drag.current.id || drag.current.mode === "none") return;
    const dx = p.x - drag.current.sx;
    const dy = p.y - drag.current.sy;
    if (Math.hypot(dx, dy) > 5) drag.current.moved = true;
    if (!drag.current.moved) return;
    if (drag.current.mode === "hold") return;
    if (drag.current.mode === "point" && drag.current.pointId) {
      if (!drag.current.began) {
        drag.current.began = true;
        onBegin();
      }
      const geo = fromScreen(p, current, w, h);
      onLive(dragPoint(current, drag.current.pointId, geo, current.snap));
    } else if (drag.current.mode === "pan") {
      onLive({
        ...current,
        view: {
          ...current.view,
          cx: current.view.cx - dx / current.view.scale,
          cy: current.view.cy + dy / current.view.scale,
        },
      });
    }
    drag.current.sx = p.x;
    drag.current.sy = p.y;
  }

  function onUp(e: React.PointerEvent) {
    const p = local(e);
    drag.current.pointers.delete(e.pointerId);
    if (drag.current.mode === "pinch") {
      if (drag.current.pointers.size < 2) drag.current.mode = "none";
      return;
    }
    if (e.pointerId !== drag.current.id) return;
    if (!drag.current.moved || drag.current.mode === "hold") {
      const geo = fromScreen(p, docRef.current, w, h);
      const tol = 14 / docRef.current.view.scale;
      const hit = hitTest(docRef.current, geo, tol);
      onTap(geo, hit, e.shiftKey);
    }
    drag.current.mode = "none";
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const p = local(e);
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    zoomAt(docRef.current, p, factor, w, h, onLive);
  }

  const origin = toScreen({ x: 0, y: 0 }, doc, w, h);
  const step = doc.view.scale;
  const grid: React.ReactNode[] = [];
  if (doc.showGrid && step >= 8) {
    const ox = origin.x;
    const oy = origin.y;
    for (let x = ox % step; x < w; x += step) {
      grid.push(<line key={`vx${x}`} x1={x} y1={0} x2={x} y2={h} stroke="var(--grid)" strokeWidth={1} />);
    }
    for (let y = oy % step; y < h; y += step) {
      grid.push(<line key={`hy${y}`} x1={0} y1={y} x2={w} y2={y} stroke="var(--grid)" strokeWidth={1} />);
    }
  }

  return (
    <div ref={host} className="relative h-full min-h-64 w-full overflow-hidden bg-board">
      <svg
        width={w}
        height={h}
        className="touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={onWheel}
      >
        <rect width={w} height={h} fill="var(--board)" />
        {grid}
        {doc.showAxes ? (
          <>
            <line x1={0} y1={origin.y} x2={w} y2={origin.y} stroke="var(--muted)" strokeWidth={1.25} />
            <line x1={origin.x} y1={0} x2={origin.x} y2={h} stroke="var(--muted)" strokeWidth={1.25} />
          </>
        ) : null}
        {prims.map((p) => {
          const on = selectedSet.has(p.id);
          if (p.t === "polygon") {
            const pts = p.pts.map((pt) => toScreen(pt, doc, w, h));
            return (
              <polygon
                key={p.id}
                points={pts.map((q) => `${q.x},${q.y}`).join(" ")}
                fill={on ? "color-mix(in srgb, var(--orange) 28%, transparent)" : "color-mix(in srgb, var(--blue) 16%, transparent)"}
                stroke={on ? "var(--orange)" : "var(--blue)"}
                strokeWidth={on ? 3 : 2}
              />
            );
          }
          if (p.t === "line") {
            const a = toScreen(p.a, doc, w, h);
            const b = toScreen(p.b, doc, w, h);
            const mid = toScreen({ x: (p.a.x + p.b.x) / 2, y: (p.a.y + p.b.y) / 2 }, doc, w, h);
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            const s = 12;
            return (
              <g key={p.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={on ? "var(--orange)" : p.aux ? "var(--teal)" : "var(--ink)"}
                  strokeWidth={on ? 3 : p.aux ? 1.5 : 2}
                  strokeDasharray={p.dashed ? "7 5" : undefined}
                />
                {p.arrow ? (
                  <polygon
                    points={`${b.x},${b.y} ${b.x - s * Math.cos(ang - 0.45)},${b.y - s * Math.sin(ang - 0.45)} ${b.x - s * Math.cos(ang + 0.45)},${b.y - s * Math.sin(ang + 0.45)}`}
                    fill="var(--ink)"
                  />
                ) : null}
                {doc.showMeasures && p.kind === "segment" && !p.aux ? (
                  <text x={mid.x + 8} y={mid.y - 8} fill="var(--muted)" fontSize={13} fontFamily="Vazirmatn, sans-serif">
                    {faNum(Math.hypot(p.b.x - p.a.x, p.b.y - p.a.y))}
                  </text>
                ) : null}
              </g>
            );
          }
          if (p.t === "circle") {
            const c = toScreen(p.c, doc, w, h);
            return (
              <circle
                key={p.id}
                cx={c.x}
                cy={c.y}
                r={p.r * doc.view.scale}
                fill="none"
                stroke={on ? "var(--orange)" : "var(--blue)"}
                strokeWidth={on ? 3 : 2}
              />
            );
          }
          if (p.t === "arc") {
            const s = toScreen(p.start, doc, w, h);
            const e = toScreen(p.end, doc, w, h);
            const r = p.r * doc.view.scale;
            return (
              <path
                key={p.id}
                d={`M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`}
                fill="none"
                stroke={on ? "var(--orange)" : "var(--orange)"}
                strokeWidth={3}
              />
            );
          }
          if (p.t === "angle") {
            const v = toScreen(p.v, doc, w, h);
            const a = toScreen(p.a, doc, w, h);
            const b = toScreen(p.b, doc, w, h);
            const ra = Math.hypot(a.x - v.x, a.y - v.y) || 1;
            const rb = Math.hypot(b.x - v.x, b.y - v.y) || 1;
            const rad = 26;
            const a1 = { x: v.x + ((a.x - v.x) / ra) * rad, y: v.y + ((a.y - v.y) / ra) * rad };
            const b1 = { x: v.x + ((b.x - v.x) / rb) * rad, y: v.y + ((b.y - v.y) / rb) * rad };
            return (
              <g key={p.id}>
                <path d={`M ${a1.x} ${a1.y} A ${rad} ${rad} 0 0 1 ${b1.x} ${b1.y}`} fill="none" stroke="var(--orange)" strokeWidth={2} />
                <text x={(a1.x + b1.x) / 2} y={(a1.y + b1.y) / 2} fill="var(--ink)" fontSize={12} fontFamily="Vazirmatn, sans-serif">
                  {faNum(p.deg, 1)}°
                </text>
              </g>
            );
          }
          const s = toScreen(p.p, doc, w, h);
          return (
            <g key={p.id}>
              <circle cx={s.x} cy={s.y} r={on ? 7 : 5} fill={on ? "var(--orange)" : "var(--blue)"} stroke="var(--board)" strokeWidth={2} />
              {p.label ? (
                <text x={s.x + 8} y={s.y - 8} fill="var(--ink)" fontSize={14} fontFamily="Vazirmatn, sans-serif">
                  {p.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function zoomAt(
  doc: BoardDoc,
  screen: { x: number; y: number },
  factor: number,
  w: number,
  h: number,
  onLive: (doc: BoardDoc) => void,
) {
  const geo = fromScreen(screen, doc, w, h);
  const scale = Math.min(180, Math.max(18, doc.view.scale * factor));
  onLive({
    ...doc,
    view: {
      scale,
      cx: geo.x - (screen.x - w / 2) / scale,
      cy: geo.y + (screen.y - h / 2) / scale,
    },
  });
}
