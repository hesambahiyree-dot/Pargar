import {
  EPS,
  dist,
  distToLine,
  distToRay,
  distToSegment,
  pointOn,
  projectParam,
  snapPoint,
  type V,
} from "./math.ts";
import { circleRadius, evaluate, indexObjects, refsOf } from "./eval.ts";
import { cloneBoard, type BoardDoc, type GCircle, type GLinear, type Id, type Obj, type PointDef } from "./types.ts";

export type OpResult = { doc: BoardDoc; id?: Id; ids?: Id[]; error?: string };

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function alloc(doc: BoardDoc): { doc: BoardDoc; id: Id } {
  const id = `g${doc.next}`;
  return { doc: { ...doc, next: doc.next + 1 }, id };
}

function nextLabel(doc: BoardDoc): string {
  const used = new Set(
    doc.objects.filter((o) => o.kind === "point" && o.label).map((o) => (o as { label?: string }).label),
  );
  for (let i = 0; i < 260; i++) {
    const label = LABELS[i % 26]! + (i >= 26 ? String(Math.floor(i / 26)) : "");
    if (!used.has(label)) return label;
  }
  return `P${doc.next}`;
}

function withObj(doc: BoardDoc, obj: Obj): BoardDoc {
  return { ...doc, objects: [...doc.objects, obj], updatedAt: Date.now() };
}

export function addFreePoint(doc: BoardDoc, at: V, snap: boolean, hidden = false): OpResult {
  const p = snap ? snapPoint(at) : at;
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return { doc, error: "مختصات نقطه نامعتبر است." };
  const slot = alloc(doc);
  const obj: Obj = {
    id: slot.id,
    kind: "point",
    label: hidden ? undefined : nextLabel(slot.doc),
    hidden,
    def: { t: "free", x: p.x, y: p.y },
  };
  return { doc: withObj(slot.doc, obj), id: slot.id };
}

function ensurePoint(doc: BoardDoc, idOrAt: Id | V, snap: boolean): OpResult & { id: Id } {
  if (typeof idOrAt === "string") return { doc, id: idOrAt };
  const made = addFreePoint(doc, idOrAt, snap);
  if (!made.id) return { doc, id: "", error: made.error ?? "نقطه ساخته نشد." };
  return { doc: made.doc, id: made.id };
}

export function addLinear(
  doc: BoardDoc,
  kind: "line" | "ray" | "segment",
  a: Id,
  b: Id,
  extra?: Partial<GLinear>,
): OpResult {
  if (a === b) return { doc, error: "دو سر باید دو نقطهٔ متفاوت باشند." };
  const ev = evaluate(doc);
  const pa = ev.pos.get(a);
  const pb = ev.pos.get(b);
  if (!pa || !pb) return { doc, error: "یکی از نقطه‌ها هنوز جای مشخصی ندارد." };
  if (dist(pa, pb) < EPS) return { doc, error: "دو نقطه خیلی به هم نزدیک‌اند." };
  const slot = alloc(doc);
  const obj: GLinear = { id: slot.id, kind, a, b, ...extra };
  return { doc: withObj(slot.doc, obj), id: slot.id };
}

