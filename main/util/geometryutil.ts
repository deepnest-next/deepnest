// geometryutil.ts
import { Point } from "./point.js";
//import { Vector } from "./vector.js";

// --- START OF INTERFACE/TYPE DEFINITIONS ---
export interface Polygon extends Array<Point> {
  offsetx?: number;
  offsety?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuadraticBezierSegmentDef {
  p1: Point;
  p2: Point;
  c1: Point;
}

export interface CubicBezierSegmentDef {
  p1: Point;
  p2: Point;
  c1: Point;
  c2: Point;
}

export interface ArcCenterParams {
  center: Point;
  rx: number;
  ry: number;
  theta: number;
  extent: number;
  angle: number;
}

export interface ArcSvgParams {
  p1: Point;
  p2: Point;
  rx: number;
  ry: number;
  angle: number;
  largearc: 0 | 1;
  sweep: 0 | 1;
}

interface TouchingInfo {
  type: 0 | 1 | 2;
  A: number;
  B: number;
}

interface VectorWithPathInfo extends Point {
  start: Point;
  end: Point;
}
// --- END OF INTERFACE/TYPE DEFINITIONS ---

// --- MODULE-SCOPED CONSTANTS & HELPERS (not exported) ---
const TOL: number = Math.pow(10, -9);

function _degreesToRadians(angle: number): number {
  return angle * (Math.PI / 180);
}

function _radiansToDegrees(angle: number): number {
  return angle * (180 / Math.PI);
}

function _normalizeVector(v: Point): Point {
  const sqLength = v.x * v.x + v.y * v.y;
  if (Math.abs(sqLength - 1) < TOL * TOL) {
    // Compare with TOL^2 for squared length
    return new Point(v.x, v.y);
  }
  const len = Math.sqrt(sqLength);
  if (len === 0) {
    return new Point(0, 0);
  }
  const inverse = 1 / len;
  return new Point(v.x * inverse, v.y * inverse);
}

function _internalAlmostEqual(
  a: number,
  b: number,
  tolerance: number = TOL,
): boolean {
  return Math.abs(a - b) < tolerance;
}

function _internalAlmostEqualPoints(
  a: Point,
  b: Point,
  tolerance: number = TOL,
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < tolerance * tolerance;
}

function _onSegment(
  A: Point,
  B: Point,
  p: Point,
  tolerance: number = TOL,
): boolean {
  if (
    _internalAlmostEqual(A.x, B.x, tolerance) &&
    _internalAlmostEqual(p.x, A.x, tolerance)
  ) {
    if (
      !_internalAlmostEqual(p.y, B.y, tolerance) &&
      !_internalAlmostEqual(p.y, A.y, tolerance) &&
      p.y < Math.max(B.y, A.y) + tolerance &&
      p.y > Math.min(B.y, A.y) - tolerance
    ) {
      // Added tolerance to bounds
      return true;
    }
    return false;
  }
  if (
    _internalAlmostEqual(A.y, B.y, tolerance) &&
    _internalAlmostEqual(p.y, A.y, tolerance)
  ) {
    if (
      !_internalAlmostEqual(p.x, B.x, tolerance) &&
      !_internalAlmostEqual(p.x, A.x, tolerance) &&
      p.x < Math.max(B.x, A.x) + tolerance &&
      p.x > Math.min(B.x, A.x) - tolerance
    ) {
      // Added tolerance to bounds
      return true;
    }
    return false;
  }

  const dAP = Math.sqrt((p.x - A.x) ** 2 + (p.y - A.y) ** 2);
  const dBP = Math.sqrt((p.x - B.x) ** 2 + (p.y - B.y) ** 2);
  const dAB = Math.sqrt((B.x - A.x) ** 2 + (B.y - A.y) ** 2);

  // Check if p is on the line defined by A, B (collinearity)
  // (p.y - A.y) * (B.x - A.x) - (p.x - A.x) * (B.y - A.y) == 0
  if (
    Math.abs((p.y - A.y) * (B.x - A.x) - (p.x - A.x) * (B.y - A.y)) >
    tolerance * dAB
  ) {
    // Scale tolerance by segment length
    return false;
  }

  // Check if p is between A and B (and not an endpoint)
  if (
    _internalAlmostEqualPoints(p, A, tolerance) ||
    _internalAlmostEqualPoints(p, B, tolerance)
  ) {
    return false; // p is an endpoint
  }
  // Check if sum of distances dAP + dBP is close to dAB
  return Math.abs(dAP + dBP - dAB) < tolerance;
}

function _internalLineIntersect(
  A: Point,
  B: Point,
  E: Point,
  F: Point,
  infinite?: boolean,
): Point | null {
  const a1 = B.y - A.y;
  const b1 = A.x - B.x;
  const c1 = B.x * A.y - A.x * B.y;
  const a2 = F.y - E.y;
  const b2 = E.x - F.x;
  const c2 = F.x * E.y - E.x * F.y;

  const denom = a1 * b2 - a2 * b1;
  if (_internalAlmostEqual(denom, 0)) return null;

  const x = (b1 * c2 - b2 * c1) / denom;
  const y = (a2 * c1 - a1 * c2) / denom;
  if (!isFinite(x) || !isFinite(y)) return null;

  if (!infinite) {
    const onAB =
      Math.min(A.x, B.x) - TOL <= x &&
      x <= Math.max(A.x, B.x) + TOL &&
      Math.min(A.y, B.y) - TOL <= y &&
      y <= Math.max(A.y, B.y) + TOL;
    const onEF =
      Math.min(E.x, F.x) - TOL <= x &&
      x <= Math.max(E.x, F.x) + TOL &&
      Math.min(E.y, F.y) - TOL <= y &&
      y <= Math.max(E.y, F.y) + TOL;
    if (!onAB || !onEF) return null;
  }
  return new Point(x, y);
}

function _getSafePolygonPoint(
  poly: Polygon,
  index: number,
  offsetx: number = 0,
  offsety: number = 0,
): Point {
  const p = poly[((index % poly.length) + poly.length) % poly.length];
  return new Point(p.x + offsetx, p.y + offsety);
}

function _inNfp(p: Point, nfpList: Polygon[] | undefined): boolean {
  if (!nfpList || nfpList.length === 0) return false;
  for (const nfp of nfpList) {
    for (const nfpPoint of nfp) {
      if (
        _internalAlmostEqual(p.x, nfpPoint.x) &&
        _internalAlmostEqual(p.y, nfpPoint.y)
      ) {
        return true;
      }
    }
  }
  return false;
}
// --- END OF MODULE-SCOPED HELPERS ---

// --- START OF PUBLIC API ---
export function almostEqual(a: number, b: number, tolerance?: number): boolean {
  return _internalAlmostEqual(a, b, tolerance);
}

export function almostEqualPoints(
  a: Point,
  b: Point,
  tolerance?: number,
): boolean {
  return _internalAlmostEqualPoints(a, b, tolerance);
}

export function withinDistance(
  p1: Point,
  p2: Point,
  distance: number,
): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy < distance * distance;
}

export function lineIntersect(
  A: Point,
  B: Point,
  E: Point,
  F: Point,
  infinite?: boolean,
): Point | null {
  return _internalLineIntersect(A, B, E, F, infinite);
}

