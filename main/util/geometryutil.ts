// geometryutil.ts
import { Point } from "./point.js";
//import { Vector } from "./vector.js";

// --- START OF INTERFACE/TYPE DEFINITIONS ---
export interface Polygon extends Array<Point> {
  offsetx?: number;
  offsety?: number;
  bounds?: Bounds;
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

  const len = Math.hypot(v.x, v.y);
  if (len === 0) {
    return new Point(0, 0);
  }
  const inverse = 1 / len;
  return new Point(v.x * inverse, v.y * inverse);
}

function _onSegment(
  A: Point,
  B: Point,
  p: Point,
  tolerance: number = TOL,
): boolean {
  if (
    almostEqual(A.x, B.x, tolerance) &&
    almostEqual(p.x, A.x, tolerance)
  ) {
    if (
      !almostEqual(p.y, B.y, tolerance) &&
      !almostEqual(p.y, A.y, tolerance) &&
      p.y < Math.max(B.y, A.y) + tolerance &&
      p.y > Math.min(B.y, A.y) - tolerance
    ) {
      // Added tolerance to bounds
      return true;
    }
    return false;
  }
  if (
    almostEqual(A.y, B.y, tolerance) &&
    almostEqual(p.y, A.y, tolerance)
  ) {
    if (
      !almostEqual(p.x, B.x, tolerance) &&
      !almostEqual(p.x, A.x, tolerance) &&
      p.x < Math.max(B.x, A.x) + tolerance &&
      p.x > Math.min(B.x, A.x) - tolerance
    ) {
      // Added tolerance to bounds
      return true;
    }
    return false;
  }

  const dAP = Math.hypot(p.x - A.x, p.y - A.y);
  const dBP = Math.hypot(p.x - B.x, p.y - B.y);
  const dAB = Math.hypot(B.x - A.x, B.y - A.y);

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
    almostEqualPoints(p, A, tolerance) ||
    almostEqualPoints(p, B, tolerance)
  ) {
    return false; // p is an endpoint
  }
  // Check if sum of distances dAP + dBP is close to dAB
  return Math.abs(dAP + dBP - dAB) < tolerance;
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

// function _inNfp(p: Point, nfpList: Polygon[] | undefined): boolean {
//   if (!nfpList || nfpList.length === 0) return false;
//   for (const nfp of nfpList) {
//     for (const nfpPoint of nfp) {
//       if (
//         almostEqual(p.x, nfpPoint.x) &&
//         almostEqual(p.y, nfpPoint.y)
//       ) {
//         return true;
//       }
//     }
//     if (pointInPolygon(p, nfp)) {
//       return true;
//     }
//   }
//   return false;
// }

// Helper function for linear interpolation between two points
function _lerpPoint(p1: Point, p2: Point, t: number): Point {
  return new Point(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t);
}

// --- END OF MODULE-SCOPED HELPERS ---

// --- START OF PUBLIC API ---
export function almostEqual(a: number, b: number, tolerance?: number): boolean {
  return Math.abs(a - b) < (tolerance || TOL);
}

export function almostEqualPoints(
  a: Point,
  b: Point,
  tolerance?: number,
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < (tolerance || TOL);
}

export function withinDistance(
  p1: Point,
  p2: Point,
  distance: number,
): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  // todo: check if we need to use squared distance
  // origin: return Math.hypot(dx, dy) < (distance || TOL) * (distance || TOL);
  return Math.hypot(dx, dy) < (distance || TOL);
}

