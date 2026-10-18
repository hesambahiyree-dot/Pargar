import {
  angleDeg,
  centroid,
  dist,
  interiorAngles,
  nearly,
  nearlyV,
  parallelDir,
  perpDir,
  polygonArea,
  reflectPoint,
  selfIntersects,
  sub,
  type V,
} from "./math.ts";

export type Equality = "exact" | "approx" | "no" | "unknown";

export type PolygonReport = {
  n: number;
  valid: boolean;
  reason?: string;
  selfIntersecting: boolean;
  convex: boolean | null;
  regular: Equality;
  sideEquality: Equality;
  angleEquality: Equality;
  sides: number[];
  angles: number[];
  perimeter: number | null;
  area: number | null;
  diagonalCount: number | null;
  names: string[];
  symmetries: string[];
  triangle?: {
    bySides: string;
    byAngles: string;
    angleSum: number;
    pythagoras: "holds" | "fails" | "approx" | "na";
  };
  quad?: {
    diagonals: [number, number];
    diagonalsPerp: Equality;
    diagonalsEqual: Equality;
    diagonalsBisect: Equality;
  };
};

const EXACT = 1e-6;
const APPROX_REL = 0.02;
const ANG_EXACT = 0.05;
const ANG_APPROX = 1.2;

function relClose(a: number, b: number, rel: number, abs: number): boolean {
  return Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b), 1));
}

function equality(values: number[], exactAbs: number, approxAbs: number, approxRel: number): Equality {
  if (values.length === 0 || values.some((v) => !Number.isFinite(v))) return "unknown";
  const base = values[0]!;
  if (values.every((v) => relClose(v, base, 0, exactAbs) || relClose(v, base, 1e-6, exactAbs))) return "exact";
  if (values.every((v) => relClose(v, base, approxRel, approxAbs))) return "approx";
  return "no";
}

function hasReflectionSymmetry(pts: V[]): number {
  if (pts.length < 3) return 0;
  const c = centroid(pts);
  const candidates: V[] = [];
  for (const p of pts) candidates.push(p);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    candidates.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }
  let count = 0;
  const used: V[] = [];
  for (const dir of candidates) {
    if (dist(dir, c) < 1e-6) continue;
    const axisB = dir;
    if (used.some((u) => {
      const cr = (u.x - c.x) * (axisB.y - c.y) - (u.y - c.y) * (axisB.x - c.x);
      const dt = (u.x - c.x) * (axisB.x - c.x) + (u.y - c.y) * (axisB.y - c.y);
      return Math.abs(cr) < 1e-4 * (dist(u, c) * dist(axisB, c) + 1) && dt > 0;
    })) {
      continue;
    }
    const ok = pts.every((p) => {
      const r = reflectPoint(p, c, axisB);
      return r != null && pts.some((q) => nearlyV(q, r, 1e-3));
    });
    if (ok) {
      count++;
      used.push(dir);
    }
  }
  return count;
}

function hasHalfTurn(pts: V[]): boolean {
  const c = centroid(pts);
  return pts.every((p) => pts.some((q) => nearlyV(q, { x: 2 * c.x - p.x, y: 2 * c.y - p.y }, 1e-3)));
}