export const QuadraticBezier = {
  isFlat: function (p1: Point, p2: Point, c1: Point, tol: number): boolean {
    const flatnessThreshold = 4 * tol * tol;
    let ux = 2 * c1.x - p1.x - p2.x;
    ux *= ux;
    let uy = 2 * c1.y - p1.y - p2.y;
    uy *= uy;
    return ux + uy <= flatnessThreshold;
  },

  linearize: function (p1: Point, p2: Point, c1: Point, tol: number): Point[] {
    const finished: Point[] = [p1];
    const todo: QuadraticBezierSegmentDef[] = [{ p1, p2, c1 }];
    while (todo.length > 0) {
      const segment = todo.shift()!;
      if (this.isFlat(segment.p1, segment.p2, segment.c1, tol)) {
        finished.push(new Point(segment.p2.x, segment.p2.y));
      } else {
        const divided = this.subdivide(segment.p1, segment.p2, segment.c1, 0.5);
        todo.unshift(divided[1]);
        todo.unshift(divided[0]);
      }
    }
    return finished;
  },

  subdivide: function (
    p1: Point,
    p2: Point,
    c1: Point,
    t: number,
  ): [QuadraticBezierSegmentDef, QuadraticBezierSegmentDef] {
    const mid1: Point = new Point(
      p1.x + (c1.x - p1.x) * t,
      p1.y + (c1.y - p1.y) * t,
    );
    const mid2: Point = new Point(
      c1.x + (p2.x - c1.x) * t,
      c1.y + (p2.y - c1.y) * t,
    );
    const mid3: Point = new Point(
      mid1.x + (mid2.x - mid1.x) * t,
      mid1.y + (mid2.y - mid1.y) * t,
    );
    return [
      { p1, p2: mid3, c1: mid1 },
      { p1: mid3, p2, c1: mid2 },
    ];
  },
};

export const CubicBezier = {
  isFlat: function (
    p1: Point,
    p2: Point,
    c1: Point,
    c2: Point,
    tol: number,
  ): boolean {
    const flatnessThreshold = 16 * tol * tol;
    let ux = 3 * c1.x - 2 * p1.x - p2.x;
    ux *= ux;
    let uy = 3 * c1.y - 2 * p1.y - p2.y;
    uy *= uy;
    let vx = 3 * c2.x - 2 * p2.x - p1.x;
    vx *= vx;
    let vy = 3 * c2.y - 2 * p2.y - p1.y;
    vy *= vy;
    return Math.max(ux, vx) + Math.max(uy, vy) <= flatnessThreshold;
  },

  linearize: function (
    p1: Point,
    p2: Point,
    c1: Point,
    c2: Point,
    tol: number,
  ): Point[] {
    const finished: Point[] = [p1];
    const todo: CubicBezierSegmentDef[] = [{ p1, p2, c1, c2 }];
    while (todo.length > 0) {
      const segment = todo.shift()!;
      if (this.isFlat(segment.p1, segment.p2, segment.c1, segment.c2, tol)) {
        finished.push(new Point(segment.p2.x, segment.p2.y));
      } else {
        const divided = this.subdivide(
          segment.p1,
          segment.p2,
          segment.c1,
          segment.c2,
          0.5,
        );
        todo.unshift(divided[1]);
        todo.unshift(divided[0]);
      }
    }
    return finished;
  },

  subdivide: function (
    p1: Point,
    p2: Point,
    c1: Point,
    c2: Point,
    t: number,
  ): [CubicBezierSegmentDef, CubicBezierSegmentDef] {
    const t_p1 = p1,
      t_c1 = c1,
      t_c2 = c2,
      t_p2 = p2;
    const p1c1: Point = new Point(
      t_p1.x + (t_c1.x - t_p1.x) * t,
      t_p1.y + (t_c1.y - t_p1.y) * t,
    );
    const c1c2: Point = new Point(
      t_c1.x + (t_c2.x - t_c1.x) * t,
      t_c1.y + (t_c2.y - t_c1.y) * t,
    );
    const c2p2: Point = new Point(
      t_c2.x + (t_p2.x - t_c2.x) * t,
      t_c2.y + (t_p2.y - t_c2.y) * t,
    );
    const p1c1_c1c2: Point = new Point(
      p1c1.x + (c1c2.x - p1c1.x) * t,
      p1c1.y + (c1c2.y - p1c1.y) * t,
    );
    const c1c2_c2p2: Point = new Point(
      c1c2.x + (c2p2.x - c1c2.x) * t,
      c1c2.y + (c2p2.y - c1c2.y) * t,
    );
    const midPoint: Point = new Point(
      p1c1_c1c2.x + (c1c2_c2p2.x - p1c1_c1c2.x) * t,
      p1c1_c1c2.y + (c1c2_c2p2.y - p1c1_c1c2.y) * t,
    );
    return [
      { p1: t_p1, c1: p1c1, c2: p1c1_c1c2, p2: midPoint },
      { p1: midPoint, c1: c1c2_c2p2, c2: c2p2, p2: t_p2 },
    ];
  },
};

export const Arc = {
  linearize: function (
    p1: Point,
    p2: Point,
    rx: number,
    ry: number,
    angle: number,
    largearc: 0 | 1,
    sweep: 0 | 1,
    tol: number,
  ): Point[] {
    const finalPoints: Point[] = [p1];
    if (_internalAlmostEqualPoints(p1, p2)) return finalPoints;

    const initialArcParams = this.svgToCenter(
      p1,
      p2,
      rx,
      ry,
      angle,
      largearc,
      sweep,
    );
    if (rx <= TOL || ry <= TOL) {
      finalPoints.push(p2);
      return finalPoints;
    }

    const processingQueue: ArcCenterParams[] = [initialArcParams];
    while (processingQueue.length > 0) {
      const arcParams = processingQueue.shift()!;
      const arcSegment = this.centerToSvg(
        arcParams.center,
        arcParams.rx,
        arcParams.ry,
        arcParams.theta,
        arcParams.extent,
        arcParams.angle,
      );
      const midPointOnArc = this.centerToSvg(
        arcParams.center,
        arcParams.rx,
        arcParams.ry,
        arcParams.theta,
        0.5 * arcParams.extent,
        arcParams.angle,
      ).p2;
      const midPointOnChord: Point = new Point(
        0.5 * (arcSegment.p1.x + arcSegment.p2.x),
        0.5 * (arcSegment.p1.y + arcSegment.p2.y),
      );

      if (withinDistance(midPointOnChord, midPointOnArc, tol)) {
        finalPoints.push(arcSegment.p2);
      } else {
        const arc1Params: ArcCenterParams = {
          ...arcParams,
          extent: 0.5 * arcParams.extent,
        };
        const arc2Params: ArcCenterParams = {
          ...arcParams,
          theta: arcParams.theta + 0.5 * arcParams.extent,
          extent: 0.5 * arcParams.extent,
        };
        processingQueue.unshift(arc2Params);
        processingQueue.unshift(arc1Params);
      }
    }
    return finalPoints;
  },

  centerToSvg: function (
    center: Point,
    rx: number,
    ry: number,
    theta1Deg: number,
    extentDeg: number,
    angleDeg: number,
  ): ArcSvgParams {
    const theta2Deg = theta1Deg + extentDeg;
    const theta1Rad = _degreesToRadians(theta1Deg);
    const theta2Rad = _degreesToRadians(theta2Deg);
    const angleRad = _degreesToRadians(angleDeg);
    const cosAngle = Math.cos(angleRad),
      sinAngle = Math.sin(angleRad);
    const t1cos = Math.cos(theta1Rad),
      t1sin = Math.sin(theta1Rad);
    const t2cos = Math.cos(theta2Rad),
      t2sin = Math.sin(theta2Rad);
    const x0 = center.x + cosAngle * rx * t1cos - sinAngle * ry * t1sin;
    const y0 = center.y + sinAngle * rx * t1cos + cosAngle * ry * t1sin;
    const x1 = center.x + cosAngle * rx * t2cos - sinAngle * ry * t2sin;
    const y1 = center.y + sinAngle * rx * t2cos + cosAngle * ry * t2sin;
    const largearc: 0 | 1 = Math.abs(extentDeg) > 180 ? 1 : 0;
    const sweepFlag: 0 | 1 = extentDeg >= 0 ? 1 : 0;
    return {
      p1: new Point(x0, y0),
      p2: new Point(x1, y1),
      rx,
      ry,
      angle: angleDeg,
      largearc,
      sweep: sweepFlag,
    };
  },

  svgToCenter: function (
    p1: Point,
    p2: Point,
    rx_in: number,
    ry_in: number,
    angleDegrees: number,
    largearc: 0 | 1,
    sweep: 0 | 1,
  ): ArcCenterParams {
    let rx = Math.abs(rx_in);
    let ry = Math.abs(ry_in);
    const angleRad = _degreesToRadians(angleDegrees % 360);
    const cosPhi = Math.cos(angleRad),
      sinPhi = Math.sin(angleRad);
    const dx2 = (p1.x - p2.x) / 2,
      dy2 = (p1.y - p2.y) / 2;
    const x1p = cosPhi * dx2 + sinPhi * dy2;
    const y1p = -sinPhi * dx2 + cosPhi * dy2;
    const x1p_sq = x1p * x1p,
      y1p_sq = y1p * y1p;
    let rx_sq = rx * rx,
      ry_sq = ry * ry;
    const radiiCheck = x1p_sq / rx_sq + y1p_sq / ry_sq;
    if (radiiCheck > 1) {
      const sqrtRadiiCheck = Math.sqrt(radiiCheck);
      rx *= sqrtRadiiCheck;
      ry *= sqrtRadiiCheck;
      rx_sq = rx * rx;
      ry_sq = ry * ry;
    }
    const sign = largearc === sweep ? -1 : 1;
    let num = rx_sq * ry_sq - rx_sq * y1p_sq - ry_sq * x1p_sq;
    if (num < 0) num = 0;
    let den = rx_sq * y1p_sq + ry_sq * x1p_sq;
    if (den === 0) den = TOL;
    const c_prime_scale = sign * Math.sqrt(num / den);
    const cxp = c_prime_scale * ((rx * y1p) / ry);
    const cyp = c_prime_scale * -((ry * x1p) / rx);
    const cx = cosPhi * cxp - sinPhi * cyp + (p1.x + p2.x) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (p1.y + p2.y) / 2;
    const vecAngle = (
      ux: number,
      uy: number,
      vx: number,
      vy: number,
    ): number => {
      const dot = ux * vx + uy * vy;
      const lenSq1 = ux * ux + uy * uy,
        lenSq2 = vx * vx + vy * vy;
      let angRad = Math.acos(
        Math.max(-1, Math.min(1, dot / Math.sqrt(lenSq1 * lenSq2))),
      );
      if (ux * vy - uy * vx < 0) angRad = -angRad;
      return angRad;
    };
    const theta1Rad = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let deltaThetaRad = vecAngle(
      (x1p - cxp) / rx,
      (y1p - cyp) / ry,
      (-x1p - cxp) / rx,
      (-y1p - cyp) / ry,
    );
    if (sweep === 0 && deltaThetaRad > 0) deltaThetaRad -= 2 * Math.PI;
    else if (sweep === 1 && deltaThetaRad < 0) deltaThetaRad += 2 * Math.PI;
    deltaThetaRad %= 2 * Math.PI;
    return {
      center: new Point(cx, cy),
      rx,
      ry,
      theta: _radiansToDegrees(theta1Rad),
      extent: _radiansToDegrees(deltaThetaRad),
      angle: angleDegrees,
    };
  },
};

