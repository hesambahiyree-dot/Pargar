import { Maximize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { boardBounds, getPoint, hitTest, isDraggable } from "@/lib/geometry/engine";
import { faNum } from "@/lib/geometry/format";
import { getLesson } from "@/lib/geometry/lessons";
import { renderBoard, screenToWorld, type Camera } from "@/lib/geometry/render";
import { useBoard } from "@/lib/geometry/store";
import { Button } from "@/components/ui/button";

function fitCamera(cam: Camera, w: number, h: number, objects: ReturnType<typeof useBoard.getState>["objects"]) {
  const b = boardBounds(objects);
  if (!b) { cam.scale = 48; cam.ox = w / 2; cam.oy = h / 2; return; }
  const pad = 72;
  const bw = Math.max(4, b.maxX - b.minX);
  const bh = Math.max(3, b.maxY - b.minY);
  cam.scale = Math.max(28, Math.min(64, Math.min((w - pad * 2) / bw, (h - pad * 2) / bh)));
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  cam.ox = w / 2 - cx * cam.scale;
  cam.oy = h / 2 + cy * cam.scale;
}

export function GeometryCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<Camera>({ scale: 48, ox: 0, oy: 0 });
  const hoverRef = useRef<string | null>(null);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const panRef = useRef<{ pointerId: number; x: number; y: number; ox: number; oy: number } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const spaceRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const [hud, setHud] = useState("");
  const fitNonce = useBoard((s) => s.fitNonce);
  const tool = useBoard((s) => s.tool);
  const fitView = useBoard((s) => s.fitView);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const parent = canvas.parentElement; if (!parent) return;
    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const cam = camRef.current;
      if (cam.ox === 0 && cam.oy === 0) fitCamera(cam, rect.width, rect.height, useBoard.getState().objects);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(parent);
    let raf = 0;
    const loop = () => {
      const ctx = canvas.getContext("2d");
      const { w, h, dpr } = sizeRef.current;
      if (ctx && w > 0) {
        const st = useBoard.getState();
        const lesson = st.lessonId ? getLesson(st.lessonId) : undefined;
        const step = lesson?.steps[st.lessonStep];
        renderBoard(ctx, { objects: st.objects, camera: camRef.current, width: w, height: h, dpr, selected: st.selected, hoverId: hoverRef.current, highlight: step?.highlight ?? [], pending: st.pending, cursor: cursorRef.current, settings: st.settings });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  useEffect(() => { const { w, h } = sizeRef.current; if (w > 0) fitCamera(camRef.current, w, h, useBoard.getState().objects); }, [fitNonce]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space") spaceRef.current = true; };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") spaceRef.current = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const local = (e: { clientX: number; clientY: number }) => { const canvas = canvasRef.current!; const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault(); const cam = camRef.current; const p = local(e); const world = screenToWorld(cam, p.x, p.y);
    const factor = e.deltaY < 0 ? 1.08 : 0.92; cam.scale = Math.max(16, Math.min(140, cam.scale * factor));
    const after = { x: cam.ox + world.x * cam.scale, y: cam.oy - world.y * cam.scale }; cam.ox += p.x - after.x; cam.oy += p.y - after.y;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current; if (!canvas) return; canvas.setPointerCapture(e.pointerId); const p = local(e); pointersRef.current.set(e.pointerId, p);
    if (pointersRef.current.size === 2) { const pts = [...pointersRef.current.values()]; const d = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y); pinchRef.current = { dist: d, scale: camRef.current.scale }; dragRef.current = null; panRef.current = null; return; }
    const pan = e.button === 1 || e.button === 2 || spaceRef.current;
    if (pan) { panRef.current = { pointerId: e.pointerId, x: p.x, y: p.y, ox: camRef.current.ox, oy: camRef.current.oy }; return; }
    const st = useBoard.getState(); const world = screenToWorld(camRef.current, p.x, p.y); const hit = hitTest(st.objects, world, 14 / camRef.current.scale);
    if (st.tool === "select" && hit?.kind === "point") { const pt = getPoint(st.objects, hit.id); if (pt && isDraggable(pt)) { st.commitHistory(); dragRef.current = { id: hit.id, pointerId: e.pointerId }; st.select([hit.id]); return; } }
    st.click(world, camRef.current.scale, hit?.id ?? null, hit?.kind ?? null);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = local(e); if (pointersRef.current.has(e.pointerId)) pointersRef.current.set(e.pointerId, p);
    if (pointersRef.current.size === 2 && pinchRef.current) { const pts = [...pointersRef.current.values()]; const d = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y); if (pinchRef.current.dist > 8) camRef.current.scale = Math.max(16, Math.min(140, pinchRef.current.scale * (d / pinchRef.current.dist))); return; }
    if (panRef.current && panRef.current.pointerId === e.pointerId) { camRef.current.ox = panRef.current.ox + (p.x - panRef.current.x); camRef.current.oy = panRef.current.oy + (p.y - panRef.current.y); return; }
    const world = screenToWorld(camRef.current, p.x, p.y); cursorRef.current = world; const st = useBoard.getState(); setHud(`(${faNum(world.x, 1)}٬ ${faNum(world.y, 1)})`);
    if (dragRef.current && dragRef.current.pointerId === e.pointerId) { st.movePoint(dragRef.current.id, world.x, world.y); return; }
    const hit = hitTest(st.objects, world, 14 / camRef.current.scale); hoverRef.current = hit?.id ?? null;
  };
  const onPointerUp = (e: React.PointerEvent) => { pointersRef.current.delete(e.pointerId); if (dragRef.current?.pointerId === e.pointerId) { dragRef.current = null; useBoard.getState().persist(); } if (panRef.current?.pointerId === e.pointerId) panRef.current = null; if (pointersRef.current.size < 2) pinchRef.current = null; };
  const cursor = tool === "delete" ? "cell" : tool === "select" ? "default" : spaceRef.current ? "grab" : "crosshair";
  return <div className="relative h-full w-full"><canvas ref={canvasRef} className="block h-full w-full touch-none" style={{ cursor }} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onContextMenu={(e) => e.preventDefault()} /><div className="pointer-events-none absolute start-3 top-3 font-medium tabular-nums text-xs text-muted">{hud}</div><Button type="button" size="icon-sm" variant="secondary" className="absolute end-3 top-3" aria-label="جا شدن در قاب" onClick={fitView}><Maximize2 className="size-4" /></Button></div>;
}