export function lineIntersect(
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
  if (almostEqual(denom, 0)) return null;

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

export class QuadraticBezier {
  private static isFlat(p1: Point, p2: Point, c1: Point, tol: number): boolean {
    const flatnessThreshold = 4 * tol * tol;
    let ux = 2 * c1.x - p1.x - p2.x;
    ux *= ux;
    let uy = 2 * c1.y - p1.y - p2.y;
    uy *= uy;
    return ux + uy <= flatnessThreshold;
  }

  static linearize(p1: Point, p2: Point, c1: Point, tol: number): Point[] {
    if (tol <= 0) { // Ensure tol is positive
      // console.warn("QuadraticBezier.linearize: tol must be positive. Clamping to 1e-6.");
      tol = 1e-6;
    }

    // If start and end points of the whole curve are already very close,
    // no need for complex linearization.
    if (almostEqualPoints(p1, p2, tol / 10)) {
      return [new Point(p1.x, p1.y), new Point(p2.x, p2.y)];
    }

    const finished: Point[] = [new Point(p1.x, p1.y)];
    const todo: QuadraticBezierSegmentDef[] = [{ p1, p2, c1 }];

    let iterations = 0;
    const MAX_ITERATIONS_SAFETY = 30000;

    while (todo.length > 0) {
      iterations++;
      if (iterations > MAX_ITERATIONS_SAFETY) {
        console.error(
          `QuadraticBezier.linearize: Exceeded MAX_ITERATIONS_SAFETY (${MAX_ITERATIONS_SAFETY}). Output may be incomplete.`,
        );
        if (finished.length === 0 || !almostEqualPoints(finished[finished.length - 1], p2, tol)) {
          finished.push(new Point(p2.x, p2.y));
        }
        break;
      }

      const segment = todo.shift()!;

      if (almostEqualPoints(segment.p1, segment.p2, tol / 1000)) {
        if (finished.length === 0 || !almostEqualPoints(finished[finished.length - 1], segment.p2, tol / 100)) {
          finished.push(new Point(segment.p2.x, segment.p2.y));
        }
        continue;
      }

      if (this.isFlat(segment.p1, segment.p2, segment.c1, tol)) {
        if (finished.length === 0 || !almostEqualPoints(finished[finished.length - 1], segment.p2, tol / 100)) {
           finished.push(new Point(segment.p2.x, segment.p2.y));
        }
      } else {
        const divided = this.subdivide(segment.p1, segment.p2, segment.c1, 0.5);
        todo.unshift(divided[1]);
        todo.unshift(divided[0]);
      }
    }

    if (finished.length > 0 && !almostEqualPoints(finished[finished.length - 1], p2, tol / 10)) {
      finished.push(new Point(p2.x, p2.y));
    } else if (finished.length === 0) {
      finished.push(new Point(p1.x, p1.y));
      if (!almostEqualPoints(p1, p2, tol/10)) {
          finished.push(new Point(p2.x, p2.y));
      }
    }

    return finished;
  }

  private static subdivide(
    p1: Point,
    p2: Point,
    c1: Point,
    t: number,
  ): [QuadraticBezierSegmentDef, QuadraticBezierSegmentDef] {
    const mid1 = _lerpPoint(p1, c1, t);
    const mid2 = _lerpPoint(c1, p2, t);
    const mid3 = _lerpPoint(mid1, mid2, t);
    return [
      { p1, p2: mid3, c1: mid1 },
      { p1: mid3, p2, c1: mid2 },
    ];
  }
}

export class CubicBezier {
  private static isFlat(
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
  }

  static linearize(
    p1: Point,
    p2: Point,
    c1: Point,
    c2: Point,
    tol: number,
  ): Point[] {
    if (tol <= 0) { // Ensure tol is positive
      // console.warn("CubicBezier.linearize: tol must be positive. Clamping to 1e-6.");
      tol = 1e-6;
    }

    if (almostEqualPoints(p1, p2, tol / 10)) {
      return [new Point(p1.x, p1.y), new Point(p2.x, p2.y)];
    }

    const finished: Point[] = [new Point(p1.x, p1.y)];
    const todo: CubicBezierSegmentDef[] = [{ p1, p2, c1, c2 }];

    let iterations = 0;
    const MAX_ITERATIONS_SAFETY = 30000;

    while (todo.length > 0) {
      iterations++;
      if (iterations > MAX_ITERATIONS_SAFETY) {
        console.error(
          `CubicBezier.linearize: Exceeded MAX_ITERATIONS_SAFETY (${MAX_ITERATIONS_SAFETY}). Output may be incomplete.`,
        );
        if (finished.length === 0 || !almostEqualPoints(finished[finished.length - 1], p2, tol)) {
          finished.push(new Point(p2.x, p2.y));
        }
        break;
      }

      const segment = todo.shift()!;

      if (almostEqualPoints(segment.p1, segment.p2, tol / 1000)) {
        if (finished.length === 0 || !almostEqualPoints(finished[finished.length - 1], segment.p2, tol / 100)) {
          finished.push(new Point(segment.p2.x, segment.p2.y));
        }
        continue;
      }

      if (this.isFlat(segment.p1, segment.p2, segment.c1, segment.c2, tol)) {
        if (finished.length === 0 || !almostEqualPoints(finished[finished.length - 1], segment.p2, tol / 100)) {
           finished.push(new Point(segment.p2.x, segment.p2.y));
        }
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

    if (finished.length > 0 && !almostEqualPoints(finished[finished.length - 1], p2, tol / 10)) {
      finished.push(new Point(p2.x, p2.y));
    } else if (finished.length === 0) {
      finished.push(new Point(p1.x, p1.y));
       if (!almostEqualPoints(p1, p2, tol/10)) {
          finished.push(new Point(p2.x, p2.y));
      }
    }

    return finished;
  }

  private static subdivide(
    p1: Point,
    p2: Point,
    c1: Point,
    c2: Point,
    t: number,
  ): [CubicBezierSegmentDef, CubicBezierSegmentDef] {
    const p1c1 = _lerpPoint(p1, c1, t);
    const c1c2 = _lerpPoint(c1, c2, t);
    const c2p2 = _lerpPoint(c2, p2, t);
    const p1c1_c1c2 = _lerpPoint(p1c1, c1c2, t);
    const c1c2_c2p2 = _lerpPoint(c1c2, c2p2, t);
    const midPoint = _lerpPoint(p1c1_c1c2, c1c2_c2p2, t);
    return [
      { p1: p1, c1: p1c1, c2: p1c1_c1c2, p2: midPoint },
      { p1: midPoint, c1: c1c2_c2p2, c2: c2p2, p2: p2 },
    ];
  }
}

export class Arc {
  static linearize(
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
    if (almostEqualPoints(p1, p2)) return finalPoints;

    // Moved the zero radius check before calling svgToCenter
    if (rx <= TOL || ry <= TOL) {
      finalPoints.push(p2);
      return finalPoints;
    }

    const initialArcParams = this.svgToCenter(
      p1,
      p2,
      rx,
      ry,
      angle,
      largearc,
      sweep,
    );

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
  }

  private static centerToSvg(
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
  }

  private static svgToCenter(
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

    // Handle zero or near-zero radii early
    if (rx < TOL || ry < TOL) {
      return {
        center: new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2),
        rx: rx,
        ry: ry,
        theta: 0,
        extent: 0,
        angle: angleDegrees,
      };
    }

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
    const den = rx_sq * y1p_sq + ry_sq * x1p_sq;
    if (almostEqual(den, 0)) {
        return {
            center: new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2),
            rx: rx,
            ry: ry,
            theta: 0,
            extent: 0,
            angle: angleDegrees,
        };
    }
    const c_prime_scale = sign * Math.sqrt(num / den);
    const cxp = c_prime_scale * ((rx * y1p) / ry);
    const cyp = c_prime_scale * -((ry * x1p) / rx);

    if (!isFinite(cxp) || !isFinite(cyp)) {
        return {
            center: new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2),
            rx: rx,
            ry: ry,
            theta: 0,
            extent: 0,
            angle: angleDegrees,
        };
    }

    const cx = cosPhi * cxp - sinPhi * cyp + (p1.x + p2.x) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (p1.y + p2.y) / 2;
    const vecAngle = (
      ux: number,
      uy: number,
      vx: number,
      vy: number,
    ): number => {
      const dot = ux * vx + uy * vy;
      const len1 = Math.hypot(ux, uy);
      const len2 = Math.hypot(vx, vy);
      const denominator = len1 * len2;
      if (almostEqual(denominator, 0)) return 0; // Avoid division by zero if either vector has zero length

      let angRad = Math.acos(
        Math.max(-1, Math.min(1, dot / denominator)),
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
  }
}

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
    if (almostEqualPoints(point, pi, tolerance)) return null;
    if (_onSegment(pi, pj, point, tolerance)) return null;
    if (
      almostEqual(pi.x, pj.x, tolerance) &&
      almostEqual(pi.y, pj.y, tolerance)
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

// returns the area of the polygon, assuming no self-intersections
// a negative area indicates counter-clockwise winding direction
export function polygonArea(polygon: Polygon): number {
  let area = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
  }
  return 0.5 * area;
}

// todo: swap this for a more efficient sweep-line implementation
// returnEdges: if set, return all edges on A that have intersections
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
    if (almostEqualPoints(a1, a2, TOL)) continue;

    for (let j = 0; j < B_pts.length; j++) {
      const b1 = new Point(B_pts[j].x + Boffsetx, B_pts[j].y + Boffsety);
      const b2 = _getSafePolygonPoint(B_pts, j + 1, Boffsetx, Boffsety);
      if (almostEqualPoints(b1, b2, TOL)) continue;

      if (lineIntersect(a1, a2, b1, b2, false) !== null) return true;

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
        almostEqualPoints(a1, b1, TOL)
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
        almostEqualPoints(a2, b2, TOL)
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
        almostEqualPoints(b1, a1, TOL)
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
        almostEqualPoints(b2, a2, TOL)
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
    if (almostEqual(dotProducts[i], minDot)) {
      const normalDot = polygon[i].x * normal.x + polygon[i].y * normal.y;
      if (normalDot > normalMin) {
        normalMin = normalDot;
        indexMin = i;
      }
    }
    if (almostEqual(dotProducts[i], maxDot)) {
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
    y: nextVertex.y - minVertex.x,
  };
  const dotPrev = vecToPrev.x * direction.x + vecToPrev.y * direction.y;
  const dotNext = vecToNext.x * direction.x + vecToNext.y * direction.y;
  let scanDirection = 0;
  if (almostEqual(dotPrev, 0)) scanDirection = 1;
  else if (almostEqual(dotNext, 0)) scanDirection = -1;
  else {
    const normalDotPrev = vecToPrev.x * normal.x + vecToPrev.y * normal.y;
    const normalDotNext = vecToNext.x * normal.x + vecToNext.y * normal.y;
    let scaledNormalDotPrev = normalDotPrev,
      scaledNormalDotNext = normalDotNext;
    if (!almostEqual(dotPrev, dotNext)) {
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
  if (almostEqual(p_dot_dir, s1_dot_dir)) {
    if (s1inclusive) return p_dot_norm - s1_dot_norm;
    if (!(p_dot_dir > min_s_dot_dir - TOL && p_dot_dir < max_s_dot_dir + TOL))
      return null;
  }
  if (almostEqual(p_dot_dir, s2_dot_dir)) {
    if (s2inclusive) return p_dot_norm - s2_dot_norm;
    if (!(p_dot_dir > min_s_dot_dir - TOL && p_dot_dir < max_s_dot_dir + TOL))
      return null;
  }
  if (
    !s1inclusive &&
    p_dot_dir < min_s_dot_dir + TOL &&
    !almostEqual(p_dot_dir, min_s_dot_dir)
  )
    return null;
  if (
    !s2inclusive &&
    p_dot_dir > max_s_dot_dir - TOL &&
    !almostEqual(p_dot_dir, max_s_dot_dir)
  )
    return null;

  if (almostEqual(s1_dot_dir, s2_dot_dir)) {
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
  const dir = { x: normal.y, y: -normal.x }; // Direction perpendicular to normalVec, along the line s1s2 if normalVec is its normal
  const p_dot_dir = p.x * dir.x + p.y * dir.y;
  const s1_dot_dir = s1.x * dir.x + s1.y * dir.y;
  const s2_dot_dir = s2.x * dir.x + s2.y * dir.y;
  const p_dot_norm = p.x * normal.x + p.y * normal.y;
  const s1_dot_norm = s1.x * normal.x + s1.y * normal.y;
  const s2_dot_norm = s2.x * normal.x + s2.y * normal.y;

  if (!infinite) {
    const min_s_dot_dir = Math.min(s1_dot_dir, s2_dot_dir);
    const max_s_dot_dir = Math.max(s1_dot_dir, s2_dot_dir);

    if (almostEqualPoints(s1, s2, TOL)) { // Segment is a point
      if (!almostEqual(p_dot_dir, s1_dot_dir, TOL)) {
        return null; // p does not project onto the point along dir
      }
      // If it projects onto the point, distance is along normalVec
      return p_dot_norm - s1_dot_norm;
    }

    // Check if p's projection on 'dir' is outside segment's projection on 'dir'
    if (
      (p_dot_dir < min_s_dot_dir - TOL && !almostEqual(p_dot_dir, min_s_dot_dir, TOL)) ||
      (p_dot_dir > max_s_dot_dir + TOL && !almostEqual(p_dot_dir, max_s_dot_dir, TOL))
    ) {
      return null; // p's projection is outside segment's projection
    }
  }

  // If s1s2 is a line perpendicular to 'dir' (i.e., s1_dot_dir is very close to s2_dot_dir)
  if (almostEqual(s1_dot_dir, s2_dot_dir, TOL)) {
    return p_dot_norm - s1_dot_norm; // Distance is simply along normalVec
  }

  // General case: p's projection is on the segment (or infinite line)
  // Calculate where p projects onto the line s1s2 in terms of 'normalVec'
  const projected_p_on_line_norm =
    s1_dot_norm +
    ((s2_dot_norm - s1_dot_norm) * (p_dot_dir - s1_dot_dir)) /
      (s2_dot_dir - s1_dot_dir);

  return p_dot_norm - projected_p_on_line_norm; // Positive if p is on positive side of line along normalVec
}

export function segmentDistance(
  A: Point, // Point 1 of Segment 1 (moving segment)
  B: Point, // Point 2 of Segment 1
  E: Point, // Point 1 of Segment 2 (fixed segment)
  F: Point, // Point 2 of Segment 2
  directionVec: Point, // Direction Segment 1 (AB) moves
): number | null {
  const slideNormal = _normalizeVector(new Point(directionVec.y, -directionVec.x)); // Perpendicular to slide direction
  const slideDirection = _normalizeVector(directionVec); // Normalized slide direction
  const reverseSlideDirection = new Point(-slideDirection.x, -slideDirection.y);

  // Project segments onto slideNormal. If they don't overlap, they are separated
  // in a way that sliding along slideDirection won't make them touch unless they are aligned with slideNormal.
  const dotA_slideNormal = A.x * slideNormal.x + A.y * slideNormal.y;
  const dotB_slideNormal = B.x * slideNormal.x + B.y * slideNormal.y;
  const dotE_slideNormal = E.x * slideNormal.x + E.y * slideNormal.y;
  const dotF_slideNormal = F.x * slideNormal.x + F.y * slideNormal.y;

  const S1_slideNormal_min = Math.min(dotA_slideNormal, dotB_slideNormal);
  const S1_slideNormal_max = Math.max(dotA_slideNormal, dotB_slideNormal);
  const S2_slideNormal_min = Math.min(dotE_slideNormal, dotF_slideNormal);
  const S2_slideNormal_max = Math.max(dotE_slideNormal, dotF_slideNormal);

  if (
    S1_slideNormal_max < S2_slideNormal_min - TOL ||
    S1_slideNormal_min > S2_slideNormal_max + TOL
  ) {
    return null; // Separated perpendicularly to slide direction
  }

  // Check for collinearity of segments AB and EF
  const vecABx = B.x - A.x;
  const vecABy = B.y - A.y;
  const crossABE = (E.y - A.y) * vecABx - (E.x - A.x) * vecABy;
  const crossABF = (F.y - A.y) * vecABx - (F.x - A.x) * vecABy;

  if (almostEqual(crossABE, 0, TOL) && almostEqual(crossABF, 0, TOL)) {
    // Segments are collinear
    // Project all points onto the slideDirection
    const A_proj_slide = A.x * slideDirection.x + A.y * slideDirection.y;
    const B_proj_slide = B.x * slideDirection.x + B.y * slideDirection.y;
    const E_proj_slide = E.x * slideDirection.x + E.y * slideDirection.y;
    const F_proj_slide = F.x * slideDirection.x + F.y * slideDirection.y;

    const S1_min_proj = Math.min(A_proj_slide, B_proj_slide);
    const S1_max_proj = Math.max(A_proj_slide, B_proj_slide);
    const S2_min_proj = Math.min(E_proj_slide, F_proj_slide);
    const S2_max_proj = Math.max(E_proj_slide, F_proj_slide);

    // S1 (AB) is moving, S2 (EF) is fixed. We want smallest positive distance d for S1 to touch S2.
    // If S1 is [s1min, s1max] and S2 is [s2min, s2max] on the line of projection.

    // Case 1: S1 is entirely before S2 (S1_max_proj <= S2_min_proj)
    if (S1_max_proj < S2_min_proj + TOL) {
      const dist = S2_min_proj - S1_max_proj;
      return dist < -TOL ? null : (dist < TOL ? 0 : dist) ; // if dist is small negative, treat as 0, else positive
    }
    // Case 2: S2 is entirely before S1 (S2_max_proj <= S1_min_proj)
    // S1 moving in slideDirection will move further away or is already past.
    // (Unless slideDirection is negative of the projection line, then S1_min_proj would be "later")
    // This case should yield null if we only consider positive slide distances.
    // However, if S1 is "behind" S2 (e.g. S1_min_proj > S2_max_proj) but slideDirection points from S1 to S2,
    // then this is covered by S1_max_proj < S2_min_proj if points are ordered by slideDirection.
    // The current logic assumes slideDirection aligns with increasing projection values.
    // If S1 needs to move "backwards" (negative distance), it's not a valid result.
    // So, if S1_min_proj > S2_max_proj - TOL, return null.
    if (S1_min_proj > S2_max_proj - TOL) {
      return null;
    }

    // Case 3: Overlap
    // (S1_max_proj > S2_min_proj - TOL && S1_min_proj < S2_max_proj + TOL)
    return 0; // Overlapping or touching
  }

  // Segments are not collinear (typically parallel and offset, or angled)
  const distances: number[] = [];
  let d: number | null;

  // Distances for AB (Seg1) to move along slideDirection to meet line EF (Seg2)
  // This is equivalent to distance from points of AB to line EF, measured along slideDirection.
  // pointDistance(point_on_AB, E, F, slideDirection)
  d = pointDistance(A, E, F, reverseSlideDirection, true);
  if (d !== null) distances.push(d); // Allow negative d
  d = pointDistance(B, E, F, reverseSlideDirection, true);
  if (d !== null) distances.push(d); // Allow negative d

  // Distances for EF (Seg2) to move along slideDirection to meet line AB (Seg1)
  // This is equivalent to distance from points of EF to line AB, measured along slideDirection.
  // pointDistance(point_on_EF, A, B, slideDirection)
  // This also represents how far AB has to move in slideDirection for line AB to meet points of EF.
  d = pointDistance(E, A, B, slideDirection, true);
  if (d !== null) distances.push(d); // Allow negative d
  d = pointDistance(F, A, B, slideDirection, true);
  if (d !== null) distances.push(d); // Allow negative d

  if (distances.length === 0) return null;
  return Math.min(...distances);
}

export function polygonSlideDistance(
  polyA: Polygon,
  polyB: Polygon,
  direction: Point,
  ignoreNegative?: boolean,
): number | null {
  if (!polyA || !polyB || polyA.length < 1 || polyB.length < 1 || !direction) {
    return null;
  }
  if (almostEqual(direction.x, 0) && almostEqual(direction.y, 0)) {
    return null;
  }

  let minDistance = Infinity;
  let foundInteraction = false;
  const normalizedDirection = _normalizeVector(direction);

  for (let i = 0; i < polyA.length; i++) {
    const sA1 = polyA[i];
    const sA2 = polyA[(i + 1) % polyA.length];

    for (let j = 0; j < polyB.length; j++) {
      const sB1 = polyB[j];
      const sB2 = polyB[(j + 1) % polyB.length];

      const slideValue = segmentDistance(
        sA1,
        sA2,
        sB1,
        sB2,
        normalizedDirection,
      );

      if (slideValue === null) {
        continue;
      }
      foundInteraction = true;

      if (slideValue < -TOL) { // Segments are overlapping or need to slide opposite to direction
        if (ignoreNegative) {
          minDistance = Math.min(minDistance, 0); // Overlap counts as 0 slide
        }
        // If not ignoreNegative, a negative slideValue means this pair doesn't contribute to a positive slide in the given direction.
        // We are looking for the smallest *positive* slide, or 0 if overlapping and ignoreNegative=true.
        // So, if slideValue is negative and we are not ignoring negatives, we effectively skip this value
        // unless it's the only interaction found (covered by foundInteraction and minDistance === Infinity check later).
      } else { // slideValue is >= -TOL (touching, positive slide, or slight overlap treated as touch)
        if (ignoreNegative && slideValue < 0) { // Slight overlap, treat as 0 if ignoreNegative
          minDistance = Math.min(minDistance, 0);
        } else if (slideValue >= -TOL) { // Non-negative or very slightly negative (effectively zero)
          minDistance = Math.min(minDistance, Math.max(0, slideValue)); // Ensure it's not negative if not ignoreNegative
        }
      }
    }
  }

  if (!foundInteraction || minDistance === Infinity) {
    // No interaction found, or all interactions resulted in slides opposite to direction (and not ignoreNegative)
    // Check if they are already overlapping significantly, which segmentDistance might return as a large negative.
    // However, the current segmentDistance logic aims to return the *closest positive distance* or null.
    // If ignoreNegative is false, and all slideValues were negative, minDistance would remain Infinity.
    // If ignoreNegative is true, and they overlap, minDistance should be 0.
    // If they don't interact at all along the direction, it's null.
    return null; // No valid slide distance found in the given direction
  }

  // If ignoreNegative is false, and the smallest interaction was an overlap (negative), this implies
  // they can't slide *positively* to touch. The test expects null in this case.
  // However, if minDistance is a very small negative (within TOL), treat as 0.
  if (!ignoreNegative && minDistance < -TOL) {
    return null;
  }

  return Math.max(0, minDistance); // Final safety: distance cannot be negative unless it's a deep overlap and ignoreNegative is false (which is now null)
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
    !almostEqualPoints(A_pts[0], A_pts[A_pts.length - 1])
  )
    A_pts.push(A_pts[0]);
  if (A_pts.length < 2 || B_pts.length < 1) return null;
  let overallMaxMinProjection: number | null = null;
  for (const pB_orig of B_pts) {
    const pB = new Point(pB_orig.x + Boffsetx, pB_orig.y + Boffsety);
    let minPositiveTravelForCurrent_pB: number | null = null;
    for (let i = 0; i < A_pts.length - 1; i++) {
      const sA1 = new Point(A_pts[i].x + Aoffsetx, A_pts[i].y + Aoffsety);
      const sA2 = new Point(
        A_pts[i + 1].x + Aoffsetx,
        A_pts[i + 1].y + Aoffsety,
      );
      if (almostEqualPoints(sA1, sA2, TOL)) continue;
      const segDir_x = sA2.x - sA1.x,
        segDir_y = sA2.y - sA1.y;
      const segLenSq = segDir_x * segDir_x + segDir_y * segDir_y;
      const dirLenSq = direction.x * direction.x + direction.y * direction.y;

      if (Math.abs(segDir_y * direction.x - segDir_x * direction.y) < TOL * TOL * (segLenSq + dirLenSq))
        continue;

      const d_pd = pointDistance(pB, sA1, sA2, direction, true);
      if (d_pd !== null) {
        if (d_pd < -TOL) {
            const travelDistance = -d_pd;
            if (minPositiveTravelForCurrent_pB === null || travelDistance < minPositiveTravelForCurrent_pB) {
                minPositiveTravelForCurrent_pB = travelDistance;
            }
        } else if (Math.abs(d_pd) < TOL) {
             if (minPositiveTravelForCurrent_pB === null || 0 < minPositiveTravelForCurrent_pB) {
                minPositiveTravelForCurrent_pB = 0;
            }
        }
      }
    }
    if (minPositiveTravelForCurrent_pB !== null) {
      if (
        overallMaxMinProjection === null ||
        minPositiveTravelForCurrent_pB > overallMaxMinProjection
      )
        overallMaxMinProjection = minPositiveTravelForCurrent_pB;
    }
  }
  return overallMaxMinProjection;
}

// export function searchStartPoint(
//   A: Polygon,
//   B: Polygon,
//   inside: boolean = false,
//   NFP?: Polygon[],
// ): Point | null {
//   // ... implementation ...
// }

export function rotatePolygon(polygon: Polygon, angleDegrees: number): Polygon {
  const angleRad = _degreesToRadians(angleDegrees);
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const referencePoint = polygon[0]; // Assuming rotation around the first point

  return polygon.map((p, index) => {
    if (index === 0) {
      return new Point(p.x, p.y); // First point remains the same (rotation origin)
    }
    const translatedX = p.x - referencePoint.x;
    const translatedY = p.y - referencePoint.y;
    const rotatedX = translatedX * cosA - translatedY * sinA;
    const rotatedY = translatedX * sinA + translatedY * cosA;
    return new Point(rotatedX + referencePoint.x, rotatedY + referencePoint.y);
  });
}

export function isRectangle(polygon: Polygon, tol: number = TOL): boolean {
  if (!polygon || polygon.length < 4) {
    return false;
  }

  let poly = polygon;
  // If the polygon is closed (first and last points are the same), remove the last point for calculations
  if (poly.length === 5 && almostEqualPoints(poly[0], poly[4], tol)) {
    poly = poly.slice(0, 4);
  }

  if (poly.length !== 4) {
    return false;
  }

  // Check side lengths (opposite sides should be equal)
  const d01 = Math.hypot(poly[1].x - poly[0].x, poly[1].y - poly[0].y);
  const d12 = Math.hypot(poly[2].x - poly[1].x, poly[2].y - poly[1].y);
  const d23 = Math.hypot(poly[3].x - poly[2].x, poly[3].y - poly[2].y);
  const d30 = Math.hypot(poly[0].x - poly[3].x, poly[0].y - poly[3].y);

  if (!almostEqual(d01, d23, tol) || !almostEqual(d12, d30, tol)) {
    return false;
  }

  // Check diagonals (should be equal)
  const diag1 = Math.hypot(poly[2].x - poly[0].x, poly[2].y - poly[0].y);
  const diag2 = Math.hypot(poly[3].x - poly[1].x, poly[3].y - poly[1].y);

  if (!almostEqual(diag1, diag2, tol)) {
    return false;
  }

  // Check dot products of adjacent sides (should be zero for 90-degree angles)
  // Vector v01 = poly[1] - poly[0]
  // Vector v12 = poly[2] - poly[1]
  // Vector v23 = poly[3] - poly[2]
  // Vector v30 = poly[0] - poly[3]

  const v01 = { x: poly[1].x - poly[0].x, y: poly[1].y - poly[0].y };
  const v12 = { x: poly[2].x - poly[1].x, y: poly[2].y - poly[1].y };
  const v23 = { x: poly[3].x - poly[2].x, y: poly[3].y - poly[2].y };
  const v30 = { x: poly[0].x - poly[3].x, y: poly[0].y - poly[3].y };

  if (
    !almostEqual(v01.x * v12.x + v01.y * v12.y, 0, tol * d01 * d12) || // scaled tolerance
    !almostEqual(v12.x * v23.x + v12.y * v23.y, 0, tol * d12 * d23) ||
    !almostEqual(v23.x * v30.x + v23.y * v30.y, 0, tol * d23 * d30) ||
    !almostEqual(v30.x * v01.x + v30.y * v01.y, 0, tol * d30 * d01)
  ) {
    return false;
  }

  return true;
}

// --- END OF PUBLIC API ---