export function getPolygonBounds(polygon: Polygon): Bounds | null {
  if (!polygon || polygon.length === 0) return null;
  let xmin = polygon[0].x,
    xmax = polygon[0].x;
  let ymin = polygon[0].y,
    ymax = polygon[0].y;
  for (let i = 1; i < polygon.length; i++) {
    const p = polygon[i];
    if (p.x < xmin) xmin = p.x;
    else if (p.x > xmax) xmax = p.x;
    if (p.y < ymin) ymin = p.y;
    else if (p.y > ymax) ymax = p.y;
  }
  return { x: xmin, y: ymin, width: xmax - xmin, height: ymax - ymin };
}

export function pointInPolygon(
  point: Point,
  polygonPath: Polygon,
  tolerance: number = TOL,
): boolean | null {
  const poly = polygonPath;
  if (!poly || poly.length < 3) return null;
  const offsetx = polygonPath.offsetx || 0;
  const offsety = polygonPath.offsety || 0;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = new Point(poly[i].x + offsetx, poly[i].y + offsety);
    const pj = new Point(poly[j].x + offsetx, poly[j].y + offsety);
    if (_internalAlmostEqualPoints(point, pi, tolerance)) return null;
    if (_onSegment(pi, pj, point, tolerance)) return null;
    if (
      _internalAlmostEqual(pi.x, pj.x, tolerance) &&
      _internalAlmostEqual(pi.y, pj.y, tolerance)
    )
      continue;
    if (
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export function polygonArea(polygon: Polygon): number {
  let area = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
  }
  return 0.5 * area;
}

export function intersect(
  polyA_path: Polygon,
  polyB_path: Polygon,
): boolean {
  const Aoffsetx = polyA_path.offsetx || 0;
  const Aoffsety = polyA_path.offsety || 0;
  const Boffsetx = polyB_path.offsetx || 0;
  const Boffsety = polyB_path.offsety || 0;
  const A_pts = polyA_path;
  const B_pts = polyB_path;
  if (A_pts.length < 1 || B_pts.length < 1) return false;

  for (let i = 0; i < A_pts.length; i++) {
    const a1 = new Point(A_pts[i].x + Aoffsetx, A_pts[i].y + Aoffsety);
    const a2 = _getSafePolygonPoint(A_pts, i + 1, Aoffsetx, Aoffsety);
    if (_internalAlmostEqualPoints(a1, a2, TOL)) continue;

    for (let j = 0; j < B_pts.length; j++) {
      const b1 = new Point(B_pts[j].x + Boffsetx, B_pts[j].y + Boffsety);
      const b2 = _getSafePolygonPoint(B_pts, j + 1, Boffsetx, Boffsety);
      if (_internalAlmostEqualPoints(b1, b2, TOL)) continue;

      if (_internalLineIntersect(a1, a2, b1, b2, false) !== null) return true;

      const a0 = _getSafePolygonPoint(A_pts, i - 1, Aoffsetx, Aoffsety);
      const a_next_next = _getSafePolygonPoint(
        A_pts,
        i + 2,
        Aoffsetx,
        Aoffsety,
      );
      const b0 = _getSafePolygonPoint(B_pts, j - 1, Boffsetx, Boffsety);
      const b_next_next = _getSafePolygonPoint(
        B_pts,
        j + 2,
        Boffsetx,
        Boffsety,
      );

      if (
        _onSegment(a1, a2, b1, TOL) ||
        _internalAlmostEqualPoints(a1, b1, TOL)
      ) {
        const b0_in_A = pointInPolygon(b0, polyA_path, TOL);
        const b2_in_A = pointInPolygon(b2, polyA_path, TOL);
        if (
          (b0_in_A === true && b2_in_A === false) ||
          (b0_in_A === false && b2_in_A === true)
        )
          return true;
      }
      if (
        _onSegment(a1, a2, b2, TOL) ||
        _internalAlmostEqualPoints(a2, b2, TOL)
      ) {
        const b1_in_A = pointInPolygon(b1, polyA_path, TOL);
        const b_next_next_in_A = pointInPolygon(b_next_next, polyA_path, TOL);
        if (
          (b1_in_A === true && b_next_next_in_A === false) ||
          (b1_in_A === false && b_next_next_in_A === true)
        )
          return true;
      }
      if (
        _onSegment(b1, b2, a1, TOL) ||
        _internalAlmostEqualPoints(b1, a1, TOL)
      ) {
        const a0_in_B = pointInPolygon(a0, polyB_path, TOL);
        const a2_in_B = pointInPolygon(a2, polyB_path, TOL);
        if (
          (a0_in_B === true && a2_in_B === false) ||
          (a0_in_B === false && a2_in_B === true)
        )
          return true;
      }
      if (
        _onSegment(b1, b2, a2, TOL) ||
        _internalAlmostEqualPoints(b2, a2, TOL)
      ) {
        const a1_in_B = pointInPolygon(a1, polyB_path, TOL);
        const a_next_next_in_B = pointInPolygon(a_next_next, polyB_path, TOL);
        if (
          (a1_in_B === true && a_next_next_in_B === false) ||
          (a1_in_B === false && a_next_next_in_B === true)
        )
          return true;
      }
    }
  }
  const pA_in_B = pointInPolygon(
    new Point(A_pts[0].x + Aoffsetx, A_pts[0].y + Aoffsety),
    polyB_path,
    TOL,
  );
  if (pA_in_B === true) return true;
  const pB_in_A = pointInPolygon(
    new Point(B_pts[0].x + Boffsetx, B_pts[0].y + Boffsety),
    polyA_path,
    TOL,
  );
  if (pB_in_A === true) return true;
  return false;
}

export function polygonEdge(
  polygon: Polygon,
  normalVec: Point,
): Polygon | null {
  if (!polygon || polygon.length < 3) return null;
  const normal = _normalizeVector(normalVec);
  const direction = { x: -normal.y, y: normal.x };
  let minDot = Infinity,
    maxDot = -Infinity;
  const dotProducts: number[] = [];
  for (const p of polygon) {
    const dot = p.x * direction.x + p.y * direction.y;
    dotProducts.push(dot);
    if (dot < minDot) minDot = dot;
    if (dot > maxDot) maxDot = dot;
  }
  let indexMin = -1,
    indexMax = -1;
  let normalMin = -Infinity,
    normalMax = -Infinity;
  for (let i = 0; i < polygon.length; i++) {
    if (_internalAlmostEqual(dotProducts[i], minDot)) {
      const normalDot = polygon[i].x * normal.x + polygon[i].y * normal.y;
      if (normalDot > normalMin) {
        normalMin = normalDot;
        indexMin = i;
      }
    }
    if (_internalAlmostEqual(dotProducts[i], maxDot)) {
      const normalDot = polygon[i].x * normal.x + polygon[i].y * normal.y;
      if (normalDot > normalMax) {
        normalMax = normalDot;
        indexMax = i;
      }
    }
  }
  if (indexMin === -1 || indexMax === -1 || indexMin === indexMax) return null;

  const minVertex = polygon[indexMin];
  const prevVertex = polygon[(indexMin - 1 + polygon.length) % polygon.length];
  const nextVertex = polygon[(indexMin + 1) % polygon.length];
  const vecToPrev = {
    x: prevVertex.x - minVertex.x,
    y: prevVertex.y - minVertex.y,
  };
  const vecToNext = {
    x: nextVertex.x - minVertex.x,
    y: nextVertex.y - minVertex.y,
  };
  const dotPrev = vecToPrev.x * direction.x + vecToPrev.y * direction.y;
  const dotNext = vecToNext.x * direction.x + vecToNext.y * direction.y;
  let scanDirection = 0;
  if (_internalAlmostEqual(dotPrev, 0)) scanDirection = 1;
  else if (_internalAlmostEqual(dotNext, 0)) scanDirection = -1;
  else {
    const normalDotPrev = vecToPrev.x * normal.x + vecToPrev.y * normal.y;
    const normalDotNext = vecToNext.x * normal.x + vecToNext.y * normal.y;
    let scaledNormalDotPrev = normalDotPrev,
      scaledNormalDotNext = normalDotNext;
    if (!_internalAlmostEqual(dotPrev, dotNext)) {
      if (dotPrev < dotNext)
        scaledNormalDotNext = normalDotNext * (dotPrev / dotNext);
      else scaledNormalDotPrev = normalDotPrev * (dotNext / dotPrev);
    }
    scanDirection = scaledNormalDotPrev > scaledNormalDotNext ? -1 : 1;
  }
  const edge: Point[] = [];
  let currentIndex = indexMin,
    count = 0;
  const N = polygon.length;
  while (count < N) {
    edge.push(polygon[currentIndex]);
    if (currentIndex === indexMax) break;
    currentIndex = (currentIndex + scanDirection + N) % N;
    count++;
  }
  return edge.length > 0 ? edge : null;
}

export function pointLineDistance(
  p: Point,
  s1: Point,
  s2: Point,
  normalVec: Point,
  s1inclusive: boolean = false,
  s2inclusive: boolean = false,
): number | null {
  const normal = _normalizeVector(normalVec);
  const dir = { x: normal.y, y: -normal.x };
  const p_dot_dir = p.x * dir.x + p.y * dir.y;
  const s1_dot_dir = s1.x * dir.x + s1.y * dir.y;
  const s2_dot_dir = s2.x * dir.x + s2.y * dir.y;
  const p_dot_norm = p.x * normal.x + p.y * normal.y;
  const s1_dot_norm = s1.x * normal.x + s1.y * normal.y;
  const s2_dot_norm = s2.x * normal.x + s2.y * normal.y;
  const min_s_dot_dir = Math.min(s1_dot_dir, s2_dot_dir);
  const max_s_dot_dir = Math.max(s1_dot_dir, s2_dot_dir);

  if (p_dot_dir < min_s_dot_dir - TOL && !s1inclusive && !s2inclusive)
    return null;
  if (p_dot_dir > max_s_dot_dir + TOL && !s1inclusive && !s2inclusive)
    return null;
  if (_internalAlmostEqual(p_dot_dir, s1_dot_dir)) {
    if (s1inclusive) return p_dot_norm - s1_dot_norm;
    if (!(p_dot_dir > min_s_dot_dir - TOL && p_dot_dir < max_s_dot_dir + TOL))
      return null;
  }
  if (_internalAlmostEqual(p_dot_dir, s2_dot_dir)) {
    if (s2inclusive) return p_dot_norm - s2_dot_norm;
    if (!(p_dot_dir > min_s_dot_dir - TOL && p_dot_dir < max_s_dot_dir + TOL))
      return null;
  }
  if (
    !s1inclusive &&
    p_dot_dir < min_s_dot_dir + TOL &&
    !_internalAlmostEqual(p_dot_dir, min_s_dot_dir)
  )
    return null;
  if (
    !s2inclusive &&
    p_dot_dir > max_s_dot_dir - TOL &&
    !_internalAlmostEqual(p_dot_dir, max_s_dot_dir)
  )
    return null;

  if (_internalAlmostEqual(s1_dot_dir, s2_dot_dir)) {
    if (
      p_dot_norm >= Math.min(s1_dot_norm, s2_dot_norm) - TOL &&
      p_dot_norm <= Math.max(s1_dot_norm, s2_dot_norm) + TOL
    ) {
      return p_dot_norm - s1_dot_norm;
    }
    return null;
  }
  return (
    p_dot_norm -
    s1_dot_norm -
    ((s2_dot_norm - s1_dot_norm) * (p_dot_dir - s1_dot_dir)) /
      (s2_dot_dir - s1_dot_dir)
  );
}

export function pointDistance(
  p: Point,
  s1: Point,
  s2: Point,
  normalVec: Point,
  infinite?: boolean,
): number | null {
  const normal = _normalizeVector(normalVec);
  const dir = { x: normal.y, y: -normal.x };
  const p_dot_dir = p.x * dir.x + p.y * dir.y;
  const s1_dot_dir = s1.x * dir.x + s1.y * dir.y;
  const s2_dot_dir = s2.x * dir.x + s2.y * dir.y;
  const p_dot_norm = p.x * normal.x + p.y * normal.y;
  const s1_dot_norm = s1.x * normal.x + s1.y * normal.y;
  const s2_dot_norm = s2.x * normal.x + s2.y * normal.y;

  if (!infinite) {
    const min_s_dot_dir = Math.min(s1_dot_dir, s2_dot_dir);
    const max_s_dot_dir = Math.max(s1_dot_dir, s2_dot_dir);
    if (p_dot_dir < min_s_dot_dir - TOL || p_dot_dir > max_s_dot_dir + TOL) {
      if (
        _internalAlmostEqual(p_dot_dir, s1_dot_dir) &&
        _internalAlmostEqual(p_dot_dir, s2_dot_dir)
      ) {
        if (p_dot_norm > s1_dot_norm && p_dot_norm > s2_dot_norm)
          return Math.min(p_dot_norm - s1_dot_norm, p_dot_norm - s2_dot_norm);
        if (p_dot_norm < s1_dot_norm && p_dot_norm < s2_dot_norm)
          return -Math.min(s1_dot_norm - p_dot_norm, s2_dot_norm - p_dot_norm);
      }
      return null;
    }
  }
  if (_internalAlmostEqual(s1_dot_dir, s2_dot_dir, TOL)) {
    return -(p_dot_norm - s1_dot_norm);
  }
  const projected_p_on_line_norm =
    s1_dot_norm +
    ((s2_dot_norm - s1_dot_norm) * (p_dot_dir - s1_dot_dir)) /
      (s2_dot_dir - s1_dot_dir);
  return -(p_dot_norm - projected_p_on_line_norm);
}

export function segmentDistance(
  A: Point,
  B: Point,
  E: Point,
  F: Point,
  directionVec: Point,
): number | null {
  const normal = _normalizeVector(new Point(directionVec.y, -directionVec.x));
  const direction = _normalizeVector(directionVec);
  const reverseDirection = new Point(-direction.x, -direction.y);

  const dotA_normal = A.x * normal.x + A.y * normal.y;
  const dotB_normal = B.x * normal.x + B.y * normal.y;
  const dotE_normal = E.x * normal.x + E.y * normal.y;
  const dotF_normal = F.x * normal.x + F.y * normal.y;

  const AB_normal_min = Math.min(dotA_normal, dotB_normal);
  const AB_normal_max = Math.max(dotA_normal, dotB_normal);
  const EF_normal_min = Math.min(dotE_normal, dotF_normal);
  const EF_normal_max = Math.max(dotE_normal, dotF_normal);

  if (
    AB_normal_max < EF_normal_min + TOL ||
    AB_normal_min > EF_normal_max - TOL
  )
    return null;

  const crossABE = (E.y - A.y) * (B.x - A.x) - (E.x - A.x) * (B.y - A.y);
  const crossABF = (F.y - A.y) * (B.x - A.x) - (F.x - A.x) * (B.y - A.y);

  if (_internalAlmostEqual(crossABE, 0) && _internalAlmostEqual(crossABF, 0)) {
    const AB_line_normal = _normalizeVector(new Point(B.y - A.y, A.x - B.x));
    const norm_dot_dir =
      AB_line_normal.x * direction.x + AB_line_normal.y * direction.y;
    if (norm_dot_dir > TOL) {
      const crossA_dir = A.x * direction.x + A.y * direction.y;
      const crossB_dir = B.x * direction.x + B.y * direction.y;
      const crossE_dir = E.x * direction.x + E.y * direction.y;
      const crossF_dir = F.x * direction.x + F.y * direction.y;
      const dist_AE = crossE_dir - crossA_dir,
        dist_AF = crossF_dir - crossA_dir;
      const dist_BE = crossE_dir - crossB_dir,
        dist_BF = crossF_dir - crossB_dir;
      let minPositiveDist: number | null = null;
      [dist_AE, dist_AF, dist_BE, dist_BF].forEach((d) => {
        if (d > -TOL) {
          if (minPositiveDist === null || d < minPositiveDist)
            minPositiveDist = d;
        }
      });
      return minPositiveDist;
    }
    return null;
  }

  const distances: number[] = [];
  let d: number | null;
  d = pointDistance(A, E, F, reverseDirection, false);
  if (d !== null && d > -TOL) distances.push(d);
  d = pointDistance(B, E, F, reverseDirection, false);
  if (d !== null && d > -TOL) distances.push(d);
  d = pointDistance(E, A, B, direction, false);
  if (d !== null && d > -TOL) distances.push(d);
  d = pointDistance(F, A, B, direction, false);
  if (d !== null && d > -TOL) distances.push(d);

  if (distances.length === 0) return null;
  return Math.min(...distances);
}

export function polygonSlideDistance(
  polyA_path: Polygon,
  polyB_path: Polygon,
  direction: Point,
  ignoreNegative: boolean = false,
): number | null {
  const Aoffsetx = polyA_path.offsetx || 0,
    Aoffsety = polyA_path.offsety || 0;
  const Boffsetx = polyB_path.offsetx || 0,
    Boffsety = polyB_path.offsety || 0;
  const A_pts = polyA_path.slice(),
    B_pts = polyB_path.slice();
  if (
    A_pts.length > 0 &&
    !_internalAlmostEqualPoints(A_pts[0], A_pts[A_pts.length - 1])
  )
    A_pts.push(A_pts[0]);
  if (
    B_pts.length > 0 &&
    !_internalAlmostEqualPoints(B_pts[0], B_pts[B_pts.length - 1])
  )
    B_pts.push(B_pts[0]);
  if (A_pts.length < 2 || B_pts.length < 2) return null;
  let minDistance: number | null = null;
  for (let i = 0; i < A_pts.length - 1; i++) {
    const A1 = new Point(A_pts[i].x + Aoffsetx, A_pts[i].y + Aoffsety);
    const A2 = new Point(A_pts[i + 1].x + Aoffsetx, A_pts[i + 1].y + Aoffsety);
    if (_internalAlmostEqualPoints(A1, A2, TOL)) continue;
    for (let j = 0; j < B_pts.length - 1; j++) {
      const B1 = new Point(B_pts[j].x + Boffsetx, B_pts[j].y + Boffsety);
      const B2 = new Point(
        B_pts[j + 1].x + Boffsetx,
        B_pts[j + 1].y + Boffsety,
      );
      if (_internalAlmostEqualPoints(B1, B2, TOL)) continue;
      const d = segmentDistance(A1, A2, B1, B2, direction);
      if (d !== null) {
        if (!ignoreNegative || d >= -TOL) {
          if (minDistance === null || d < minDistance) minDistance = d;
        }
      }
    }
  }
  return minDistance;
}

export function polygonProjectionDistance(
  polyA_path: Polygon,
  polyB_path: Polygon,
  direction: Point,
): number | null {
  const Aoffsetx = polyA_path.offsetx || 0,
    Aoffsety = polyA_path.offsety || 0;
  const Boffsetx = polyB_path.offsetx || 0,
    Boffsety = polyB_path.offsety || 0;
  const A_pts = polyA_path.slice(),
    B_pts = polyB_path.slice();
  if (
    A_pts.length > 0 &&
    !_internalAlmostEqualPoints(A_pts[0], A_pts[A_pts.length - 1])
  )
    A_pts.push(A_pts[0]);
  if (A_pts.length < 2 || B_pts.length < 1) return null;
  let overallMaxMinProjection: number | null = null;
  for (const pB_orig of B_pts) {
    const pB = new Point(pB_orig.x + Boffsetx, pB_orig.y + Boffsety);
    let minProjectionForCurrent_pB: number | null = null;
    for (let i = 0; i < A_pts.length - 1; i++) {
      const sA1 = new Point(A_pts[i].x + Aoffsetx, A_pts[i].y + Aoffsety);
      const sA2 = new Point(
        A_pts[i + 1].x + Aoffsetx,
        A_pts[i + 1].y + Aoffsety,
      );
      if (_internalAlmostEqualPoints(sA1, sA2, TOL)) continue;
      const segDir_x = sA2.x - sA1.x,
        segDir_y = sA2.y - sA1.y;
      if (Math.abs(segDir_y * direction.x - segDir_x * direction.y) < TOL)
        continue;
      const d = pointDistance(pB, sA1, sA2, direction, true);
      if (d !== null) {
        if (
          minProjectionForCurrent_pB === null ||
          d < minProjectionForCurrent_pB
        )
          minProjectionForCurrent_pB = d;
      }
    }
    if (minProjectionForCurrent_pB !== null) {
      if (
        overallMaxMinProjection === null ||
        minProjectionForCurrent_pB > overallMaxMinProjection
      )
        overallMaxMinProjection = minProjectionForCurrent_pB;
    }
  }
  return overallMaxMinProjection;
}

export function searchStartPoint(
  polyA_path: Polygon,
  polyB_path_orig: Polygon,
  inside: boolean,
  NFP?: Polygon[],
): Point | null {
  const polyA_pts = polyA_path.slice();
  const polyB_pts_orig_copy = polyB_path_orig.slice(); // Ensure we use a copy for B's vertices
  if (
    polyA_pts.length > 0 &&
    !_internalAlmostEqualPoints(polyA_pts[0], polyA_pts[polyA_pts.length - 1])
  )
    polyA_pts.push(polyA_pts[0]);
  if (polyA_pts.length < 3 || polyB_pts_orig_copy.length < 1) return null;

  for (let i = 0; i < polyA_pts.length - 1; i++) {
    const pA_i = polyA_pts[i];
    if (!pA_i.marked) {
      pA_i.marked = true;
      for (let j = 0; j < polyB_pts_orig_copy.length; j++) {
        const pB_j = polyB_pts_orig_copy[j];
        const currentPolyBWithPath: Polygon = [...polyB_pts_orig_copy];
        currentPolyBWithPath.offsetx = pA_i.x - pB_j.x;
        currentPolyBWithPath.offsety = pA_i.y - pB_j.y;
        let B_is_inside_A: boolean | null = null;
        for (let k = 0; k < currentPolyBWithPath.length; ++k) {
          const pB_k_transformed = new Point(
            currentPolyBWithPath[k].x + currentPolyBWithPath.offsetx!,
            currentPolyBWithPath[k].y + currentPolyBWithPath.offsety!,
          );
          const inPolyCheck = pointInPolygon(pB_k_transformed, polyA_path, TOL);
          if (inPolyCheck !== null) {
            B_is_inside_A = inPolyCheck;
            break;
          }
        }
        if (B_is_inside_A === null) continue;
        const startPointCandidate = new Point(
          currentPolyBWithPath.offsetx!,
          currentPolyBWithPath.offsety!,
        );
        if (
          ((B_is_inside_A && inside) || (!B_is_inside_A && !inside)) &&
          !intersect(polyA_path, currentPolyBWithPath) &&
          !_inNfp(startPointCandidate, NFP)
        ) {
          return startPointCandidate;
        }

        const pA_i_plus_1 = polyA_pts[i + 1];
        // should new Point be a vector?
        const slideVector = new Point(
          pA_i_plus_1.x - pA_i.x,
          pA_i_plus_1.y - pA_i.y,
        );
        const slideVecLengthSq =
          slideVector.x * slideVector.x + slideVector.y * slideVector.y;
        if (slideVecLengthSq < TOL * TOL) continue;
        const d1 = polygonProjectionDistance(
          polyA_path,
          currentPolyBWithPath,
          slideVector,
        );
        // should be a vector?
        const d2 = polygonProjectionDistance(
          currentPolyBWithPath,
          polyA_path,
          new Point(-slideVector.x, -slideVector.y),
        );
        const slideAmount: number | null =
          d1 === null && d2 === null
            ? null
            : d1 === null
              ? d2
              : d2 === null
                ? d1
                : Math.min(d1, d2);

        if (slideAmount !== null && slideAmount > TOL) {
          const slideVecLength = Math.sqrt(slideVecLengthSq);
          const scaleFactor = slideAmount / slideVecLength; // Corrected: slide by 'slideAmount' along vector
          const translateX = slideVector.x * scaleFactor;
          const translateY = slideVector.y * scaleFactor;
          currentPolyBWithPath.offsetx! += translateX;
          currentPolyBWithPath.offsety! += translateY;
          B_is_inside_A = null;
          for (let k = 0; k < currentPolyBWithPath.length; ++k) {
            const pB_k_transformed = new Point(
              currentPolyBWithPath[k].x + currentPolyBWithPath.offsetx!,
              currentPolyBWithPath[k].y + currentPolyBWithPath.offsety!,
            );
            const inPolyCheck = pointInPolygon(
              pB_k_transformed,
              polyA_path,
              TOL,
            );
            if (inPolyCheck !== null) {
              B_is_inside_A = inPolyCheck;
              break;
            }
          }
          if (B_is_inside_A === null) continue;
          const slidPointCandidate = new Point(
            currentPolyBWithPath.offsetx!,
            currentPolyBWithPath.offsety!,
          );
          if (
            ((B_is_inside_A && inside) || (!B_is_inside_A && !inside)) &&
            !intersect(polyA_path, currentPolyBWithPath) &&
            !_inNfp(slidPointCandidate, NFP)
          ) {
            return slidPointCandidate;
          }
        }
      }
    }
  }
  return null;
}

export function noFitPolygonRectangle(
  rectA_path: Polygon,
  polyB_path: Polygon,
): Polygon[] | null {
  const boundsA = getPolygonBounds(rectA_path);
  const boundsB = getPolygonBounds(polyB_path);
  if (!boundsA || !boundsB || polyB_path.length === 0) return null;
  if (boundsB.width > boundsA.width || boundsB.height > boundsA.height)
    return null;
  const nfp_xmin = boundsA.x - boundsB.x + polyB_path[0].x;
  const nfp_ymin = boundsA.y - boundsB.y + polyB_path[0].y;
  const nfp_xmax =
    boundsA.x + boundsA.width - (boundsB.x + boundsB.width) + polyB_path[0].x;
  const nfp_ymax =
    boundsA.y + boundsA.height - (boundsB.y + boundsB.height) + polyB_path[0].y;
  return [
    [
      new Point(nfp_xmin, nfp_ymin),
      new Point(nfp_xmax, nfp_ymin),
      new Point(nfp_xmax, nfp_ymax),
      new Point(nfp_xmin, nfp_ymax),
    ],
  ];
}

export function noFitPolygon(
  polyA_path: Polygon,
  polyB_path_orig: Polygon,
  inside: boolean,
  searchEdges: boolean,
): Polygon[] | null {
  if (
    !polyA_path ||
    polyA_path.length < 3 ||
    !polyB_path_orig ||
    polyB_path_orig.length < 3
  )
    return null;
  const A_pts_orig = polyA_path.slice() as Polygon;
  const B_pts_orig_copy = polyB_path_orig.slice() as Polygon; // Use a copy for B operations
  A_pts_orig.forEach((p) => (p.marked = false));
  B_pts_orig_copy.forEach((p) => (p.marked = false)); // Mark on B's copy if needed, though original marks A
  A_pts_orig.offsetx = 0;
  A_pts_orig.offsety = 0;
  let startPoint: Point | null;
  if (!inside) {
    let minA_y = Infinity,
      minA_idx = -1,
      maxB_y = -Infinity,
      maxB_idx = -1;
    A_pts_orig.forEach((p, i) => {
      if (p.y < minA_y) {
        minA_y = p.y;
        minA_idx = i;
      }
    });
    B_pts_orig_copy.forEach((p, i) => {
      if (p.y > maxB_y) {
        maxB_y = p.y;
        maxB_idx = i;
      }
    });
    if (minA_idx === -1 || maxB_idx === -1) return null;
    startPoint = new Point(
      A_pts_orig[minA_idx].x - B_pts_orig_copy[maxB_idx].x,
      A_pts_orig[minA_idx].y - B_pts_orig_copy[maxB_idx].y,
    );
  } else {
    startPoint = searchStartPoint(A_pts_orig, B_pts_orig_copy, true);
  }
  const NFPlist: Polygon[] = [];
  while (startPoint !== null) {
    const currentPolyBWithPath = B_pts_orig_copy.slice() as Polygon; // Fresh copy for this NFP attempt
    currentPolyBWithPath.offsetx = startPoint.x;
    currentPolyBWithPath.offsety = startPoint.y;
    const nfpCurrent: Point[] = [
      new Point(
        currentPolyBWithPath[0].x + currentPolyBWithPath.offsetx!,
        currentPolyBWithPath[0].y + currentPolyBWithPath.offsety!,
      ),
    ];
    const NFP_start_x = nfpCurrent[0].x,
      NFP_start_y = nfpCurrent[0].y;
    let prevVector: Point | null = null;
    let loopCounter = 0;
    const maxLoop = 10 * (A_pts_orig.length + currentPolyBWithPath.length);
    while (loopCounter < maxLoop) {
      loopCounter++;
      const touching: TouchingInfo[] = [];
      for (let i = 0; i < A_pts_orig.length; i++) {
        const pA_i = _getSafePolygonPoint(
          A_pts_orig,
          i,
          A_pts_orig.offsetx,
          A_pts_orig.offsety,
        );
        const pA_next_i = _getSafePolygonPoint(
          A_pts_orig,
          i + 1,
          A_pts_orig.offsetx,
          A_pts_orig.offsety,
        );
        for (let j = 0; j < currentPolyBWithPath.length; j++) {
          const pB_j = _getSafePolygonPoint(
            currentPolyBWithPath,
            j,
            currentPolyBWithPath.offsetx,
            currentPolyBWithPath.offsety,
          );
          const pB_next_j = _getSafePolygonPoint(
            currentPolyBWithPath,
            j + 1,
            currentPolyBWithPath.offsetx,
            currentPolyBWithPath.offsety,
          );
          if (_internalAlmostEqualPoints(pA_i, pB_j, TOL))
            touching.push({ type: 0, A: i, B: j });
          else if (_onSegment(pA_i, pA_next_i, pB_j, TOL))
            touching.push({ type: 1, A: (i + 1) % A_pts_orig.length, B: j });
          else if (_onSegment(pB_j, pB_next_j, pA_i, TOL))
            touching.push({
              type: 2,
              A: i,
              B: (j + 1) % currentPolyBWithPath.length,
            });
        }
      }
      const vectors: VectorWithPathInfo[] = [];
      for (const touch of touching) {
        const vertexA_orig = A_pts_orig[touch.A];
        vertexA_orig.marked = true;
        const prevA_orig =
          A_pts_orig[(touch.A - 1 + A_pts_orig.length) % A_pts_orig.length];
        const nextA_orig = A_pts_orig[(touch.A + 1) % A_pts_orig.length];
        const vertexB_orig = currentPolyBWithPath[touch.B];
        const prevB_orig =
          currentPolyBWithPath[
            (touch.B - 1 + currentPolyBWithPath.length) %
              currentPolyBWithPath.length
          ];
        const nextB_orig =
          currentPolyBWithPath[(touch.B + 1) % currentPolyBWithPath.length];
        if (touch.type === 0) {
          vectors.push(
            Object.assign(
              new Point(
                prevA_orig.x - vertexA_orig.x,
                prevA_orig.y - vertexA_orig.y,
              ),
              { start: vertexA_orig, end: prevA_orig },
            ),
          );
          vectors.push(
            Object.assign(
              new Point(
                nextA_orig.x - vertexA_orig.x,
                nextA_orig.y - vertexA_orig.y,
              ),
              { start: vertexA_orig, end: nextA_orig },
            ),
          );
          vectors.push(
            Object.assign(
              new Point(
                vertexB_orig.x - prevB_orig.x,
                vertexB_orig.y - prevB_orig.y,
              ),
              { start: prevB_orig, end: vertexB_orig },
            ),
          );
          vectors.push(
            Object.assign(
              new Point(
                vertexB_orig.x - nextB_orig.x,
                vertexB_orig.y - nextB_orig.y,
              ),
              { start: nextB_orig, end: vertexB_orig },
            ),
          );
        } else if (touch.type === 1) {
          const segmentStartA =
            A_pts_orig[(touch.A - 1 + A_pts_orig.length) % A_pts_orig.length];
          const segmentEndA = vertexA_orig;
          vectors.push(
            Object.assign(
              new Point(
                segmentEndA.x -
                  (vertexB_orig.x + currentPolyBWithPath.offsetx!),
                segmentEndA.y -
                  (vertexB_orig.y + currentPolyBWithPath.offsety!),
              ),
              { start: segmentStartA, end: segmentEndA },
            ),
          );
          vectors.push(
            Object.assign(
              new Point(
                segmentStartA.x -
                  (vertexB_orig.x + currentPolyBWithPath.offsetx!),
                segmentStartA.y -
                  (vertexB_orig.y + currentPolyBWithPath.offsety!),
              ),
              { start: segmentEndA, end: segmentStartA },
            ),
          );
        } else if (touch.type === 2) {
          const segmentStartB =
            currentPolyBWithPath[
              (touch.B - 1 + currentPolyBWithPath.length) %
                currentPolyBWithPath.length
            ];
          const segmentEndB = vertexB_orig;
          vectors.push(
            Object.assign(
              new Point(
                vertexA_orig.x + (A_pts_orig.offsetx || 0) - segmentEndB.x,
                vertexA_orig.y + (A_pts_orig.offsety || 0) - segmentEndB.y,
              ),
              { start: segmentStartB, end: segmentEndB },
            ),
          );
          vectors.push(
            Object.assign(
              new Point(
                vertexA_orig.x + (A_pts_orig.offsetx || 0) - segmentStartB.x,
                vertexA_orig.y + (A_pts_orig.offsety || 0) - segmentStartB.y,
              ),
              { start: segmentEndB, end: segmentStartB },
            ),
          );
        }
      }
      let bestTranslate: VectorWithPathInfo | null = null;
      let maxSlideDist = 0;
      for (const v of vectors) {
        if (_internalAlmostEqual(v.x, 0) && _internalAlmostEqual(v.y, 0))
          continue;
        if (prevVector && v.x * prevVector.x + v.y * prevVector.y < -TOL) {
          const v_norm = _normalizeVector(v),
            prev_norm = _normalizeVector(prevVector);
          if (
            _internalAlmostEqual(v_norm.x, -prev_norm.x) &&
            _internalAlmostEqual(v_norm.y, -prev_norm.y)
          )
            continue;
        }
        const slideDist = polygonSlideDistance(
          A_pts_orig,
          currentPolyBWithPath,
          v,
          true,
        );
        if (slideDist !== null) {
          const v_len_sq = v.x * v.x + v.y * v.y;
          const actualEventDist =
            slideDist * slideDist > v_len_sq - TOL
              ? Math.sqrt(v_len_sq)
              : slideDist;
          if (actualEventDist > maxSlideDist) {
            maxSlideDist = actualEventDist;
            bestTranslate = v;
          }
        }
      }
      if (bestTranslate === null || _internalAlmostEqual(maxSlideDist, 0)) {
        console.warn("NFP: Stuck.");
        break;
      }
      bestTranslate.start.marked = true;
      bestTranslate.end.marked = true;
      prevVector = new Point(bestTranslate.x, bestTranslate.y);
      const translateLength = Math.sqrt(
        bestTranslate.x ** 2 + bestTranslate.y ** 2,
      );
      let scaledTranslateX = bestTranslate.x,
        scaledTranslateY = bestTranslate.y;
      if (translateLength > TOL) {
        const scale = maxSlideDist / translateLength;
        scaledTranslateX *= scale;
        scaledTranslateY *= scale;
      } else {
        break;
      }
      const lastNFPPoint = nfpCurrent[nfpCurrent.length - 1];
      const nextNFP_x = lastNFPPoint.x + scaledTranslateX,
        nextNFP_y = lastNFPPoint.y + scaledTranslateY;
      if (
        _internalAlmostEqual(nextNFP_x, NFP_start_x) &&
        _internalAlmostEqual(nextNFP_y, NFP_start_y)
      )
        break;
      let prematureLoop = false;
      for (let k = 0; k < nfpCurrent.length - 1; ++k)
        if (
          _internalAlmostEqual(nextNFP_x, nfpCurrent[k].x) &&
          _internalAlmostEqual(nextNFP_y, nfpCurrent[k].y)
        ) {
          prematureLoop = true;
          break;
        }
      if (prematureLoop) {
        console.warn("NFP: Premature loop.");
        break;
      }
      nfpCurrent.push(new Point(nextNFP_x, nextNFP_y));
      currentPolyBWithPath.offsetx! += scaledTranslateX;
      currentPolyBWithPath.offsety! += scaledTranslateY;
    }
    if (
      nfpCurrent.length > 1 &&
      _internalAlmostEqualPoints(
        nfpCurrent[0],
        nfpCurrent[nfpCurrent.length - 1],
      )
    )
      nfpCurrent.pop();
    if (nfpCurrent.length > 2) NFPlist.push(nfpCurrent);
    if (!searchEdges) break;
    startPoint = searchStartPoint(A_pts_orig, B_pts_orig_copy, inside, NFPlist);
  }
  return NFPlist.length > 0 ? NFPlist : null;
}


export function polygonHull(
  polyA_path: Polygon,
  polyB_path: Polygon,
): Polygon | null {
  console.warn(
    "polygonHull not fully implemented. A robust general solution is non-trivial.",
  );
  if (!polyA_path || polyA_path.length < 3 || !polyB_path || polyB_path.length < 3) {
    return null;
  }

  let i, j;

  let Aoffsetx = polyA_path.offsetx || 0;
  let Aoffsety = polyA_path.offsety || 0;
  let Boffsetx = polyB_path.offsetx || 0;
  let Boffsety = polyB_path.offsety || 0;

  // start at an extreme point that is guaranteed to be on the final polygon
  let miny = polyA_path[0].y;
  let startPolygon = polyA_path;
  let startIndex = 0;

  for (i = 0; i < polyA_path.length; i++) {
    if (polyA_path[i].y + Aoffsety < miny) {
      miny = polyA_path[i].y + Aoffsety;
      startPolygon = polyA_path;
      startIndex = i;
    }
  }

  for (i = 0; i < polyB_path.length; i++) {
    if (polyB_path[i].y + Boffsety < miny) {
      miny = polyB_path[i].y + Boffsety;
      startPolygon = polyB_path;
      startIndex = i;
    }
  }

  // for simplicity we'll define polygon A as the starting polygon
  if (startPolygon == polyB_path) {
    polyB_path = polyA_path;
    polyA_path = startPolygon;
    Aoffsetx = polyA_path.offsetx || 0;
    Aoffsety = polyA_path.offsety || 0;
    Boffsetx = polyB_path.offsetx || 0;
    Boffsety = polyB_path.offsety || 0;
  }

  polyA_path = polyA_path.slice(0);
  polyB_path = polyB_path.slice(0);

  const C: Polygon= [];
  let current = startIndex;
  let intercept1 = null;
  let intercept2 = null;

  // scan forward from the starting point
  for (i = 0; i < polyA_path.length + 1; i++) {
    current = current == polyA_path.length ? 0 : current;
    const next = current == polyA_path.length - 1 ? 0 : current + 1;
    let touching = false;
    for (j = 0; j < polyB_path.length; j++) {
      const nextj = j == polyB_path.length - 1 ? 0 : j + 1;
      if (
        _internalAlmostEqual(polyA_path[current].x + Aoffsetx, polyB_path[j].x + Boffsetx) &&
        _internalAlmostEqual(polyA_path[current].y + Aoffsety, polyB_path[j].y + Boffsety)
      ) {
        C.push(new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety));
        intercept1 = j;
        touching = true;
        break;
      } else if (
        _onSegment(
          new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety),
          new Point(polyA_path[next].x + Aoffsetx, polyA_path[next].y + Aoffsety),
          new Point(polyB_path[j].x + Boffsetx, polyB_path[j].y + Boffsety),
        )
      ) {
        C.push(new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety));
        C.push(new Point(polyB_path[j].x + Boffsetx, polyB_path[j].y + Boffsety));
        intercept1 = j;
        touching = true;
        break;
      } else if (
        _onSegment(
          new Point(polyB_path[j].x + Boffsetx, polyB_path[j].y + Boffsety),
          new Point(polyB_path[nextj].x + Boffsetx, polyB_path[nextj].y + Boffsety),
          new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety),
        )
      ) {
        C.push(new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety));
        C.push(new Point(polyB_path[nextj].x + Boffsetx, polyB_path[nextj].y + Boffsety));
        intercept1 = nextj;
        touching = true;
        break;
      }
    }

    if (touching) {
      break;
    }

    C.push(new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety));

    current++;
  }

  // scan backward from the starting point
  current = startIndex - 1;
  for (i = 0; i < polyA_path.length + 1; i++) {
    current = current < 0 ? polyA_path.length - 1 : current;
    const next = current == 0 ? polyA_path.length - 1 : current - 1;
    let touching = false;
    for (j = 0; j < polyB_path.length; j++) {
      const nextj = j == polyB_path.length - 1 ? 0 : j + 1;
      if (
        _internalAlmostEqual(polyA_path[current].x + Aoffsetx, polyB_path[j].x + Boffsetx) &&
        _internalAlmostEqual(polyA_path[current].y, polyB_path[j].y + Boffsety)
      ) {
        C.unshift(new Point(
          polyA_path[current].x + Aoffsetx,
          polyA_path[current].y + Aoffsety,
        ));
        intercept2 = j;
        touching = true;
        break;
      } else if (
        _onSegment(
          new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety),
          new Point(polyA_path[next].x + Aoffsetx, polyA_path[next].y + Aoffsety),
          new Point(polyB_path[j].x + Boffsetx, polyB_path[j].y + Boffsety),
        )
      ) {
        C.unshift(new Point(
          polyA_path[current].x + Aoffsetx,
          polyA_path[current].y + Aoffsety,
        ));
        C.unshift(new Point(polyB_path[j].x + Boffsetx, polyB_path[j].y + Boffsety));
        intercept2 = j;
        touching = true;
        break;
      } else if (
        _onSegment(
          new Point(polyB_path[j].x + Boffsetx, polyB_path[j].y + Boffsety),
          new Point(polyB_path[nextj].x + Boffsetx, polyB_path[nextj].y + Boffsety),
          new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety),
        )
      ) {
        C.unshift(new Point(
          polyA_path[current].x + Aoffsetx,
          polyA_path[current].y + Aoffsety,
        ));
        intercept2 = j;
        touching = true;
        break;
      }
    }

    if (touching) {
      break;
    }

    C.unshift(new Point(polyA_path[current].x + Aoffsetx, polyA_path[current].y + Aoffsety));

    current--;
  }

  if (intercept1 === null || intercept2 === null) {
    // polygons not touching?
    return null;
  }

  // the relevant points on B now lie between intercept1 and intercept2
  current = intercept1 + 1;
  for (i = 0; i < polyB_path.length; i++) {
    current = current == polyB_path.length ? 0 : current;
    C.push(new Point(polyB_path[current].x + Boffsetx, polyB_path[current].y + Boffsety));

    if (current == intercept2) {
      break;
    }

    current++;
  }

  // dedupe
  for (i = 0; i < C.length; i++) {
    const next = i == C.length - 1 ? 0 : i + 1;
    if (_internalAlmostEqual(C[i].x, C[next].x) && _internalAlmostEqual(C[i].y, C[next].y)) {
      C.splice(i, 1);
      i--;
    }
  }

  return C;
}