export function addPointOn(doc: BoardDoc, carrierId: Id, at: V): OpResult {
  const carrier = doc.objects.find((o) => o.id === carrierId);
  if (!carrier) return { doc, error: "اول یک خط، پاره‌خط، نیم‌خط یا دایره را انتخاب کنید." };
  const ev = evaluate(doc);
  if (carrier.kind === "line" || carrier.kind === "segment" || carrier.kind === "ray") {
    const a = ev.pos.get(carrier.a);
    const b = ev.pos.get(carrier.b);
    if (!a || !b) return { doc, error: "این خط هنوز کامل نیست." };
    const u0 = projectParam(at, a, b);
    if (u0 == null) return { doc, error: "نمی‌توان نقطه را روی این خط گذاشت." };
    let def: PointDef;
    if (carrier.kind === "segment") def = { t: "onSeg", seg: carrier.id, u: Math.min(1, Math.max(0, u0)) };
    else if (carrier.kind === "ray") def = { t: "onRay", ray: carrier.id, u: Math.max(0, u0) };
    else def = { t: "onLine", line: carrier.id, u: u0 };
    const slot = alloc(doc);
    const obj: Obj = { id: slot.id, kind: "point", label: nextLabel(slot.doc), def };
    return { doc: withObj(slot.doc, obj), id: slot.id };
  }
  if (carrier.kind === "circle") {
    const c = ev.pos.get(carrier.center);
    const r = ev.radius.get(carrier.id);
    if (!c || r == null) return { doc, error: "دایره هنوز شعاع مشخصی ندارد." };
    const theta = Math.atan2(at.y - c.y, at.x - c.x);
    const slot = alloc(doc);
    const obj: Obj = {
      id: slot.id,
      kind: "point",
      label: nextLabel(slot.doc),
      def: { t: "onCircle", circle: carrier.id, theta },
    };
    return { doc: withObj(slot.doc, obj), id: slot.id };
  }
  return { doc, error: "نقطه را فقط می‌توان روی خط، پاره‌خط، نیم‌خط یا دایره گذاشت." };
}

function addConstructed(doc: BoardDoc, def: PointDef, hidden = false): OpResult {
  const slot = alloc(doc);
  const obj: Obj = {
    id: slot.id,
    kind: "point",
    label: hidden ? undefined : nextLabel(slot.doc),
    hidden,
    def,
  };
  const next = withObj(slot.doc, obj);
  const ev = evaluate(next);
  if (ev.broken.has(slot.id) || !ev.pos.has(slot.id)) {
    return { doc, error: "این ساخت با نقطه‌های فعلی ممکن نیست." };
  }
  return { doc: next, id: slot.id };
}

export function addMidpoint(doc: BoardDoc, a: Id, b: Id): OpResult {
  if (a === b) return { doc, error: "برای نقطهٔ وسط دو نقطهٔ متفاوت لازم است." };
  return addConstructed(doc, { t: "mid", a, b });
}

export function addPolygon(doc: BoardDoc, verts: Id[]): OpResult {
  if (verts.length < 3) return { doc, error: "چندضلعی حداقل سه رأس می‌خواهد." };
  if (new Set(verts).size !== verts.length) return { doc, error: "رأس تکراری مجاز نیست." };
  const slot = alloc(doc);
  return { doc: withObj(slot.doc, { id: slot.id, kind: "polygon", verts: [...verts] }), id: slot.id };
}

export function addRegularOn(doc: BoardDoc, center: Id, vertex: Id, n: number): OpResult {
  if (n < 3 || n > 24) return { doc, error: "تعداد ضلع باید بین ۳ و ۲۴ باشد." };
  if (center === vertex) return { doc, error: "مرکز و رأس نباید یکی باشند." };
  const ids = [vertex];
  let cur = doc;
  for (let k = 1; k < n; k++) {
    const made = addConstructed(cur, { t: "rotate", src: vertex, center, deg: (360 / n) * k });
    if (!made.id) return { doc, error: made.error ?? "رأس منتظم ساخته نشد." };
    ids.push(made.id);
    cur = made.doc;
  }
  return addPolygon(cur, ids);
}

export function addRegular(doc: BoardDoc, centerAt: V, vertexAt: V, n: number, snap: boolean): OpResult {
  if (n < 3 || n > 24) return { doc, error: "تعداد ضلع باید بین ۳ و ۲۴ باشد." };
  const c = ensurePoint(doc, snap ? snapPoint(centerAt) : centerAt, false);
  if (c.error || !c.id) return { doc, error: c.error };
  const vtx = ensurePoint(c.doc, snap ? snapPoint(vertexAt) : vertexAt, false);
  if (vtx.error || !vtx.id) return { doc, error: vtx.error };
  return addRegularOn(vtx.doc, c.id, vtx.id, n);
}

