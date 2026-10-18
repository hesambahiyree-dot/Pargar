import { lessonById } from "./curriculum.ts";
import { evaluate } from "./geometry/eval.ts";
import { parallelDir, sub } from "./geometry/math.ts";
import {
  addCircleRadius,
  addFreePoint,
  addLinear,
  addPerpBisector,
  addPointOn,
  addPolygon,
} from "./geometry/ops.ts";
import { createBoard, type BoardDoc, type GLinear, type Obj } from "./geometry/types.ts";

function base(id: string, axes = false): BoardDoc {
  const lesson = lessonById(id);
  return createBoard({
    name: lesson ? lesson.title : "تخته",
    grade: lesson?.grade ?? null,
    lessonId: id,
    showAxes: axes,
    showGrid: true,
    showMeasures: true,
  });
}

function must(doc: BoardDoc, id?: string): { doc: BoardDoc; id: string } {
  if (!id) return { doc, id: "" };
  return { doc, id };
}

export function seedLesson(id: string): BoardDoc {
  if (id === "g8-parallel" || id === "s9-aux") {
    let doc = base(id);
    const a = addFreePoint(doc, { x: -3, y: 0 }, false);
    doc = a.doc;
    const b = addFreePoint(doc, { x: 3, y: 0 }, false);
    doc = b.doc;
    const line = addLinear(doc, "line", a.id!, b.id!);
    doc = line.doc;
    const p = addFreePoint(doc, { x: 0, y: 2 }, false);
    doc = p.doc;
    const c = addFreePoint(doc, { x: -2, y: -1.2 }, false);
    doc = c.doc;
    const d = addFreePoint(doc, { x: 2, y: -1.2 }, false);
    doc = d.doc;
    const e = addFreePoint(doc, { x: 0, y: 1.4 }, false);
    doc = e.doc;
    if (id === "s9-aux") {
      const poly = addPolygon(doc, [c.id!, d.id!, e.id!]);
      doc = poly.doc;
    }
    void line;
    return doc;
  }
  if (id === "g8-quad" || id === "g9-solve") {
    let doc = base(id);
    const a = addFreePoint(doc, { x: -2, y: -1 }, false);
    doc = a.doc;
    const b = addFreePoint(doc, { x: 2, y: -1 }, false);
    doc = b.doc;
    const c = addFreePoint(doc, { x: 3, y: 1.4 }, false);
    doc = c.doc;
    const d = addFreePoint(doc, { x: 0, y: 0 }, false);
    doc = d.doc;
    const built = addFreePoint(doc, { x: 0, y: 0 }, true);
    doc = deleteFree(built.doc, built.id!);
    const img = {
      ...doc,
      objects: [
        ...doc.objects,
        {
          id: `g${doc.next}`,
          kind: "point" as const,
          label: "D",
          def: { t: "translateBy" as const, src: a.id!, from: b.id!, to: c.id! },
        },
      ],
      next: doc.next + 1,
    };
    const poly = addPolygon(img, [a.id!, b.id!, c.id!, `g${doc.next}`]);
    return poly.doc;
  }
  if (id === "g8-cong-tri" || id === "g9-proof") {
    let doc = base(id);
    const a = addFreePoint(doc, { x: -2, y: 0 }, false);
    doc = a.doc;
    const b = addFreePoint(doc, { x: 2, y: 0 }, false);
    doc = b.doc;
    const bis = addPerpBisector(doc, a.id!, b.id!);
    doc = bis.doc;
    const on = addPointOn(doc, bis.id!, { x: 2, y: 2.2 });
    doc = on.doc;
    if (id === "g8-cong-tri" && on.id) {
      const poly = addPolygon(doc, [a.id!, b.id!, on.id]);
      doc = poly.doc;
    }
    if (id === "g9-proof") {
      const c = addFreePoint(doc, { x: 0.4, y: 2.4 }, false);
      doc = c.doc;
      const poly = addPolygon(doc, [a.id!, b.id!, c.id!]);
      doc = poly.doc;
    }
    return doc;
  }
  if (id === "g8-pyth" || id === "g8-rhs") {
    let doc = base(id);
    const a = addFreePoint(doc, { x: 0, y: 0 }, false);
    doc = a.doc;
    const b = addFreePoint(doc, { x: 3, y: 0 }, false);
    doc = b.doc;
    const c = addFreePoint(doc, { x: 0, y: 4 }, false);
    doc = c.doc;
    return addPolygon(doc, [a.id!, b.id!, c.id!]).doc;
  }
  if (id === "g8-line-circle" || id === "g8-central" || id === "g8-inscribed") {
    let doc = base(id);
    const c = addFreePoint(doc, { x: 0, y: 0 }, false);
    doc = c.doc;
    const circle = addCircleRadius(doc, c.id!, 2);
    doc = circle.doc;
    const a = addFreePoint(doc, { x: -3, y: 1.2 }, false);
    doc = a.doc;
    const b = addFreePoint(doc, { x: 3, y: 1.2 }, false);
    doc = b.doc;
    const line = addLinear(doc, "line", a.id!, b.id!);
    doc = line.doc;
    void circle;
    return doc;
  }
  if (id === "g8-vec" || id === "g8-scale-vec" || id === "g8-unit" || id === "g9-line" || id === "g9-slope") {
    let doc = base(id, true);
    const a = addFreePoint(doc, { x: 0, y: 0 }, false);
    doc = a.doc;
    const b = addFreePoint(doc, { x: 3, y: 2 }, false);
    doc = b.doc;
    const seg = addLinear(doc, id.startsWith("g9") ? "line" : "segment", a.id!, b.id!, id.startsWith("g8") ? { arrow: true } : undefined);
    return seg.doc;
  }
  if (id === "g9-similar" || id === "g8-cong-shape" || id === "g8-poly") {
    let doc = base(id);
    const a = addFreePoint(doc, { x: -1, y: -0.6 }, false);
    doc = a.doc;
    const b = addFreePoint(doc, { x: 1.2, y: -0.4 }, false);
    doc = b.doc;
    const c = addFreePoint(doc, { x: 0.4, y: 1.2 }, false);
    doc = c.doc;
    return addPolygon(doc, [a.id!, b.id!, c.id!]).doc;
  }
  if (id === "g9-reason") {
    let doc = base(id);
    const a = addFreePoint(doc, { x: -2, y: 0 }, false);
    doc = a.doc;
    const b = addFreePoint(doc, { x: 2, y: 0 }, false);
    doc = b.doc;
    const c = addFreePoint(doc, { x: 1.2, y: 1.6 }, false);
    doc = c.doc;
    return addPolygon(doc, [a.id!, b.id!, c.id!]).doc;
  }
  if (id === "g9-cong") {
    let doc = base(id);
    const pts = [
      [-3, 0],
      [-1, 0],
      [-3, 1.5],
      [1, 0],
      [3, 0],
      [1, 1.5],
    ] as const;
    const ids: string[] = [];
    for (const [x, y] of pts) {
      const p = addFreePoint(doc, { x, y }, false);
      doc = p.doc;
      ids.push(p.id!);
    }
    doc = addPolygon(doc, [ids[0]!, ids[1]!, ids[2]!]).doc;
    doc = addPolygon(doc, [ids[3]!, ids[4]!, ids[5]!]).doc;
    return doc;
  }
  return base(id, id.startsWith("g9-line") || id.includes("vec"));
}

