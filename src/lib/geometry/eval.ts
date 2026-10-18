import {
  EPS,
  add,
  circleCircleIntersection,
  circumcircle,
  dist,
  finiteV,
  len,
  lineCircleIntersection,
  lineLineIntersection,
  mul,
  pointOn,
  reflectPoint,
  rotateAround,
  rotateVec,
  sub,
  type V,
} from "./math.ts";
import type { BoardDoc, EvalResult, GCircle, GLinear, Id, Obj, PointDef } from "./types.ts";

function unitDir(d: V): V | null {
  const L = len(d);
  if (L < EPS) return null;
  return { x: d.x / L, y: d.y / L };
}

export function indexObjects(doc: BoardDoc): Map<Id, Obj> {
  return new Map(doc.objects.map((o) => [o.id, o]));
}

export function refsOf(o: Obj): Id[] {
  switch (o.kind) {
    case "point":
      return pointRefs(o.def);
    case "line":
    case "ray":
    case "segment":
      return [o.a, o.b];
    case "circle":
      return [o.center, o.through, o.radiusOf].filter((x): x is Id => !!x);
    case "polygon":
      return [...o.verts];
    case "angle":
      return [o.a, o.v, o.b];
    case "arc":
      return [o.circle, o.a, o.b];
  }
}

function pointRefs(def: PointDef): Id[] {
  switch (def.t) {
    case "free":
      return [];
    case "onLine":
      return [def.line];
    case "onSeg":
      return [def.seg];
    case "onRay":
      return [def.ray];
    case "onCircle":
      return [def.circle];
    case "mid":
      return [def.a, def.b];
    case "intersect":
      return [def.a, def.b];
    case "translate":
      return [def.src];
    case "translateBy":
      return [def.src, def.from, def.to];
    case "rotate":
      return [def.src, def.center];
    case "reflect":
      return [def.src, def.axis];
    case "scale":
      return [def.src, def.center];
    case "plusRot":
      return [def.origin, def.from, def.to];
    case "bisector":
      return [def.v, def.a, def.b];
    case "circum":
      return [def.a, def.b, def.c];
  }
}

export function circleRadius(c: GCircle, pos: Map<Id, V>, byId: Map<Id, Obj>): number | null {
  const center = pos.get(c.center);
  if (!center) return null;
  if (c.through) {
    const p = pos.get(c.through);
    if (!p) return null;
    return dist(center, p);
  }
  if (c.radiusOf) {
    const s = byId.get(c.radiusOf);
    if (!s || (s.kind !== "segment" && s.kind !== "line" && s.kind !== "ray")) return null;
    const a = pos.get(s.a);
    const b = pos.get(s.b);
    if (!a || !b) return null;
    return dist(a, b);
  }
  if (typeof c.radius === "number" && Number.isFinite(c.radius) && c.radius >= 0) return c.radius;
  return null;
}

function linearEnds(o: GLinear, pos: Map<Id, V>): [V, V] | null {
  const a = pos.get(o.a);
  const b = pos.get(o.b);
  if (!a || !b || dist(a, b) < EPS) return null;
  return [a, b];
}

function intersectionsOf(a: Obj, b: Obj, pos: Map<Id, V>, byId: Map<Id, Obj>): V[] {
  const asLine = (o: Obj): [V, V] | null =>
    o.kind === "line" || o.kind === "ray" || o.kind === "segment" ? linearEnds(o, pos) : null;
  const asCircle = (o: Obj): { c: V; r: number } | null => {
    if (o.kind !== "circle") return null;
    const c = pos.get(o.center);
    const r = circleRadius(o, pos, byId);
    if (!c || r == null) return null;
    return { c, r };
  };
  const la = asLine(a);
  const lb = asLine(b);
  const ca = asCircle(a);
  const cb = asCircle(b);
  let pts: V[] = [];
  if (la && lb) {
    const p = lineLineIntersection(la[0], la[1], lb[0], lb[1]);
    if (p) pts = [p];
  } else if (la && cb) {
    pts = lineCircleIntersection(la[0], la[1], cb.c, cb.r);
  } else if (ca && lb) {
    pts = lineCircleIntersection(lb[0], lb[1], ca.c, ca.r);
  } else if (ca && cb) {
    pts = circleCircleIntersection(ca.c, ca.r, cb.c, cb.r);
  }
  pts = pts.filter(finiteV);
  pts.sort((p, q) => p.x - q.x || p.y - q.y);
  return pts;
}