export function addParallel(doc: BoardDoc, lineId: Id, pointId: Id): OpResult {
  const line = doc.objects.find((o) => o.id === lineId);
  if (!line || (line.kind !== "line" && line.kind !== "segment" && line.kind !== "ray")) {
    return { doc, error: "اول یک خط (یا پاره‌خط یا نیم‌خط) را انتخاب کنید." };
  }
  const dir = addConstructed(doc, { t: "plusRot", origin: pointId, from: line.a, to: line.b, deg: 0 }, true);
  if (!dir.id) return { doc, error: "خط موازی ساخته نشد. شاید نقطه روی خودش تعریف شده باشد." };
  return addLinear(dir.doc, "line", pointId, dir.id);
}

export function addPerpendicular(doc: BoardDoc, lineId: Id, pointId: Id): OpResult {
  const line = doc.objects.find((o) => o.id === lineId);
  if (!line || (line.kind !== "line" && line.kind !== "segment" && line.kind !== "ray")) {
    return { doc, error: "اول یک خط را انتخاب کنید." };
  }
  const dir = addConstructed(doc, { t: "plusRot", origin: pointId, from: line.a, to: line.b, deg: 90 }, true);
  if (!dir.id) return { doc, error: "خط عمود ساخته نشد." };
  return addLinear(dir.doc, "line", pointId, dir.id);
}

export function addPerpBisector(doc: BoardDoc, a: Id, b: Id): OpResult {
  const mid = addMidpoint(doc, a, b);
  if (!mid.id) return mid;
  const dir = addConstructed(mid.doc, { t: "plusRot", origin: mid.id, from: a, to: b, deg: 90 }, true);
  if (!dir.id) return { doc, error: "عمودمنصف ساخته نشد." };
  const line = addLinear(dir.doc, "line", mid.id, dir.id);
  return { doc: line.doc, id: line.id, ids: [mid.id, line.id].filter((x): x is Id => !!x) };
}

export function addBisector(doc: BoardDoc, a: Id, vertex: Id, b: Id): OpResult {
  const dir = addConstructed(doc, { t: "bisector", v: vertex, a, b }, true);
  if (!dir.id) return { doc, error: "نیمساز ساخته نشد. سه نقطه نباید روی هم باشند." };
  return addLinear(dir.doc, "ray", vertex, dir.id);
}

export function addIntersection(doc: BoardDoc, a: Id, b: Id, near?: V): OpResult {
  if (a === b) return { doc, error: "دو شیء متفاوت را انتخاب کنید." };
  const first = addConstructed(doc, { t: "intersect", a, b, k: 0 });
  if (!first.id) return { doc, error: "این دو شیء هم‌اکنون نقطهٔ برخوردی ندارند." };
  const second = addConstructed(first.doc, { t: "intersect", a, b, k: 1 });
  if (!second.id) return first;
  const ev = evaluate(second.doc);
  const p0 = ev.pos.get(first.id);
  const p1 = ev.pos.get(second.id);
  if (!p0 || !p1 || dist(p0, p1) < 1e-4) return first;
  if (near) {
    if (dist(p0, near) <= dist(p1, near)) return first;
    return addConstructed(doc, { t: "intersect", a, b, k: 1 });
  }
  return { doc: second.doc, id: second.id, ids: [first.id, second.id] };
}

export function addCircleThrough(doc: BoardDoc, center: Id, through: Id): OpResult {
  if (center === through) return { doc, error: "مرکز و نقطهٔ روی محیط باید متفاوت باشند." };
  const slot = alloc(doc);
  const obj: GCircle = { id: slot.id, kind: "circle", center, through };
  const next = withObj(slot.doc, obj);
  const ev = evaluate(next);
  if (ev.broken.has(slot.id)) return { doc, error: "دایره ساخته نشد." };
  return { doc: next, id: slot.id };
}

export function addCircleRadius(doc: BoardDoc, center: Id, radius: number): OpResult {
  if (!(radius > 0) || !Number.isFinite(radius)) return { doc, error: "شعاع باید عددی مثبت باشد." };
  const slot = alloc(doc);
  const obj: GCircle = { id: slot.id, kind: "circle", center, radius };
  return { doc: withObj(slot.doc, obj), id: slot.id };
}

