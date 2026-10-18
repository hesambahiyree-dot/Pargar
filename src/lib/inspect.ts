import { classifyPolygon, compareTriangles, faEquality, lineCircleStatus, twoCircles } from "./geometry/classify.ts";
import { evaluate } from "./geometry/eval.ts";
import { angleDeg, dist, distToLine, sub } from "./geometry/math.ts";
import type { BoardDoc, Obj } from "./geometry/types.ts";
import { faNum } from "./format.ts";

export type Info = { title: string; rows: [string, string][] };

export function inspect(doc: BoardDoc, ids: string[]): Info | null {
  if (ids.length === 0) return null;
  const ev = evaluate(doc);
  const objs = ids.map((id) => doc.objects.find((o) => o.id === id)).filter((o): o is Obj => !!o);
  if (objs.length === 0) return null;
  const o = objs[0]!;
  if (objs.length === 1 && o.kind === "polygon") return polyInfo(doc, o.verts);
  if (objs.length === 1 && o.kind === "circle") return circleInfo(doc, o.id);
  if (objs.length === 1 && (o.kind === "segment" || o.kind === "line" || o.kind === "ray")) {
    const a = ev.pos.get(o.a);
    const b = ev.pos.get(o.b);
    if (!a || !b) return { title: "خط ناتمام", rows: [["وضعیت", "قابل تشخیص نیست"]] };
    const rows: [string, string][] = [];
    if (o.kind === "segment") rows.push(["طول", faNum(dist(a, b))]);
    if (o.arrow || o.kind === "segment") {
      rows.push(["Δx", faNum(b.x - a.x)], ["Δy", faNum(b.y - a.y)]);
    }
    const dx = b.x - a.x;
    if (Math.abs(dx) < 1e-8) rows.push(["شیب", "تعریف نمی‌شود (خط عمودی)"]);
    else rows.push(["شیب", faNum((b.y - a.y) / dx)]);
    rows.push(["نوع", o.kind === "line" ? "خط راست" : o.kind === "ray" ? "نیم‌خط" : o.arrow ? "بردار" : "پاره‌خط"]);
    return { title: o.kind === "line" ? "خط" : o.kind === "ray" ? "نیم‌خط" : "پاره‌خط", rows };
  }
  if (objs.length === 1 && o.kind === "point") {
    const p = ev.pos.get(o.id);
    if (!p) return { title: "نقطه", rows: [["وضعیت", "وابستگی خراب است"]] };
    const parent = doc.objects.find((q) => q.kind === "polygon" && q.verts.includes(o.id));
    const rows: [string, string][] = [
      ["نام", o.label ?? "—"],
      ["x", faNum(p.x)],
      ["y", faNum(p.y)],
      ["وابستگی", depName(o)],
    ];
    const info: Info = { title: "نقطه", rows };
    if (parent && parent.kind === "polygon") {
      const extra = polyInfo(doc, parent.verts);
      info.rows.push(["شکل شامل این رأس", extra.title]);
      info.rows.push(...extra.rows.slice(0, 8));
    }
    return info;
  }
  if (objs.length === 1 && o.kind === "angle") {
    const a = ev.pos.get(o.a);
    const v = ev.pos.get(o.v);
    const b = ev.pos.get(o.b);
    if (!a || !v || !b) return { title: "زاویه", rows: [["وضعیت", "قابل تشخیص نیست"]] };
    const deg = angleDeg(sub(a, v), sub(b, v));
    const rows: [string, string][] = [["اندازه", `${faNum(deg, 1)} درجه`]];
    const circles = doc.objects.filter((c) => c.kind === "circle");
    for (const c of circles) {
      if (c.kind !== "circle") continue;
      const center = ev.pos.get(c.center);
      const r = ev.radius.get(c.id);
      if (!center || r == null) continue;
      if (dist(v, center) < 1e-3 && Math.abs(dist(a, center) - r) < 1e-2 && Math.abs(dist(b, center) - r) < 1e-2) {
        rows.push(["نقش", "زاویهٔ مرکزی"]);
      }
      if (Math.abs(dist(v, center) - r) < 1e-2 && Math.abs(dist(a, center) - r) < 1e-2 && Math.abs(dist(b, center) - r) < 1e-2) {
        rows.push(["نقش", "زاویهٔ محاطی؛ کمان روبه‌رو حدود دو برابر این زاویه است"]);
      }
    }
    return { title: "زاویه", rows };
  }
  const tris = objs.filter((x) => x.kind === "polygon" && x.verts.length === 3);
  if (tris.length === 2 && tris[0]!.kind === "polygon" && tris[1]!.kind === "polygon") {
    const A = tris[0].verts.map((id) => ev.pos.get(id)!);
    const B = tris[1].verts.map((id) => ev.pos.get(id)!);
    return { title: "مقایسهٔ دو مثلث", rows: compareTriangles(A, B).map((t, i) => [`نکتهٔ ${i + 1}`, t]) };
  }
  return { title: "چند شکل", rows: [["تعداد", faNum(objs.length, 0)]] };
}

