import { useRef, useState } from "react";
import { faNum } from "@/lib/format";

type Kind = "sphere" | "cone" | "pyramid" | "cylinder" | "cube";

const PI = Math.PI;

export function SolidView({ kind }: { kind: Kind }) {
  const [yaw, setYaw] = useState(0.7);
  const [pitch, setPitch] = useState(0.45);
  const [radius, setRadius] = useState(2);
  const [height, setHeight] = useState(3);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  const r = radius;
  const h = height;
  const volume =
    kind === "sphere" ? (4 / 3) * PI * r ** 3 : kind === "cylinder" ? PI * r * r * h : kind === "cube" ? r * r * r : kind === "cone" ? (1 / 3) * PI * r * r * h : (1 / 3) * r * r * h;
  const surface =
    kind === "sphere"
      ? 4 * PI * r * r
      : kind === "cylinder"
        ? 2 * PI * r * h
        : kind === "cube"
          ? 6 * r * r
          : kind === "cone"
          ? PI * r * Math.hypot(r, h)
          : null;

  const paths = wire(kind, r, h, yaw, pitch);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-board">
      <svg
        viewBox="-180 -160 360 300"
        className="h-72 w-full touch-none bg-board"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setYaw(drag.current.yaw + (e.clientX - drag.current.x) * 0.01);
          setPitch(Math.max(-1.1, Math.min(1.1, drag.current.pitch + (e.clientY - drag.current.y) * 0.008)));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} fill="color-mix(in srgb, var(--teal) 18%, transparent)" stroke="var(--navy)" strokeWidth={1.6} />
        ))}
      </svg>
      <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2">
        <label className="text-sm">
          {kind === "cube" ? "طول یال" : "شعاع"}: <b className="num">{faNum(radius, 1)}</b>
          <input className="mt-1 w-full accent-blue" type="range" min={1} max={5} step={0.1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
        {kind === "sphere" || kind === "cube" ? null : (
          <label className="text-sm">
            ارتفاع: <b className="num">{faNum(height, 1)}</b>
            <input className="mt-1 w-full accent-orange" type="range" min={1} max={6} step={0.1} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          </label>
        )}
        <p className="text-sm leading-7 sm:col-span-2">
          حجم ≈ <b className="num">{faNum(volume)}</b>
          {surface != null ? (
            <>
              {" "}
              · سطح مرتبط ≈ <b className="num">{faNum(surface)}</b>
            </>
          ) : null}
          . مدل را با انگشت یا ماوس بچرخانید. این نمایش حجم است، نه اثبات.
        </p>
      </div>
    </div>
  );
}

function project(x: number, y: number, z: number, yaw: number, pitch: number): [number, number] {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  const y1 = y * cp - z1 * sp;
  return [x1 * 42, -y1 * 42];
}

function pathOf(pts: [number, number][]): string {
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z";
}

function wire(kind: Kind, r: number, h: number, yaw: number, pitch: number): string[] {
  const ring = (y: number, rad: number, n = 28) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push(project(Math.cos(t) * rad, y, Math.sin(t) * rad, yaw, pitch));
    }
    return pts;
  };
  if (kind === "sphere") {
    return [0, 45, 90].map((deg) => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 36; i++) {
        const t = (i / 36) * Math.PI * 2;
        const a = (deg * Math.PI) / 180;
        pts.push(project(Math.cos(t) * Math.cos(a) * r, Math.sin(t) * r, Math.cos(t) * Math.sin(a) * r, yaw, pitch));
      }
      return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    });
  }
  if (kind === "cylinder") {
    const top = ring(h / 2, r);
    const bot = ring(-h / 2, r);
    return [pathOf(top), pathOf(bot), `M${top[0]![0]} ${top[0]![1]} L${bot[0]![0]} ${bot[0]![1]}`, `M${top[14]![0]} ${top[14]![1]} L${bot[14]![0]} ${bot[14]![1]}`];
  }
  if (kind === "cone") {
    const base = ring(-h / 2, r);
    const apex = project(0, h / 2, 0, yaw, pitch);
    return [pathOf(base), `M${base[0]![0]} ${base[0]![1]} L${apex[0]} ${apex[1]}`, `M${base[14]![0]} ${base[14]![1]} L${apex[0]} ${apex[1]}`];
  }
  if (kind === "cube") {
    const s = r / 2;
    const c = [
      project(-s, -s, -s, yaw, pitch),
      project(s, -s, -s, yaw, pitch),
      project(s, s, -s, yaw, pitch),
      project(-s, s, -s, yaw, pitch),
      project(-s, -s, s, yaw, pitch),
      project(s, -s, s, yaw, pitch),
      project(s, s, s, yaw, pitch),
      project(-s, s, s, yaw, pitch),
    ];
    const faces = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [2, 3, 7, 6],
      [1, 2, 6, 5],
      [0, 3, 7, 4],
    ];
    return faces.map((f) => pathOf(f.map((i) => c[i]!)));
  }
  const y = -h / 2;
  const corners = [
    project(-r, y, -r, yaw, pitch),
    project(r, y, -r, yaw, pitch),
    project(r, y, r, yaw, pitch),
    project(-r, y, r, yaw, pitch),
  ];
  const apex = project(0, h / 2, 0, yaw, pitch);
  return [pathOf(corners), ...corners.map((c) => `M${c[0]} ${c[1]} L${apex[0]} ${apex[1]}`)];
}