function isPlainLine(o: Obj): o is GLinear & { kind: "line" } {
  return o.kind === "line" && !o.aux;
}

function deleteFree(doc: BoardDoc, id: string): BoardDoc {
  return { ...doc, objects: doc.objects.filter((o) => o.id !== id) };
}

export function checkLesson(id: string, doc: BoardDoc): { ok: boolean; message: string } | null {
  const ev = evaluate(doc);
  if (id === "g8-parallel" || id === "s9-aux") {
    const lines = doc.objects.filter(isPlainLine);
    if (lines.length < 2) return { ok: false, message: "هنوز خط دوم را نساخته‌ای. ابزار موازی: اول خط، بعد نقطه." };
    const dir = (o: (typeof lines)[number]) => {
      const a = ev.pos.get(o.a);
      const b = ev.pos.get(o.b);
      return a && b ? sub(b, a) : null;
    };
    const d0 = dir(lines[0]!);
    if (!d0) return { ok: false, message: "خط اول آماده نیست." };
    const ok = lines.slice(1).some((l) => {
      const d = dir(l);
      return d && parallelDir(d0, d);
    });
    return ok
      ? { ok: true, message: "یک خط موازی با خط اول روی تخته هست." }
      : { ok: false, message: "خط تازه‌ای که با خط اول موازی باشد دیده نمی‌شود." };
  }
  if (id === "g8-cong-tri") {
    const poly = doc.objects.find((o) => o.kind === "polygon");
    if (!poly || poly.kind !== "polygon") return { ok: false, message: "مثلث پیدا نشد." };
    const pts = poly.verts.map((v) => ev.pos.get(v)!);
    const d1 = Math.hypot(pts[0]!.x - pts[2]!.x, pts[0]!.y - pts[2]!.y);
    const d2 = Math.hypot(pts[1]!.x - pts[2]!.x, pts[1]!.y - pts[2]!.y);
    return Math.abs(d1 - d2) < 1e-3
      ? { ok: true, message: "دو ساق برابرند، چون رأس روی عمودمنصف مانده است." }
      : { ok: false, message: "ساق‌ها برابر نیستند. رأس باید به عمودمنصف وابسته بماند." };
  }
  if (id === "g8-poly") {
    const poly = doc.objects.find((o) => o.kind === "polygon" && o.verts.length === 6);
    return poly
      ? { ok: true, message: "شش‌ضلعی روی تخته هست. زاویهٔ داخلی منتظم آن ۱۲۰ درجه است." }
      : { ok: false, message: "هنوز شش‌ضلعی منتظم ساخته نشده. ابزار منتظم، تعداد ۶." };
  }
  void must;
  return null;
}
