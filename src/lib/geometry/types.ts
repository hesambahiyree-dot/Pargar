import type { V } from "./math.ts";

export type Id = string;

export type PointDef =
  | { t: "free"; x: number; y: number }
  | { t: "onLine"; line: Id; u: number }
  | { t: "onSeg"; seg: Id; u: number }
  | { t: "onRay"; ray: Id; u: number }
  | { t: "onCircle"; circle: Id; theta: number }
  | { t: "mid"; a: Id; b: Id }
  | { t: "intersect"; a: Id; b: Id; k: 0 | 1 }
  | { t: "translate"; src: Id; dx: number; dy: number }
  | { t: "translateBy"; src: Id; from: Id; to: Id }
  | { t: "rotate"; src: Id; center: Id; deg: number }
  | { t: "reflect"; src: Id; axis: Id }
  | { t: "scale"; src: Id; center: Id; k: number }
  | { t: "plusRot"; origin: Id; from: Id; to: Id; deg: number }
  | { t: "bisector"; v: Id; a: Id; b: Id }
  | { t: "circum"; a: Id; b: Id; c: Id };

export type GPoint = {
  id: Id;
  kind: "point";
  label?: string;
  hidden?: boolean;
  def: PointDef;
};

export type GLinear = {
  id: Id;
  kind: "line" | "ray" | "segment";
  a: Id;
  b: Id;
  dashed?: boolean;
  aux?: boolean;
  arrow?: boolean;
};

export type GCircle = {
  id: Id;
  kind: "circle";
  center: Id;
  through?: Id;
  radius?: number;
  radiusOf?: Id;
};

export type GPolygon = { id: Id; kind: "polygon"; verts: Id[] };
export type GAngle = { id: Id; kind: "angle"; a: Id; v: Id; b: Id };
export type GArc = { id: Id; kind: "arc"; circle: Id; a: Id; b: Id };

export type Obj = GPoint | GLinear | GCircle | GPolygon | GAngle | GArc;

export type BoardDoc = {
  id: string;
  name: string;
  grade: 8 | 9 | null;
  lessonId: string | null;
  objects: Obj[];
  next: number;
  view: { cx: number; cy: number; scale: number };
  showGrid: boolean;
  showAxes: boolean;
  showMeasures: boolean;
  snap: boolean;
  updatedAt: number;
};

export type EvalResult = {
  pos: Map<Id, V>;
  radius: Map<Id, number>;
  broken: Set<Id>;
};

export function createBoard(partial?: Partial<BoardDoc>): BoardDoc {
  return {
    id: partial?.id ?? `board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: partial?.name ?? "تختهٔ بی‌نام",
    grade: partial?.grade ?? null,
    lessonId: partial?.lessonId ?? null,
    objects: partial?.objects ?? [],
    next: partial?.next ?? 1,
    view: partial?.view ?? { cx: 0, cy: 0, scale: 52 },
    showGrid: partial?.showGrid ?? true,
    showAxes: partial?.showAxes ?? false,
    showMeasures: partial?.showMeasures ?? true,
    snap: partial?.snap ?? false,
    updatedAt: partial?.updatedAt ?? Date.now(),
  };
}

export function cloneBoard(doc: BoardDoc): BoardDoc {
  return structuredClone(doc);
}
