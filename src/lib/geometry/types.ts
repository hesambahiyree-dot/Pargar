export type Tool =
  | "select" | "point" | "segment" | "line" | "ray" | "circle" | "compass" | "polygon" | "midpoint" | "perpendicular" | "parallel" | "perp-bisector" | "angle-bisector" | "angle" | "intersect" | "reflect" | "rotate90" | "translate" | "delete";
export type Constraint =
  | { type: "free" } | { type: "midpoint"; a: string; b: string } | { type: "on-line"; a: string; b: string; t: number } | { type: "on-circle"; center: string; through: string; angle: number }
  | { type: "intersection-ll"; a1: string; b1: string; a2: string; b2: string } | { type: "intersection-lc"; a: string; b: string; center: string; through: string; which: 0 | 1 }
  | { type: "intersection-cc"; c1: string; t1: string; c2: string; t2: string; which: 0 | 1 } | { type: "foot"; p: string; a: string; b: string }
  | { type: "offset"; origin: string; from: string; to: string } | { type: "offset-perp"; origin: string; from: string; to: string }
  | { type: "on-bisector"; a: string; v: string; b: string; dist: number } | { type: "reflect"; src: string; a: string; b: string }
  | { type: "rotate"; src: string; center: string; angle: number } | { type: "translate"; src: string; from: string; to: string };
export interface PointObj { kind: "point"; id: string; name: string; x: number; y: number; hidden?: boolean; locked?: boolean; color?: string; constraint: Constraint; }
export interface SegmentObj { kind: "segment"; id: string; a: string; b: string; showLength?: boolean; marks?: number; color?: string; dashed?: boolean; }
export interface LineObj { kind: "line"; id: string; a: string; b: string; color?: string; dashed?: boolean; }
export interface RayObj { kind: "ray"; id: string; a: string; b: string; color?: string; dashed?: boolean; }
export interface CircleObj { kind: "circle"; id: string; center: string; through: string; color?: string; dashed?: boolean; }
export interface PolygonObj { kind: "polygon"; id: string; verts: string[]; showArea?: boolean; fill?: string; color?: string; }
export interface AngleObj { kind: "angle"; id: string; a: string; v: string; b: string; showMeasure?: boolean; color?: string; }
export type GeoObject = PointObj | SegmentObj | LineObj | RayObj | CircleObj | PolygonObj | AngleObj;
export interface BoardSettings { grid: boolean; axes: boolean; snap: boolean; labels: boolean; measurements: boolean; }
export interface PendingAction { tool: Tool; ids: string[]; }
export interface LessonStep { title: string; body: string; highlight?: string[]; }
export interface Lesson { id: string; grade: 8 | 9; chapter: string; title: string; summary: string; goals: string[]; steps: LessonStep[]; build: () => GeoObject[]; }
export type MeasureKind = "length" | "angle" | "area";
export interface Measure { id: string; kind: MeasureKind; label: string; value: number; unit: string; }
export type TemplateId = "triangle" | "right-345" | "square" | "circle" | "equilateral";
