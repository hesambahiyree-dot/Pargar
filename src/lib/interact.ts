import { dist } from "./geometry/math.ts";
import { evaluate } from "./geometry/eval.ts";
import {
  addAngle,
  addArc,
  addBisector,
  addCircle3,
  addCircleRadius,
  addCircleRadiusOf,
  addCircleThrough,
  addIntersection,
  addLinear,
  addMidpoint,
  addParallel,
  addPerpBisector,
  addPerpendicular,
  addPointOn,
  addPolygon,
  addRegular,
  addRegularOn,
  addFreePoint,
  transformObjects,
  type OpResult,
  type Xform,
} from "./geometry/ops.ts";
import type { BoardDoc, Id } from "./geometry/types.ts";
import type { ToolId } from "./tools.ts";

export type ModalReq =
  | { kind: "number"; title: string; label: string; defaultValue: number; min?: number; max?: number }
  | { kind: "choice"; title: string; options: { id: string; label: string }[] };

export type TapOut = {
  doc: BoardDoc;
  selected: string[];
  pending: string[];
  status: string;
  modal?: ModalReq;
  error?: string;
};

type Session = { tool: ToolId; pending: string[]; selected: string[] };

const HINTS: Record<string, string> = {
  point: "روی صفحه بزن تا نقطه ساخته شود.",
  segment: "دو نقطه را انتخاب کن.",
  line: "دو نقطه را انتخاب کن.",
  ray: "دو نقطه را انتخاب کن.",
  polygon: "رأس‌ها را یکی‌یکی بزن؛ برای بستن دوباره روی رأس اول بزن.",
  circle: "مرکز و یک نقطه روی محیط را انتخاب کن.",
  midpoint: "دو نقطه را انتخاب کن.",
  parallel: "خط و نقطه را انتخاب کن.",
  perpendicular: "خط و نقطه را انتخاب کن.",
  intersect: "دو شیء را انتخاب کن.",
};

function ok(doc: BoardDoc, session: Session, status = "انجام شد."): TapOut {
  return { doc, selected: session.selected, pending: session.pending, status };
}

function fail(doc: BoardDoc, session: Session, error: string): TapOut {
  return { doc, selected: session.selected, pending: session.pending, status: error, error };
}

function needPoints(doc: BoardDoc, ids: string[], n: number): string | null {
  const pts = ids.filter((id) => doc.objects.find((o) => o.id === id)?.kind === "point");
  if (pts.length < n) return `حداقل ${n} نقطه لازم است.`;
  return null;
}