export function classifyPolygon(pts: V[]): PolygonReport {
  const n = pts.length;
  const blank = (reason: string, partial?: Partial<PolygonReport>): PolygonReport => ({
    n,
    valid: false,
    reason,
    selfIntersecting: n >= 4 && selfIntersects(pts),
    convex: null,
    regular: "unknown",
    sideEquality: "unknown",
    angleEquality: "unknown",
    sides: [],
    angles: [],
    perimeter: null,
    area: null,
    diagonalCount: null,
    names: [],
    symmetries: [],
    ...partial,
  });
  if (n < 3) return blank("برای چندضلعی حداقل سه رأس لازم است.");
  const sides: number[] = [];
  for (let i = 0; i < n; i++) sides.push(dist(pts[i]!, pts[(i + 1) % n]!));
  if (sides.some((s) => s < 1e-6)) return blank("دو رأس روی هم افتاده‌اند؛ شکل قابل تشخیص نیست.");
  const crossing = selfIntersects(pts);
  if (crossing) {
    return blank("چندضلعی خودش را قطع کرده و قابل تشخیص نیست.", {
      selfIntersecting: true,
      sides,
      perimeter: sides.reduce((a, b) => a + b, 0),
    });
  }
  const angles = interiorAngles(pts);
  const area = polygonArea(pts);
  if (area < 1e-6) return blank("رأس‌ها تقریباً روی یک خط‌اند؛ شکل قابل تشخیص نیست.", { sides, angles });
  const convex = angles.every((a) => a < 180 - 1e-4);
  const concave = angles.some((a) => a > 180 + 1e-4);
  const sideEquality = equality(sides, EXACT, 0.02, APPROX_REL);
  const angleEquality = equality(angles, ANG_EXACT, ANG_APPROX, 0);
  let regular: Equality = "no";
  if (sideEquality === "exact" && angleEquality === "exact") regular = "exact";
  else if (
    (sideEquality === "exact" || sideEquality === "approx") &&
    (angleEquality === "exact" || angleEquality === "approx")
  ) {
    regular = sideEquality === "exact" && angleEquality === "exact" ? "exact" : "approx";
  }
  const symmetries: string[] = [];
  const report: PolygonReport = {
    n,
    valid: true,
    selfIntersecting: false,
    convex: convex && !concave,
    regular,
    sideEquality,
    angleEquality,
    sides,
    angles,
    perimeter: sides.reduce((a, b) => a + b, 0),
    area,
    diagonalCount: (n * (n - 3)) / 2,
    names: [],
    symmetries,
  };
  const shapeNames: string[] = [];
  if (n === 3) {
    const [a, b, c] = sides as [number, number, number];
    const eqS = (x: number, y: number) => relClose(x, y, APPROX_REL, 0.02);
    const exS = (x: number, y: number) => relClose(x, y, 1e-6, EXACT);
    const allEx = exS(a, b) && exS(b, c);
    const allAp = eqS(a, b) && eqS(b, c);
    const pair = eqS(a, b) || eqS(b, c) || eqS(a, c);
    const bySides = allEx ? "متساوی‌الاضلاع" : allAp ? "تقریباً متساوی‌الاضلاع" : pair ? "متساوی‌الساقین" : "مختلف‌الاضلاع";
    const rightEx = angles.some((ang) => Math.abs(ang - 90) <= ANG_EXACT);
    const right = angles.some((ang) => Math.abs(ang - 90) <= ANG_APPROX);
    const obtuse = angles.some((ang) => ang > 90 + ANG_APPROX);
    const byAngles = right ? (rightEx ? "قائم‌الزاویه" : "تقریباً قائم‌الزاویه") : obtuse ? "منفرجه‌الزاویه" : "تندزاویه";
    const longest = Math.max(a, b, c);
    const legs = [a, b, c].filter((s) => s !== longest);
    let pythagoras: "holds" | "fails" | "approx" | "na" = "na";
    if (right && legs.length >= 2) {
      const hyp2 = longest * longest;
      const sum = legs[0]! * legs[0]! + legs[1]! * legs[1]!;
      if (relClose(hyp2, sum, 1e-6, 1e-4)) pythagoras = "holds";
      else if (relClose(hyp2, sum, 0.02, 0.05)) pythagoras = "approx";
      else pythagoras = "fails";
    }
    shapeNames.push(bySides, byAngles);
    report.triangle = { bySides, byAngles, angleSum: angles.reduce((s, x) => s + x, 0), pythagoras };
  }

  if (n === 4 && convex) {
    const v = pts;
    const opp1 = parallelDir(sub(v[1]!, v[0]!), sub(v[2]!, v[3]!));
    const opp2 = parallelDir(sub(v[2]!, v[1]!), sub(v[3]!, v[0]!));
    const rightAll = angles.every((ang) => Math.abs(ang - 90) <= ANG_APPROX);
    const sidesEq = sideEquality === "exact" || sideEquality === "approx";
    const d1 = dist(v[0]!, v[2]!);
    const d2 = dist(v[1]!, v[3]!);
    const diagEq = equality([d1, d2], EXACT, 0.03, APPROX_REL);
    const diagPerp = perpDir(sub(v[2]!, v[0]!), sub(v[3]!, v[1]!))
      ? Math.abs(angleDeg(sub(v[2]!, v[0]!), sub(v[3]!, v[1]!)) - 90) <= ANG_EXACT
        ? "exact"
        : "approx"
      : "no";
    const m1 = { x: (v[0]!.x + v[2]!.x) / 2, y: (v[0]!.y + v[2]!.y) / 2 };
    const m2 = { x: (v[1]!.x + v[3]!.x) / 2, y: (v[1]!.y + v[3]!.y) / 2 };
    const diagBisect = nearlyV(m1, m2, 1e-4) ? "exact" : nearlyV(m1, m2, 0.03) ? "approx" : "no";
    const para = opp1 && opp2;
    const trap = (opp1 && !opp2) || (!opp1 && opp2);
    const s = sides;
    const kiteAdj =
      (relClose(s[0]!, s[3]!, APPROX_REL, 0.02) && relClose(s[1]!, s[2]!, APPROX_REL, 0.02)) ||
      (relClose(s[0]!, s[1]!, APPROX_REL, 0.02) && relClose(s[2]!, s[3]!, APPROX_REL, 0.02));
    if (para && sidesEq && rightAll) shapeNames.push("مربع", "مستطیل", "لوزی", "متوازی‌الاضلاع", "بادبادک");
    else if (para && rightAll) shapeNames.push("مستطیل", "متوازی‌الاضلاع");
    else if (para && sidesEq) shapeNames.push("لوزی", "متوازی‌الاضلاع", "بادبادک");
    else if (para) shapeNames.push("متوازی‌الاضلاع");
    else if (trap) {
      const legs = opp1 ? [s[1]!, s[3]!] : [s[0]!, s[2]!];
      const rights = angles.filter((ang) => Math.abs(ang - 90) <= ANG_APPROX).length;
      if (relClose(legs[0]!, legs[1]!, APPROX_REL, 0.02)) shapeNames.push("ذوزنقهٔ متساوی‌الساقین");
      if (rights >= 2) shapeNames.push("ذوزنقهٔ قائم‌الزاویه");
      shapeNames.push("ذوزنقه");
    }
    if (kiteAdj && !shapeNames.includes("بادبادک")) shapeNames.push("بادبادک");
    report.quad = { diagonals: [d1, d2], diagonalsPerp: diagPerp, diagonalsEqual: diagEq, diagonalsBisect: diagBisect };
  }

  if (convex && !concave) shapeNames.push("محدب");
  else shapeNames.push("مقعر");
  if (regular === "exact") shapeNames.push("منتظم");
  else if (regular === "approx") shapeNames.push("تقریباً منتظم");
  else shapeNames.push("غیرمنتظم");
  report.names = shapeNames;

  const axes = hasReflectionSymmetry(pts);
  if (axes > 0) symmetries.push(`${axes} محور تقارن`);
  if (hasHalfTurn(pts)) symmetries.push("مرکز تقارن (دوران ۱۸۰ درجه)");
  if (regular === "exact") symmetries.push(`تقارن دورانی مرتبهٔ ${n}`);
  if (symmetries.length === 0) symmetries.push("تقارن واضحی تشخیص داده نشد");
  return report;
}

