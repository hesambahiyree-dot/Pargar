import { dist } from "./geometry/math.ts";
import { evaluate } from "./geometry/eval.ts";
import {
  addAngle,
  addArc,
  addBisector,
  addCircle3,
  addCircleRadiusOf,
  addCircleThrough,
  addFreePoint,
  addIntersection,
  addLinear,
  addMidpoint,
  addParallel,
  addPerpBisector,
  addPerpendicular,
  addPointOn,
  addPolygon,
  addRegularOn,
  deleteIds,
  transformObjects,
  type Xform,
} from "./geometry/ops.ts";
import type { BoardDoc, Obj } from "./geometry/types.ts";
import { HINTS, type Session, type Sub } from "./tools.ts";

export type ModalReq =
  | { t: "radius" }
  | { t: "rotate" }
  | { t: "translate" }
  | { t: "scale" }
  | null;

export type TapOut = { doc: BoardDoc; session: Session; modal: ModalReq };

function out(doc: BoardDoc, session: Session, modal: ModalReq = null): TapOut {
  return { doc, session, modal };
}

function fail(doc: BoardDoc, session: Session, error: string): TapOut {
  return out(doc, { ...session, error });
}

function ok(doc: BoardDoc, session: Session, modal: ModalReq = null): TapOut {
  return out(doc, { ...session, pending: [], error: null }, modal);
}

function obj(doc: BoardDoc, id: string | null): Obj | undefined {
  if (!id) return undefined;
  return doc.objects.find((o) => o.id === id);
}

function isLinear(o: Obj | undefined): o is Extract<Obj, { kind: "line" | "ray" | "segment" }> {
  return !!o && (o.kind === "line" || o.kind === "ray" || o.kind === "segment");
}

function isShape(o: Obj | undefined): boolean {
  return !!o && o.kind !== "point";
}

function pointId(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null, snap: boolean): { doc: BoardDoc; id: string } | TapOut {
  const h = obj(doc, hit);
  if (h?.kind === "point") return { doc, id: h.id };
  const made = addFreePoint(doc, geo, snap);
  if (!made.id) return fail(doc, session, made.error ?? "نقطه ساخته نشد.");
  return { doc: made.doc, id: made.id };
}

export function applyTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null, shift: boolean): TapOut {
  const sub = session.sub;
  const additive = shift || session.multi;
  if (session.group === "select" || (session.group !== "eraser" && !sub)) {
    if (!hit) return out(doc, { ...session, error: null });
    const selection = additive ? toggle(session, hit) : [hit];
    return out(doc, { ...session, pending: selection, error: null });
  }
  if (session.group === "eraser") {
    if (!hit) return fail(doc, session, "روی یک شکل بزنید. برای چند شکل، «چندانتخاب» را روشن کنید یا Shift را نگه دارید، بعد «حذف انتخاب» را بزنید.");
    if (additive) return out(doc, { ...session, pending: toggle(session, hit), error: null });
    return ok(deleteIds(doc, [hit]), session);
  }
  if (!sub) return out(doc, session);

  const h = obj(doc, hit);
  switch (sub) {
    case "point":
      return ok(addFreePoint(doc, geo, doc.snap).doc, session);
    case "pointOn": {
      if (!hit || !(isLinear(h) || h?.kind === "circle")) {
        return fail(doc, session, "نقطهٔ وابسته فقط روی خط، پاره‌خط، نیم‌خط یا دایره قرار می‌گیرد.");
      }
      const made = addPointOn(doc, hit, geo);
      if (!made.id) return fail(doc, session, made.error ?? "ساخته نشد.");
      return ok(made.doc, session);
    }
    case "line":
    case "ray":
    case "segment":
    case "vector":
      return twoPoints(doc, session, geo, hit, (d, a, b) =>
        addLinear(d, sub === "vector" || sub === "segment" ? "segment" : sub, a, b, sub === "vector" ? { arrow: true } : undefined),
      );
    case "polygon":
      return polygonTap(doc, session, geo, hit);
    case "regular":
      return regularTap(doc, session, geo, hit);
    case "midpoint":
      return midpointTap(doc, session, geo, hit);
    case "parallel":
    case "perpendicular":
      return lineThenPoint(doc, session, geo, hit, sub);
    case "perpBisector":
      return perpBisTap(doc, session, geo, hit);
    case "bisector":
      return bisectorTap(doc, session, geo, hit);
    case "intersection":
      return intersectTap(doc, session, geo, hit);
    case "angle":
      return triple(doc, session, geo, hit, (d, a, v, b) => addAngle(d, a, v, b));
    case "centerPoint":
      return twoPoints(doc, session, geo, hit, (d, a, b) => addCircleThrough(d, a, b));
    case "centerRadius": {
      const p = pointId(doc, session, geo, hit, doc.snap);
      if ("session" in p) return p;
      return out(p.doc, { ...session, pending: [p.id], error: null }, { t: "radius" });
    }
    case "three":
      return triple(doc, session, geo, hit, (d, a, b, c) => addCircle3(d, a, b, c));
    case "compass":
      return compassTap(doc, session, geo, hit);
    case "arc":
      return arcTap(doc, session, geo, hit);
    case "translate":
    case "rotate":
    case "reflect":
    case "pointSym":
    case "scale":
      return transformTap(doc, session, geo, hit, sub);
    default:
      return out(doc, session);
  }
}