export function applyTap(
  doc: BoardDoc,
  session: Session,
  geo: { x: number; y: number },
  hit: string | null,
  shift: boolean,
): TapOut {
  const tool = session.tool;
  let pending = [...session.pending];
  let selected = shift ? [...session.selected] : [];

  if (tool === "select" || tool === "pan") {
    if (hit) {
      if (shift) {
        if (selected.includes(hit)) selected = selected.filter((x) => x !== hit);
        else selected = [...selected, hit];
      } else selected = [hit];
    } else if (!shift) selected = [];
    return { doc, selected, pending: [], status: selected.length ? `${selected.length} مورد انتخاب شد.` : "آماده." };
  }

  if (tool === "point") {
    const made = addFreePoint(doc, geo, doc.snap);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "نقطه ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "pointOn") {
    if (!hit) return fail(doc, session, "اول یک خط یا دایره را انتخاب کن.");
    const made = addPointOn(doc, hit, geo);
    if (!made.id) return fail(doc, session, made.error ?? "نقطه روی شکل ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (hit) pending = [...pending, hit];
  else if (["segment", "line", "ray", "polygon", "circle", "regular"].includes(tool)) {
    const made = addFreePoint(doc, geo, doc.snap);
    if (!made.id) return fail(doc, session, made.error ?? "نقطه ساخته نشد.");
    doc = made.doc;
    pending = [...pending, made.id];
  }

  if (tool === "segment" || tool === "line" || tool === "ray") {
    if (pending.length < 2) return { doc, selected: pending, pending, status: HINTS[tool] ?? "" };
    const [a, b] = pending.slice(-2) as [Id, Id];
    const made = addLinear(doc, tool, a, b);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "خط ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "polygon") {
    if (pending.length >= 3 && pending[0] === pending[pending.length - 1]) {
      return closePolygon(doc, { tool, pending: pending.slice(0, -1), selected: [] });
    }
    return { doc, selected: pending, pending, status: HINTS.polygon ?? "" };
  }

  if (tool === "circle") {
    if (pending.length < 2) return { doc, selected: pending, pending, status: HINTS.circle ?? "" };
    const [center, through] = pending.slice(-2) as [Id, Id];
    const made = addCircleThrough(doc, center, through);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "دایره ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "midpoint") {
    if (pending.length < 2) return { doc, selected: pending, pending, status: HINTS.midpoint ?? "" };
    const [a, b] = pending.slice(-2) as [Id, Id];
    const made = addMidpoint(doc, a, b);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "نقطهٔ وسط ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "parallel") {
    if (pending.length < 2) return { doc, selected: pending, pending, status: HINTS.parallel ?? "" };
    const [lineId, pointId] = pending.slice(-2) as [Id, Id];
    const made = addParallel(doc, lineId, pointId);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "خط موازی ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "perpendicular") {
    if (pending.length < 2) return { doc, selected: pending, pending, status: HINTS.perpendicular ?? "" };
    const [lineId, pointId] = pending.slice(-2) as [Id, Id];
    const made = addPerpendicular(doc, lineId, pointId);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "خط عمود ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "intersect") {
    if (pending.length < 2) return { doc, selected: pending, pending, status: HINTS.intersect ?? "" };
    const [a, b] = pending.slice(-2) as [Id, Id];
    const made = addIntersection(doc, a, b, geo);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "تقاطع ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: made.ids ?? [made.id] });
  }

  if (tool === "perpBisector") {
    if (pending.length < 2) return { doc, selected: pending, pending, status: "دو نقطه را انتخاب کن." };
    const [a, b] = pending.slice(-2) as [Id, Id];
    const made = addPerpBisector(doc, a, b);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "عمودمنصف ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: made.ids ?? [made.id] });
  }

  if (tool === "bisector") {
    if (pending.length < 3) return { doc, selected: pending, pending, status: "سه نقطه (رأس وسط) را انتخاب کن." };
    const [a, v, b] = pending.slice(-3) as [Id, Id, Id];
    const made = addBisector(doc, a, v, b);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "نیمساز ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "angle") {
    if (pending.length < 3) return { doc, selected: pending, pending, status: "سه نقطه (رأس وسط) را انتخاب کن." };
    const [a, v, b] = pending.slice(-3) as [Id, Id, Id];
    const made = addAngle(doc, a, v, b);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "زاویه ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "circle3") {
    if (pending.length < 3) return { doc, selected: pending, pending, status: "سه نقطه را انتخاب کن." };
    const [a, b, c] = pending.slice(-3) as [Id, Id, Id];
    const made = addCircle3(doc, a, b, c);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "دایره ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  if (tool === "arc") {
    if (pending.length < 3) return { doc, selected: pending, pending, status: "دایره و دو نقطه را انتخاب کن." };
    const [circleId, a, b] = pending.slice(-3) as [Id, Id, Id];
    const made = addArc(doc, circleId, a, b);
    if (!made.id) return fail(doc, { ...session, pending: [], selected }, made.error ?? "کمان ساخته نشد.");
    return ok(made.doc, { tool, pending: [], selected: [made.id] });
  }

  return { doc, selected: pending, pending, status: "ابزار فعال است." };
}

export function closePolygon(doc: BoardDoc, session: Session): TapOut {
  const verts = session.pending.filter((id) => doc.objects.find((o) => o.id === id)?.kind === "point");
  if (verts.length < 3) return fail(doc, session, "چندضلعی حداقل سه رأس می‌خواهد.");
  const made = addPolygon(doc, verts as Id[]);
  if (!made.id) return fail(doc, session, made.error ?? "چندضلعی ساخته نشد.");
  return ok(made.doc, { ...session, pending: [], selected: [made.id] });
}

export function applyXform(doc: BoardDoc, session: Session, xf: Xform): TapOut {
  const shape = session.selected[0];
  if (!shape) return fail(doc, session, "اول یک شکل را انتخاب کن.");
  const made = transformObjects(doc, [shape], xf);
  if (!made.id) return fail(doc, { ...session, pending: [] }, made.error ?? "تبدیل انجام نشد.");
  return ok(made.doc, session);
}

void HINTS;