export type CircleHit = "none" | "tangent" | "secant";

export function lineCircleStatus(distFromCenter: number, radius: number): CircleHit {
  if (!Number.isFinite(distFromCenter) || !Number.isFinite(radius)) return "none";
  if (Math.abs(distFromCenter - radius) <= Math.max(1e-4, radius * 1e-4)) return "tangent";
  if (distFromCenter < radius) return "secant";
  return "none";
}

export type TwoCircle = "coincident" | "separate" | "contained" | "internal-tangent" | "external-tangent" | "intersect";

export function twoCircles(d: number, r1: number, r2: number): TwoCircle {
  if (d < 1e-6 && Math.abs(r1 - r2) < 1e-4) return "coincident";
  const tol = 1e-3;
  if (Math.abs(d - (r1 + r2)) <= tol) return "external-tangent";
  if (Math.abs(d - Math.abs(r1 - r2)) <= tol) return "internal-tangent";
  if (d > r1 + r2) return "separate";
  if (d < Math.abs(r1 - r2)) return "contained";
  return "intersect";
}

export function compareTriangles(A: V[], B: V[]): string[] {
  if (A.length !== 3 || B.length !== 3) return ["برای مقایسه، دو مثلث لازم است."];
  const sides = (p: V[]) => [dist(p[0]!, p[1]!), dist(p[1]!, p[2]!), dist(p[2]!, p[0]!)].sort((a, b) => a - b);
  const angs = (p: V[]) => interiorAngles(p).sort((a, b) => a - b);
  const sa = sides(A);
  const sb = sides(B);
  const aa = angs(A);
  const ab = angs(B);
  const sidesEq = sa.every((s, i) => relClose(s, sb[i]!, 0.02, 0.03));
  const angsEq = aa.every((s, i) => Math.abs(s - ab[i]!) <= ANG_APPROX);
  const ratio = sb[0]! > 1e-6 ? sa[0]! / sb[0]! : NaN;
  const similarSides = sa.every((s, i) => relClose(s, sb[i]! * ratio, 0.02, 0.03));
  const notes: string[] = [];
  if (sidesEq && angsEq) notes.push("هم‌نهشت به نظر می‌رسند (ضلع‌ها و زاویه‌ها متناظر برابرند — حالت ض‌ض‌ض).");
  else if (angsEq && similarSides) notes.push("متشابه به نظر می‌رسند: زاویه‌ها برابرند و ضلع‌ها به یک نسبت تغییر کرده‌اند.");
  else if (angsEq) notes.push("زاویه‌های متناظر نزدیک‌اند؛ نسبت ضلع‌ها را هم بسنجید.");
  else notes.push("با این اندازه‌ها، هم‌نهشتی یا تشابه قطعی دیده نمی‌شود.");
  const rightA = aa.some((x) => Math.abs(x - 90) < ANG_APPROX);
  const rightB = ab.some((x) => Math.abs(x - 90) < ANG_APPROX);
  if (rightA && rightB) notes.push("هر دو قائم‌الزاویه‌اند؛ حالت وتر و یک ضلع (و‌ض) را هم می‌توان بررسی کرد.");
  return notes;
}

export function faEquality(e: Equality): string {
  if (e === "exact") return "دقیقاً برابر";
  if (e === "approx") return "تقریباً برابر (خطای رسم)";
  if (e === "no") return "نابرابر";
  return "قابل تشخیص نیست";
}

void nearly;