export function rotatePolygon(
  polygon: Polygon,
  angleDeg: number,
): Polygon {
  const rotated: Point[] = [];
  const angleRad = _degreesToRadians(angleDeg);
  const cosA = Math.cos(angleRad),
    sinA = Math.sin(angleRad);
  for (const p_orig of polygon) {
    const p = new Point(p_orig.x, p_orig.y);
    const rotatedPoint = new Point(
      p.x * cosA - p.y * sinA,
      p.x * sinA + p.y * cosA,
    );
    if (typeof p_orig.marked !== "undefined") {
      rotatedPoint.marked = p_orig.marked;
    }
    rotated.push(rotatedPoint);
  }
  const resultAsPath: Polygon = rotated;
  const bounds = getPolygonBounds(rotated);
  if (bounds) {
    resultAsPath.x = bounds.x;
    resultAsPath.y = bounds.y;
    resultAsPath.width = bounds.width;
    resultAsPath.height = bounds.height;
  }
  return resultAsPath;
}

export function isRectangle(poly: Polygon, tolerance: number = TOL): boolean {
  if (
    !poly ||
    (poly.length !== 4 &&
      !(
        poly.length === 5 &&
        _internalAlmostEqualPoints(poly[0], poly[4], tolerance)
      ))
  )
    return false;
  const bb = getPolygonBounds(poly);
  if (!bb) return false;
  const corners = [
    new Point(bb.x, bb.y),
    new Point(bb.x + bb.width, bb.y),
    new Point(bb.x + bb.width, bb.y + bb.height),
    new Point(bb.x, bb.y + bb.height),
  ];
  for (const p of poly.slice(0, 4)) {
    // Check first 4 unique points
    if (
      !corners.some((corner) =>
        _internalAlmostEqualPoints(p, corner, tolerance),
      )
    )
      return false;
  }
  for (const corner of corners) {
    if (
      !poly
        .slice(0, 4)
        .some((p) => _internalAlmostEqualPoints(p, corner, tolerance))
    )
      return false;
  }
  return true;
}
// --- END OF PUBLIC API ---