function depName(o: Extract<Obj, { kind: "point" }>): string {
  switch (o.def.t) {
    case "free":
      return "آزاد";
    case "onLine":
    case "onSeg":
    case "onRay":
      return "روی خط";
    case "onCircle":
      return "روی دایره";
    case "mid":
      return "نقطهٔ وسط";
    case "intersect":
      return "تقاطع";
    case "translate":
    case "translateBy":
      return "انتقال";
    case "rotate":
      return "دوران";
    case "reflect":
      return "بازتاب";
    case "scale":
      return "تجانس";
    default:
      return "ساخته‌شده";
  }
}

function polyInfo(doc: BoardDoc, verts: string[]): Info {
  const ev = evaluate(doc);
  const pts = verts.map((id) => ev.pos.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  if (pts.length !== verts.length) return { title: "چندضلعی", rows: [["وضعیت", "قابل تشخیص نیست"]] };
  const r = classifyPolygon(pts);
  if (!r.valid) return { title: "چندضلعی", rows: [["وضعیت", r.reason ?? "قابل تشخیص نیست"]] };
  const rows: [string, string][] = [
    ["رأس‌ها", faNum(r.n, 0)],
    ["نام‌ها", r.names.join("، ")],
    ["ضلع‌ها", r.sides.map((s) => faNum(s)).join(" ، ")],
    ["برابری ضلع‌ها", faEquality(r.sideEquality)],
    ["زاویه‌ها", r.angles.map((s) => faNum(s, 1)).join(" ، ")],
    ["برابری زاویه‌ها", faEquality(r.angleEquality)],
    ["منتظم", faEquality(r.regular)],
    ["محیط", faNum(r.perimeter ?? NaN)],
    ["مساحت", r.area == null ? "قابل تشخیص نیست" : faNum(r.area)],
    ["تعداد قطرها", r.diagonalCount == null ? "قابل تشخیص نیست" : faNum(r.diagonalCount, 0)],
    ["تقارن", r.symmetries.join("؛ ")],
  ];
  if (r.triangle) {
    rows.push(["نوع ضلع", r.triangle.bySides], ["نوع زاویه", r.triangle.byAngles]);
    rows.push(["مجموع زاویه‌ها", faNum(r.triangle.angleSum, 1)]);
    rows.push([
      "فیثاغورس",
      r.triangle.pythagoras === "holds"
        ? "برقرار (دقیق)"
        : r.triangle.pythagoras === "approx"
          ? "تقریباً (خطای رسم)"
          : r.triangle.pythagoras === "fails"
            ? "برقرار نیست"
            : "برای این مثلث موضوعیت ندارد",
    ]);
  }
  if (r.quad) {
    rows.push(["قطرها", `${faNum(r.quad.diagonals[0])} و ${faNum(r.quad.diagonals[1])}`]);
    rows.push(["قطرهای برابر", faEquality(r.quad.diagonalsEqual)]);
    rows.push(["قطرهای عمود", faEquality(r.quad.diagonalsPerp)]);
    rows.push(["نصف شدن قطرها", faEquality(r.quad.diagonalsBisect)]);
  }
  return { title: r.names[0] ?? "چندضلعی", rows };
}

function circleInfo(doc: BoardDoc, id: string): Info {
  const ev = evaluate(doc);
  const o = doc.objects.find((x) => x.id === id);
  if (!o || o.kind !== "circle") return { title: "دایره", rows: [] };
  const c = ev.pos.get(o.center);
  const r = ev.radius.get(o.id);
  if (!c || r == null) return { title: "دایره", rows: [["وضعیت", "قابل تشخیص نیست"]] };
  const rows: [string, string][] = [
    ["مرکز", `(${faNum(c.x)} ، ${faNum(c.y)})`],
    ["شعاع", faNum(r)],
    ["قطر", faNum(2 * r)],
    ["محیط", faNum(2 * Math.PI * r)],
    ["مساحت", faNum(Math.PI * r * r)],
  ];
  for (const other of doc.objects) {
    if (other.kind === "line" || other.kind === "segment" || other.kind === "ray") {
      const a = ev.pos.get(other.a);
      const b = ev.pos.get(other.b);
      if (!a || !b) continue;
      const status = lineCircleStatus(distToLine(c, a, b), r);
      const label = status === "tangent" ? "مماس" : status === "secant" ? "دو برخورد" : "بدون برخورد";
      rows.push(["خط و دایره", label]);
      break;
    }
  }
  for (const other of doc.objects) {
    if (other.kind !== "circle" || other.id === id) continue;
    const c2 = ev.pos.get(other.center);
    const r2 = ev.radius.get(other.id);
    if (!c2 || r2 == null) continue;
    const rel = twoCircles(dist(c, c2), r, r2);
    const map: Record<string, string> = {
      coincident: "منطبق",
      separate: "جدا",
      contained: "یکی داخل دیگری بدون تماس",
      "internal-tangent": "مماس داخلی",
      "external-tangent": "مماس خارجی",
      intersect: "دو نقطهٔ تقاطع",
    };
    rows.push(["دو دایره", map[rel] ?? rel]);
    break;
  }
  return { title: "دایره", rows };
}
