/** Pure plane geometry. Independent of the UI and of pixels. */

export type V = { x: number; y: number };

export const EPS = 1e-8;

export const v = (x: number, y: number): V => ({ x, y });
export const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k });
export const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
export const cross = (a: V, b: V) => a.x * b.y - a.y * b.x;
export const len = (a: V) => Math.hypot(a.x, a.y);
export const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y);

export function nearly(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

export function nearlyV(a: V, b: V, eps = 1e-6): boolean {
  return dist(a, b) <= eps;
}

export function finiteV(p: V | null | undefined): p is V {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
}

/** Signed degrees from u to w, in (-180, 180]. Positive is counterclockwise. */
export function signedAngleDeg(u: V, w: V): number {
  return (Math.atan2(cross(u, w), dot(u, w)) * 180) / Math.PI;
}

export function angleDeg(u: V, w: V): number {
  const m = len(u) * len(w);
  if (m < EPS) return NaN;
  const c = Math.min(1, Math.max(-1, dot(u, w) / m));
  return (Math.acos(c) * 180) / Math.PI;
}

export function rotateAround(p: V, c: V, deg: number): V {
  const r = (deg * Math.PI) / 180;
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}

export function rotateVec(d: V, deg: number): V {
  return rotateAround(d, { x: 0, y: 0 }, deg);
}

/** Reflection of p across the line through a and b. */
export function reflectPoint(p: V, a: V, b: V): V | null {
  const ab = sub(b, a);
  const L2 = dot(ab, ab);
  if (L2 < EPS) return null;
  const t = dot(sub(p, a), ab) / L2;
  const proj = add(a, mul(ab, t));
  return add(proj, sub(proj, p));
}

export function projectParam(p: V, a: V, b: V): number | null {
  const ab = sub(b, a);
  const L2 = dot(ab, ab);
  if (L2 < EPS) return null;
  return dot(sub(p, a), ab) / L2;
}

export function pointOn(a: V, b: V, t: number): V {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function lineLineIntersection(a: V, b: V, c: V, d: V): V | null {
  const r = sub(b, a);
  const s = sub(d, c);
  const den = cross(r, s);
  const scale = len(r) * len(s);
  if (Math.abs(den) <= EPS * (scale + 1)) return null;
  const t = cross(sub(c, a), s) / den;
  const p = add(a, mul(r, t));
  return finiteV(p) ? p : null;
}

export function lineCircleIntersection(a: V, b: V, c: V, r: number): V[] {
  const d = sub(b, a);
  const A = dot(d, d);
  if (A < EPS || !(r >= 0)) return [];
  const f = sub(a, c);
  const B = 2 * dot(d, f);
  const C = dot(f, f) - r * r;
  const disc = B * B - 4 * A * C;
  if (disc < -1e-7) return [];
  const sd = Math.sqrt(Math.max(0, disc));
  const ts = disc <= 1e-7 ? [-B / (2 * A)] : [(-B - sd) / (2 * A), (-B + sd) / (2 * A)];
  return ts.map((t) => add(a, mul(d, t))).filter(finiteV);
}

export function circleCircleIntersection(c1: V, r1: number, c2: V, r2: number): V[] {
  const d = dist(c1, c2);
  if (d < EPS || !(r1 >= 0) || !(r2 >= 0)) return [];
  if (d > r1 + r2 + 1e-7) return [];
  if (d < Math.abs(r1 - r2) - 1e-7) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a;
  if (h2 < -1e-7) return [];
  const h = Math.sqrt(Math.max(0, h2));
  const dir = sub(c2, c1);
  const p = add(c1, mul(dir, a / d));
  if (h <= 1e-7) return [p];
  const rx = -(dir.y) * (h / d);
  const ry = dir.x * (h / d);
  return [
    { x: p.x + rx, y: p.y + ry },
    { x: p.x - rx, y: p.y - ry },
  ];
}

export function shoelace(pts: V[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    s += pts[i]!.x * pts[j]!.y - pts[j]!.x * pts[i]!.y;
  }
  return s / 2;
}

export function polygonArea(pts: V[]): number {
  return Math.abs(shoelace(pts));
}

export function centroid(pts: V[]): V {
  if (pts.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

function orient(a: V, b: V, c: V): number {
  return cross(sub(b, a), sub(c, a));
}

/** Proper crossing of open segments, not mere endpoint contact. */
export function segmentsCross(a: V, b: V, c: V, d: V): boolean {
  const d1 = orient(a, b, c);
  const d2 = orient(a, b, d);
  const d3 = orient(c, d, a);
  const d4 = orient(c, d, b);
  if (Math.abs(d1) < 1e-9 || Math.abs(d2) < 1e-9 || Math.abs(d3) < 1e-9 || Math.abs(d4) < 1e-9) {
    return false;
  }
  return d1 * d2 < 0 && d3 * d4 < 0;
}

export function selfIntersects(pts: V[]): boolean {
  const n = pts.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === n - 1);
      if (adjacent) continue;
      if (segmentsCross(pts[i]!, pts[(i + 1) % n]!, pts[j]!, pts[(j + 1) % n]!)) return true;
    }
  }
  return false;
}

export function interiorAngles(pts: V[]): number[] {
  const ccw = shoelace(pts) >= 0;
  const n = pts.length;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]!;
    const cur = pts[i]!;
    const next = pts[(i + 1) % n]!;
    const incoming = sub(cur, prev);
    const outgoing = sub(next, cur);
    const turn = signedAngleDeg(incoming, outgoing);
    let interior = ccw ? 180 - turn : 180 + turn;
    interior = ((interior % 360) + 360) % 360;
    if (interior === 0) interior = 360;
    out.push(interior);
  }
  return out;
}