function evalPoint(def: PointDef, pos: Map<Id, V>, byId: Map<Id, Obj>): V | null {
  const need = (...ids: Id[]): V[] | null => {
    const ps: V[] = [];
    for (const id of ids) {
      const p = pos.get(id);
      if (!p) return null;
      ps.push(p);
    }
    return ps;
  };
  switch (def.t) {
    case "free": {
      const p = { x: def.x, y: def.y };
      return finiteV(p) ? p : null;
    }
    case "onLine":
    case "onSeg":
    case "onRay": {
      const id = def.t === "onLine" ? def.line : def.t === "onSeg" ? def.seg : def.ray;
      const o = byId.get(id);
      if (!o || (o.kind !== "line" && o.kind !== "segment" && o.kind !== "ray")) return null;
      const ends = linearEnds(o, pos);
      if (!ends) return null;
      let u = def.u;
      if (!Number.isFinite(u)) return null;
      if (def.t === "onSeg") u = Math.min(1, Math.max(0, u));
      if (def.t === "onRay") u = Math.max(0, u);
      return pointOn(ends[0], ends[1], u);
    }
    case "onCircle": {
      const o = byId.get(def.circle);
      if (!o || o.kind !== "circle") return null;
      const c = pos.get(o.center);
      const r = circleRadius(o, pos, byId);
      if (!c || r == null || !Number.isFinite(def.theta)) return null;
      return { x: c.x + r * Math.cos(def.theta), y: c.y + r * Math.sin(def.theta) };
    }
    case "mid": {
      const ps = need(def.a, def.b);
      if (!ps) return null;
      return mul(add(ps[0], ps[1]), 0.5);
    }
    case "intersect": {
      const oa = byId.get(def.a);
      const ob = byId.get(def.b);
      if (!oa || !ob) return null;
      const pts = intersectionsOf(oa, ob, pos, byId);
      const picked = pts[def.k];
      return picked ?? null;
    }
    case "translate": {
      const p = pos.get(def.src);
      if (!p || !Number.isFinite(def.dx) || !Number.isFinite(def.dy)) return null;
      return { x: p.x + def.dx, y: p.y + def.dy };
    }
    case "translateBy": {
      const ps = need(def.src, def.from, def.to);
      if (!ps) return null;
      return add(ps[0], sub(ps[2], ps[1]));
    }
    case "rotate": {
      const ps = need(def.src, def.center);
      if (!ps || !Number.isFinite(def.deg)) return null;
      return rotateAround(ps[0], ps[1], def.deg);
    }
    case "reflect": {
      const src = pos.get(def.src);
      const axis = byId.get(def.axis);
      if (!src || !axis || (axis.kind !== "line" && axis.kind !== "segment" && axis.kind !== "ray")) return null;
      const ends = linearEnds(axis, pos);
      if (!ends) return null;
      return reflectPoint(src, ends[0], ends[1]);
    }
    case "scale": {
      const ps = need(def.src, def.center);
      if (!ps || !Number.isFinite(def.k)) return null;
      return add(ps[1], mul(sub(ps[0], ps[1]), def.k));
    }
    case "plusRot": {
      const ps = need(def.origin, def.from, def.to);
      if (!ps) return null;
      const dir = rotateVec(sub(ps[2], ps[1]), def.deg);
      if (len(dir) < EPS) return null;
      return add(ps[0], dir);
    }
    case "bisector": {
      const ps = need(def.v, def.a, def.b);
      if (!ps) return null;
      const ua = unitDir(sub(ps[1], ps[0]));
      const ub = unitDir(sub(ps[2], ps[0]));
      if (!ua || !ub) return null;
      const sum = add(ua, ub);
      if (len(sum) < EPS) {
        const perp = rotateVec(ua, 90);
        return add(ps[0], perp);
      }
      return add(ps[0], sum);
    }
    case "circum": {
      const ps = need(def.a, def.b, def.c);
      if (!ps) return null;
      return circumcircle(ps[0], ps[1], ps[2])?.center ?? null;
    }
  }
}

export function evaluate(doc: BoardDoc): EvalResult {
  const byId = indexObjects(doc);
  const pos = new Map<Id, V>();
  const radius = new Map<Id, number>();
  const broken = new Set<Id>();
  const points = doc.objects.filter((o): o is Extract<Obj, { kind: "point" }> => o.kind === "point");
  const limit = Math.max(2, points.length + 2);
  for (let pass = 0; pass < limit; pass++) {
    let changed = false;
    for (const p of points) {
      const next = evalPoint(p.def, pos, byId);
      if (!finiteV(next)) {
        if (pos.delete(p.id)) changed = true;
        continue;
      }
      const prev = pos.get(p.id);
      if (!prev || dist(prev, next) > 1e-10) {
        pos.set(p.id, next);
        changed = true;
      }
    }
    if (!changed && pass > 0) break;
  }
  for (const p of points) {
    if (!pos.has(p.id)) broken.add(p.id);
  }
  for (const o of doc.objects) {
    if (o.kind === "point") continue;
    if (o.kind === "circle") {
      const r = circleRadius(o, pos, byId);
      if (r == null || !Number.isFinite(r)) broken.add(o.id);
      else radius.set(o.id, r);
      if (!pos.has(o.center)) broken.add(o.id);
      continue;
    }
    if (refsOf(o).some((id) => !pos.has(id) && byId.get(id)?.kind === "point")) {
      broken.add(o.id);
      continue;
    }
    if (refsOf(o).some((id) => broken.has(id) || !byId.has(id))) broken.add(o.id);
    if ((o.kind === "line" || o.kind === "ray" || o.kind === "segment") && !linearEnds(o, pos)) {
      broken.add(o.id);
    }
  }
  return { pos, radius, broken };
}