function toggle(session: Session, hit: string): string[] {
  return session.pending.includes(hit) ? session.pending.filter((id) => id !== hit) : [...session.pending, hit];
}

function twoPoints(
  doc: BoardDoc,
  session: Session,
  geo: { x: number; y: number },
  hit: string | null,
  build: (doc: BoardDoc, a: string, b: string) => { doc: BoardDoc; id?: string; error?: string },
): TapOut {
  const p = pointId(doc, session, geo, hit, doc.snap);
  if ("session" in p) return p;
  const pending = [...session.pending, p.id];
  if (pending.length < 2) return out(p.doc, { ...session, pending, error: null });
  if (pending[0] === pending[1]) return fail(p.doc, { ...session, pending: [] }, "دو نقطه باید متفاوت باشند.");
  const made = build(p.doc, pending[0]!, pending[1]!);
  if (made.error || !made.id) return fail(p.doc, { ...session, pending: [] }, made.error ?? "ساخته نشد.");
  return ok(made.doc, session);
}

function polygonTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null): TapOut {
  const h = obj(doc, hit);
  if (session.pending.length >= 3 && h?.kind === "point" && h.id === session.pending[0]) {
    const made = addPolygon(doc, session.pending);
    if (!made.id) return fail(doc, session, made.error ?? "چندضلعی بسته نشد.");
    return ok(made.doc, session);
  }
  const p = pointId(doc, session, geo, hit, doc.snap);
  if ("session" in p) return p;
  if (session.pending.includes(p.id)) return fail(p.doc, session, "این رأس قبلاً انتخاب شده. برای بستن، رأس اول را بزنید.");
  return out(p.doc, { ...session, pending: [...session.pending, p.id], error: null });
}

export function closePolygon(doc: BoardDoc, session: Session): TapOut {
  if (session.pending.length < 3) return fail(doc, session, "حداقل سه رأس لازم است.");
  const made = addPolygon(doc, session.pending);
  if (!made.id) return fail(doc, session, made.error ?? "بسته نشد.");
  return ok(made.doc, session);
}

function regularTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null): TapOut {
  const p = pointId(doc, session, geo, hit, doc.snap);
  if ("session" in p) return p;
  const pending = [...session.pending, p.id];
  if (pending.length < 2) return out(p.doc, { ...session, pending, error: null });
  const made = addRegularOn(p.doc, pending[0]!, pending[1]!, session.polyN);
  if (!made.id) return fail(p.doc, { ...session, pending: [] }, made.error ?? "چندضلعی منتظم ساخته نشد.");
  return ok(made.doc, session);
}

function midpointTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null): TapOut {
  const h = obj(doc, hit);
  if (h?.kind === "segment" && session.pending.length === 0) {
    const made = addMidpoint(doc, h.a, h.b);
    if (!made.id) return fail(doc, session, made.error ?? "نقطهٔ وسط ساخته نشد.");
    return ok(made.doc, session);
  }
  return twoPoints(doc, session, geo, hit, (d, a, b) => addMidpoint(d, a, b));
}

function lineThenPoint(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null, sub: "parallel" | "perpendicular"): TapOut {
  if (session.pending.length === 0) {
    const h = obj(doc, hit);
    if (!isLinear(h)) return fail(doc, session, "اول خودِ خط، پاره‌خط یا نیم‌خط را انتخاب کنید، نه جای خالی.");
    return out(doc, { ...session, pending: [h.id], error: null, hint: "حالا نقطه‌ای را بزنید که خط جدید از آن بگذرد." });
  }
  const p = pointId(doc, session, geo, hit, doc.snap);
  if ("session" in p) return p;
  const made = sub === "parallel" ? addParallel(p.doc, session.pending[0]!, p.id) : addPerpendicular(p.doc, session.pending[0]!, p.id);
  if (!made.id) return fail(p.doc, { ...session, pending: [] }, made.error ?? "ساخته نشد.");
  return ok(made.doc, { ...session, hint: HINTS[sub] });
}

function perpBisTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null): TapOut {
  const h = obj(doc, hit);
  if (h?.kind === "segment" && session.pending.length === 0) {
    const made = addPerpBisector(doc, h.a, h.b);
    if (!made.id) return fail(doc, session, made.error ?? "عمودمنصف ساخته نشد.");
    return ok(made.doc, session);
  }
  return twoPoints(doc, session, geo, hit, (d, a, b) => addPerpBisector(d, a, b));
}

function bisectorTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null): TapOut {
  const h = obj(doc, hit);
  if (h?.kind === "angle" && session.pending.length === 0) {
    const made = addBisector(doc, h.a, h.v, h.b);
    if (!made.id) return fail(doc, session, made.error ?? "نیمساز ساخته نشد.");
    return ok(made.doc, session);
  }
  return triple(doc, session, geo, hit, (d, a, v, b) => addBisector(d, a, v, b));
}

function intersectTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null): TapOut {
  const h = obj(doc, hit);
  const good = isLinear(h) || h?.kind === "circle";
  if (!good || !hit) return fail(doc, session, "یک خط، نیم‌خط، پاره‌خط یا دایره را انتخاب کنید.");
  const pending = [...session.pending, hit];
  if (pending.length < 2) return out(doc, { ...session, pending, error: null });
  const made = addIntersection(doc, pending[0]!, pending[1]!, geo);
  if (!made.id) return fail(doc, { ...session, pending: [] }, made.error ?? "تقاطع پیدا نشد.");
  return ok(made.doc, session);
}

function triple(
  doc: BoardDoc,
  session: Session,
  geo: { x: number; y: number },
  hit: string | null,
  build: (doc: BoardDoc, a: string, v: string, b: string) => { doc: BoardDoc; id?: string; error?: string },
): TapOut {
  const p = pointId(doc, session, geo, hit, doc.snap);
  if ("session" in p) return p;
  const pending = [...session.pending, p.id];
  if (pending.length < 3) return out(p.doc, { ...session, pending, error: null });
  const made = build(p.doc, pending[0]!, pending[1]!, pending[2]!);
  if (!made.id) return fail(p.doc, { ...session, pending: [] }, made.error ?? "ساخته نشد.");
  return ok(made.doc, session);
}

function compassTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null): TapOut {
  const h = obj(doc, hit);
  if (session.pending.length === 0) {
    if (h?.kind === "segment") return out(doc, { ...session, pending: [h.id], error: null, hint: "حالا مرکز دایره را بزنید." });
    return fail(doc, session, "اول یک پاره‌خط برای شعاع انتخاب کنید.");
  }
  const p = pointId(doc, session, geo, hit, doc.snap);
  if ("session" in p) return p;
  const made = addCircleRadiusOf(p.doc, p.id, session.pending[0]!);
  if (!made.id) return fail(p.doc, { ...session, pending: [] }, made.error ?? "دایره ساخته نشد.");
  return ok(made.doc, session);
}

function arcTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null): TapOut {
  const h = obj(doc, hit);
  if (session.pending.length === 0) {
    if (h?.kind !== "circle") return fail(doc, session, "اول دایره را انتخاب کنید.");
    return out(doc, { ...session, pending: [h.id], error: null });
  }
  if (session.pending.length === 1) {
    const p = pointId(doc, session, geo, hit, doc.snap);
    if ("session" in p) return p;
    return out(p.doc, { ...session, pending: [session.pending[0]!, p.id], error: null });
  }
  const p = pointId(doc, session, geo, hit, doc.snap);
  if ("session" in p) return p;
  const made = addArc(p.doc, session.pending[0]!, session.pending[1]!, p.id);
  if (!made.id) return fail(p.doc, { ...session, pending: [] }, made.error ?? "کمان ساخته نشد.");
  return ok(made.doc, session);
}

function transformTap(doc: BoardDoc, session: Session, geo: { x: number; y: number }, hit: string | null, sub: Sub): TapOut {
  if (session.pending.length === 0) {
    if (!hit || !isShape(obj(doc, hit))) return fail(doc, session, "اول یک شکل را انتخاب کنید.");
    return out(doc, { ...session, pending: [hit], error: null });
  }
  if (sub === "translate") return out(doc, session, { t: "translate" });
  if (sub === "rotate") return out(doc, session, { t: "rotate" });
  if (sub === "scale") return out(doc, session, { t: "scale" });
  if (sub === "reflect") {
    if (session.pending.length === 1) {
      const h = obj(doc, hit);
      if (!isLinear(h)) return fail(doc, session, "محور بازتاب را انتخاب کنید (خط/پاره‌خط/نیم‌خط).");
      return out(doc, { ...session, pending: [...session.pending, h.id], error: null });
    }
    return applyXform(doc, session, { t: "reflect", axis: session.pending[1]! });
  }
  if (sub === "pointSym") {
    const p = pointId(doc, session, geo, hit, doc.snap);
    if ("session" in p) return p;
    return applyXform(p.doc, session, { t: "rotate", center: p.id, deg: 180 });
  }
  return out(doc, session);
}

export function applyXform(doc: BoardDoc, session: Session, xf: Xform): TapOut {
  const shape = session.pending[0];
  if (!shape) return fail(doc, session, "اول یک شکل را انتخاب کنید.");
  const made = transformObjects(doc, [shape], xf);
  if (!made.id) return fail(doc, { ...session, pending: [] }, made.error ?? "تبدیل انجام نشد.");
  return ok(made.doc, session);
}

void HINTS;
void dist;
void evaluate;