export function addCircleRadiusOf(doc: BoardDoc, center: Id, segId: Id): OpResult {
  const seg = doc.objects.find((o) => o.id === segId);
  if (!seg || seg.kind !== "segment") return { doc, error: "اول یک پاره‌خط را برای انتقال طول انتخاب کنید." };
  const slot = alloc(doc);
  const obj: GCircle = { id: slot.id, kind: "circle", center, radiusOf: segId };
  return { doc: withObj(slot.doc, obj), id: slot.id };
}

export function addCircle3(doc: BoardDoc, a: Id, b: Id, c: Id): OpResult {
  const center = addConstructed(doc, { t: "circum", a, b, c });
  if (!center.id) return { doc, error: "این سه نقطه روی یک خط‌اند و دایره‌ای نمی‌سازند." };
  return addCircleThrough(center.doc, center.id, a);
}

export function addArc(doc: BoardDoc, circleId: Id, a: Id, b: Id): OpResult {
  const c = doc.objects.find((o) => o.id === circleId);
  if (!c || c.kind !== "circle") return { doc, error: "اول یک دایره را انتخاب کنید." };
  const slot = alloc(doc);
  return { doc: withObj(slot.doc, { id: slot.id, kind: "arc", circle: circleId, a, b }), id: slot.id };
}

export function addAngle(doc: BoardDoc, a: Id, v: Id, b: Id): OpResult {
  const slot = alloc(doc);
  return { doc: withObj(slot.doc, { id: slot.id, kind: "angle", a, v, b }), id: slot.id };
}

export type Xform =
  | { t: "translate"; dx: number; dy: number }
  | { t: "translateBy"; from: Id; to: Id }
  | { t: "rotate"; center: Id; deg: number }
  | { t: "reflect"; axis: Id }
  | { t: "scale"; center: Id; k: number };

function xdef(src: Id, xf: Xform): PointDef {
  switch (xf.t) {
    case "translate":
      return { t: "translate", src, dx: xf.dx, dy: xf.dy };
    case "translateBy":
      return { t: "translateBy", src, from: xf.from, to: xf.to };
    case "rotate":
      return { t: "rotate", src, center: xf.center, deg: xf.deg };
    case "reflect":
      return { t: "reflect", src, axis: xf.axis };
    case "scale":
      return { t: "scale", src, center: xf.center, k: xf.k };
  }
}