export function circumcircle(a: V, b: V, c: V): { center: V; r: number } | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < EPS) return null;
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const ux = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
  const uy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
  const center = { x: ux, y: uy };
  if (!finiteV(center)) return null;
  return { center, r: dist(center, a) };
}

export function parallelDir(ab: V, cd: V, rel = 1e-6): boolean {
  const m = len(ab) * len(cd);
  if (m < EPS) return false;
  return Math.abs(cross(ab, cd)) <= rel * m;
}

export function perpDir(ab: V, cd: V, rel = 1e-6): boolean {
  const m = len(ab) * len(cd);
  if (m < EPS) return false;
  return Math.abs(dot(ab, cd)) <= rel * m;
}

export type Rect = { minX: number; minY: number; maxX: number; maxY: number };

export function clipLine(a: V, b: V, rect: Rect): [V, V] | null {
  return clipParam(a, b, rect, -1e9, 1e9);
}

export function clipRay(a: V, b: V, rect: Rect): [V, V] | null {
  return clipParam(a, b, rect, 0, 1e9);
}

function clipParam(a: V, b: V, rect: Rect, tMin: number, tMax: number): [V, V] | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.hypot(dx, dy) < EPS) return null;
  const u = { a: tMin, b: tMax };
  const ok =
    clipSide(-dx, a.x - rect.minX, u) &&
    clipSide(dx, rect.maxX - a.x, u) &&
    clipSide(-dy, a.y - rect.minY, u) &&
    clipSide(dy, rect.maxY - a.y, u);
  if (!ok || u.a > u.b) return null;
  return [pointOn(a, b, u.a), pointOn(a, b, u.b)];
}

function clipSide(p: number, q: number, u: { a: number; b: number }): boolean {
  if (Math.abs(p) < EPS) return q >= -1e-9;
  const t = q / p;
  if (p < 0) {
    if (t > u.b) return false;
    if (t > u.a) u.a = t;
  } else {
    if (t < u.a) return false;
    if (t < u.b) u.b = t;
  }
  return true;
}

export function snapPoint(p: V, step = 0.5): V {
  return {
    x: Math.round(p.x / step) * step,
    y: Math.round(p.y / step) * step,
  };
}

export function distToSegment(p: V, a: V, b: V): number {
  const t = projectParam(p, a, b);
  if (t == null) return dist(p, a);
  const u = Math.min(1, Math.max(0, t));
  return dist(p, pointOn(a, b, u));
}

export function distToLine(p: V, a: V, b: V): number {
  const ab = sub(b, a);
  const L = len(ab);
  if (L < EPS) return dist(p, a);
  return Math.abs(cross(ab, sub(p, a))) / L;
}

export function distToRay(p: V, a: V, b: V): number {
  const t = projectParam(p, a, b);
  if (t == null) return dist(p, a);
  if (t < 0) return dist(p, a);
  return dist(p, pointOn(a, b, t));
}