export function transformObjects(doc: BoardDoc, ids: Id[], xf: Xform): OpResult {
  const chosen = doc.objects.filter((o) => ids.includes(o.id));
  if (chosen.length === 0) return { doc, error: "اول یک شکل را انتخاب کنید." };
  const pointIds = new Set<Id>();
  for (const o of chosen) {
    if (o.kind === "point") pointIds.add(o.id);
    else refsOf(o).forEach((id) => {
      const ref = doc.objects.find((x) => x.id === id);
      if (ref?.kind === "point") pointIds.add(id);
    });
  }
  if (pointIds.size === 0) return { doc, error: "در این انتخاب نقطه‌ای برای تبدیل نیست." };
  const map = new Map<Id, Id>();
  let cur = doc;
  for (const pid of pointIds) {
    const made = addConstructed(cur, xdef(pid, xf));
    if (!made.id) return { doc, error: made.error ?? "تصویر نقطه ساخته نشد." };
    map.set(pid, made.id);
    cur = made.doc;
  }
  const created: Id[] = [...map.values()];
  for (const o of chosen) {
    if (o.kind === "point") continue;
    const slot = alloc(cur);
    cur = slot.doc;
    let copy: Obj | null = null;
    if (o.kind === "line" || o.kind === "ray" || o.kind === "segment") {
      const a = map.get(o.a);
      const b = map.get(o.b);
      if (a && b) copy = { ...o, id: slot.id, a, b, aux: false };
    } else if (o.kind === "polygon") {
      copy = { id: slot.id, kind: "polygon", verts: o.verts.map((v) => map.get(v) ?? v) };
    } else if (o.kind === "circle") {
      const center = map.get(o.center) ?? o.center;
      copy = {
        id: slot.id,
        kind: "circle",
        center,
        through: o.through ? map.get(o.through) : undefined,
        radius: o.through ? undefined : o.radius,
        radiusOf: o.through ? undefined : o.radiusOf,
      };
    } else if (o.kind === "angle") {
      copy = { id: slot.id, kind: "angle", a: map.get(o.a) ?? o.a, v: map.get(o.v) ?? o.v, b: map.get(o.b) ?? o.b };
    } else if (o.kind === "arc") {
      copy = { id: slot.id, kind: "arc", circle: o.circle, a: map.get(o.a) ?? o.a, b: map.get(o.b) ?? o.b };
    }
    if (copy) {
      cur = withObj(cur, copy);
      created.push(slot.id);
    }
  }
  if (xf.t === "reflect") {
    for (const [src, img] of map) {
      const foot = addConstructed(cur, { t: "mid", a: src, b: img }, true);
      if (!foot.id) continue;
      cur = foot.doc;
      const s1 = addLinear(cur, "segment", src, foot.id, { dashed: true, aux: true });
      cur = s1.doc;
      if (s1.id) created.push(s1.id);
      const s2 = addLinear(cur, "segment", foot.id, img, { dashed: true, aux: true });
      cur = s2.doc;
      if (s2.id) created.push(s2.id);
    }
  }
  return { doc: cur, ids: created, id: created[0] };
}

export function dragPoint(doc: BoardDoc, id: Id, at: V, snap: boolean): BoardDoc {
  const ev = evaluate(doc);
  const next = cloneBoard(doc);
  const obj = next.objects.find((o) => o.id === id);
  if (!obj || obj.kind !== "point") return doc;
  const target = snap && obj.def.t === "free" ? snapPoint(at) : at;
  if (obj.def.t === "free") {
    obj.def = { t: "free", x: target.x, y: target.y };
    next.updatedAt = Date.now();
    return next;
  }
  if (obj.def.t === "onLine" || obj.def.t === "onSeg" || obj.def.t === "onRay") {
    const cid = obj.def.t === "onLine" ? obj.def.line : obj.def.t === "onSeg" ? obj.def.seg : obj.def.ray;
    const carrier = doc.objects.find((o) => o.id === cid);
    if (!carrier || (carrier.kind !== "line" && carrier.kind !== "segment" && carrier.kind !== "ray")) return doc;
    const a = ev.pos.get(carrier.a);
    const b = ev.pos.get(carrier.b);
    if (!a || !b) return doc;
    let u = projectParam(target, a, b);
    if (u == null) return doc;
    if (obj.def.t === "onSeg") u = Math.min(1, Math.max(0, u));
    if (obj.def.t === "onRay") u = Math.max(0, u);
    obj.def = { ...obj.def, u };
    next.updatedAt = Date.now();
    return next;
  }
  if (obj.def.t === "onCircle") {
    const def = obj.def;
    const cobj = doc.objects.find((o) => o.id === def.circle);
    if (!cobj || cobj.kind !== "circle") return doc;
    const c = ev.pos.get(cobj.center);
    if (!c) return doc;
    obj.def = { ...def, theta: Math.atan2(target.y - c.y, target.x - c.x) };
    next.updatedAt = Date.now();
    return next;
  }
  return doc;
}

export function isDraggable(obj: Obj | undefined): boolean {
  return obj?.kind === "point" && (obj.def.t === "free" || obj.def.t === "onLine" || obj.def.t === "onSeg" || obj.def.t === "onRay" || obj.def.t === "onCircle");
}

export function deleteIds(doc: BoardDoc, ids: Id[]): BoardDoc {
  const remove = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const o of doc.objects) {
      if (remove.has(o.id)) continue;
      if (refsOf(o).some((r) => remove.has(r))) {
        remove.add(o.id);
        grew = true;
      }
    }
  }
  let objects = doc.objects.filter((o) => !remove.has(o.id));
  const referenced = new Set<Id>();
  for (const o of objects) for (const r of refsOf(o)) referenced.add(r);
  objects = objects.filter((o) => !(o.kind === "point" && o.hidden && !referenced.has(o.id)));
  return { ...doc, objects, updatedAt: Date.now() };
}

export function cleanupBroken(doc: BoardDoc): BoardDoc {
  const ev = evaluate(doc);
  return deleteIds(doc, [...ev.broken]);
}

export function clearObjects(doc: BoardDoc): BoardDoc {
  return { ...doc, objects: [], updatedAt: Date.now() };
}

export function hitTest(doc: BoardDoc, at: V, tol: number): Id | null {
  const ev = evaluate(doc);
  const byId = indexObjects(doc);
  let bestId: Id | null = null;
  let bestRank = -1;
  let bestD = Infinity;
  const consider = (id: Id, rank: number, d: number) => {
    if (d > tol) return;
    if (bestId == null || rank > bestRank || (rank === bestRank && d < bestD)) {
      bestId = id;
      bestRank = rank;
      bestD = d;
    }
  };
  for (const o of doc.objects) {
    if (ev.broken.has(o.id)) continue;
    if (o.kind === "point") {
      if (o.hidden) continue;
      const p = ev.pos.get(o.id);
      if (p) consider(o.id, 5, dist(p, at));
    } else if (o.kind === "segment") {
      const a = ev.pos.get(o.a);
      const b = ev.pos.get(o.b);
      if (a && b) consider(o.id, 3, distToSegment(at, a, b));
    } else if (o.kind === "line") {
      const a = ev.pos.get(o.a);
      const b = ev.pos.get(o.b);
      if (a && b) consider(o.id, 2, distToLine(at, a, b));
    } else if (o.kind === "ray") {
      const a = ev.pos.get(o.a);
      const b = ev.pos.get(o.b);
      if (a && b) consider(o.id, 3, distToRay(at, a, b));
    } else if (o.kind === "circle") {
      const c = ev.pos.get(o.center);
      const r = ev.radius.get(o.id);
      if (c && r != null) consider(o.id, 2, Math.abs(dist(c, at) - r));
    } else if (o.kind === "polygon") {
      const pts = o.verts.map((id) => ev.pos.get(id));
      if (pts.every(Boolean)) {
        for (let i = 0; i < o.verts.length; i++) {
          const a = pts[i]!;
          const b = pts[(i + 1) % o.verts.length]!;
          consider(o.id, 1, distToSegment(at, a, b));
        }
      }
    } else if (o.kind === "arc") {
      const circle = byId.get(o.circle);
      if (circle?.kind === "circle") {
        const c = ev.pos.get(circle.center);
        const r = ev.radius.get(circle.id);
        if (c && r != null) consider(o.id, 2, Math.abs(dist(c, at) - r));
      }
    }
  }
  return bestId;
}

export function objectPoints(doc: BoardDoc, id: Id): V[] {
  const ev = evaluate(doc);
  const o = doc.objects.find((x) => x.id === id);
  if (!o) return [];
  if (o.kind === "point") {
    const p = ev.pos.get(o.id);
    return p ? [p] : [];
  }
  if (o.kind === "polygon") return o.verts.map((v) => ev.pos.get(v)).filter((p): p is V => !!p);
  if (o.kind === "line" || o.kind === "ray" || o.kind === "segment") {
    const a = ev.pos.get(o.a);
    const b = ev.pos.get(o.b);
    return a && b ? [a, b] : [];
  }
  return [];
}

export function pointCarrier(def: PointDef): Id | null {
  if (def.t === "onLine") return def.line;
  if (def.t === "onSeg") return def.seg;
  if (def.t === "onRay") return def.ray;
  if (def.t === "onCircle") return def.circle;
  return null;
}

void pointOn;
void circleRadius;
