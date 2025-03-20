/*!
 * General purpose geometry functions for polygon/Bezier calculations
 * Copyright 2015 Jack Qiao
 * Portions copyright 2022 Will Murnane
 * Licensed under the MIT license
 */
const TOL = Math.pow(10, -9); // Floating point error is likely to be above 1 epsilon
import { Point } from "./point";
import { Polygon } from "./polygon";
import { Vector } from "./vector";

export class GeometryUtil {
  // floating point comparison tolerance
  static almostEqual(a: number, b: number, tolerance?: number): boolean {
    if (!tolerance) {
      tolerance = TOL;
    }
    return Math.abs(a - b) < tolerance;
  }

  // returns true if p lies on the line segment defined by AB, but not at any endpoints
  // may need work!
  static onSegment(A: Point, B: Point, p: Point, tolerance?: number): boolean {
    if (!tolerance) {
      tolerance = TOL;
    }

    // vertical line
    if (
      GeometryUtil.almostEqual(A.x, B.x, tolerance) &&
      GeometryUtil.almostEqual(p.x, A.x, tolerance)
    ) {
      if (
        !GeometryUtil.almostEqual(p.y, B.y, tolerance) &&
        !GeometryUtil.almostEqual(p.y, A.y, tolerance) &&
        p.y < Math.max(B.y, A.y, tolerance) &&
        p.y > Math.min(B.y, A.y, tolerance)
      ) {
        return true;
      } else {
        return false;
      }
    }

    // horizontal line
    if (
      GeometryUtil.almostEqual(A.y, B.y, tolerance) &&
      GeometryUtil.almostEqual(p.y, A.y, tolerance)
    ) {
      if (
        !GeometryUtil.almostEqual(p.x, B.x, tolerance) &&
        !GeometryUtil.almostEqual(p.x, A.x, tolerance) &&
        p.x < Math.max(B.x, A.x) &&
        p.x > Math.min(B.x, A.x)
      ) {
        return true;
      } else {
        return false;
      }
    }

    //range check
    if (
      (p.x < A.x && p.x < B.x) ||
      (p.x > A.x && p.x > B.x) ||
      (p.y < A.y && p.y < B.y) ||
      (p.y > A.y && p.y > B.y)
    ) {
      return false;
    }

    // exclude end points
    if (
      (GeometryUtil.almostEqual(p.x, A.x, tolerance) &&
        GeometryUtil.almostEqual(p.y, A.y, tolerance)) ||
      (GeometryUtil.almostEqual(p.x, B.x, tolerance) &&
        GeometryUtil.almostEqual(p.y, B.y, tolerance))
    ) {
      return false;
    }

    var cross = (p.y - A.y) * (B.x - A.x) - (p.x - A.x) * (B.y - A.y);
    if (Math.abs(cross) > tolerance) {
      return false;
    }

    var dot = (p.x - A.x) * (B.x - A.x) + (p.y - A.y) * (B.y - A.y);
    if (dot < 0 || GeometryUtil.almostEqual(dot, 0, tolerance)) {
      return false;
    }

    var len2 = (B.x - A.x) * (B.x - A.x) + (B.y - A.y) * (B.y - A.y);
    if (dot > len2 || GeometryUtil.almostEqual(dot, len2, tolerance)) {
      return false;
    }

    return true;
  }

  // returns the intersection of AB and EF
  // or null if there are no intersections or other numerical error
  // if the infinite flag is set, AE and EF describe infinite lines without endpoints, they are finite line segments otherwise
  static lineIntersect(
    A: Point,
    B: Point,
    E: Point,
    F: Point,
    infinite?: boolean
  ): Point | null {
    var a1, a2, b1, b2, c1, c2, x, y;

    a1 = B.y - A.y;
    b1 = A.x - B.x;
    c1 = B.x * A.y - A.x * B.y;
    a2 = F.y - E.y;
    b2 = E.x - F.x;
    c2 = F.x * E.y - E.x * F.y;

    var denom = a1 * b2 - a2 * b1;

    (x = (b1 * c2 - b2 * c1) / denom), (y = (a2 * c1 - a1 * c2) / denom);

    if (!isFinite(x) || !isFinite(y)) {
      return null;
    }

    // lines are colinear
    /*var crossABE = (E.y - A.y) * (B.x - A.x) - (E.x - A.x) * (B.y - A.y);
		var crossABF = (F.y - A.y) * (B.x - A.x) - (F.x - A.x) * (B.y - A.y);
		if(GeometryUtil.almostEqual(crossABE,0) && GeometryUtil.almostEqual(crossABF,0)){
			return null;
		}*/

    if (!infinite) {
      // coincident points do not count as intersecting
      if (
        Math.abs(A.x - B.x) > TOL &&
        (A.x < B.x ? x < A.x || x > B.x : x > A.x || x < B.x)
      )
        return null;
      if (
        Math.abs(A.y - B.y) > TOL &&
        (A.y < B.y ? y < A.y || y > B.y : y > A.y || y < B.y)
      )
        return null;

      if (
        Math.abs(E.x - F.x) > TOL &&
        (E.x < F.x ? x < E.x || x > F.x : x > E.x || x < F.x)
      )
        return null;
      if (
        Math.abs(E.y - F.y) > TOL &&
        (E.y < F.y ? y < E.y || y > F.y : y > E.y || y < F.y)
      )
        return null;
    }

    return new Point(x, y);
  }

  // placement algos as outlined in [1] http://www.cs.stir.ac.uk/~goc/papers/EffectiveHueristic2DAOR2013.pdf
  // returns a continuous polyline representing the normal-most edge of the given polygon
  // eg. a normal vector of [-1, 0] will return the left-most edge of the polygon
  // this is essentially algo 8 in [1], generalized for any vector direction
  // static polygonEdge(polygon: Polygon, normal: Vector): Array<Point> | null {
  //   if (!polygon.points || polygon.points.length < 3) {
  //     return null;
  //   }

  //   normal = normal.normalized();

  //   var direction = new Vector(-normal.dy, normal.dx);

  //   // find the max and min points, they will be the endpoints of our edge
  //   var min = null;
  //   var max = null;

  //   var dotproduct = [];

  //   for (var i = 0; i < polygon.points.length; i++) {
  //     var dot = polygon.points[i].x * direction.dx + polygon.points[i].y * direction.dy;
  //     dotproduct.push(dot);
  //     if (min === null || dot < min) {
  //       min = dot;
  //     }
  //     if (max === null || dot > max) {
  //       max = dot;
  //     }
  //   }

  //   // there may be multiple vertices with min/max values. In which case we choose the one that is normal-most (eg. left most)
  //   var indexmin = 0;
  //   var indexmax = 0;

  //   var normalmin = null;
  //   var normalmax = null;

  //   for (i = 0; i < polygon.points.length; i++) {
  //     if (GeometryUtil.almostEqual(dotproduct[i], min)) {
  //       var dot =
  //         polygon.points[i].x * normal.dx + polygon.points[i].y * normal.dy;
  //       if (normalmin === null || dot > normalmin) {
  //         normalmin = dot;
  //         indexmin = i;
  //       }
  //     } else if (GeometryUtil.almostEqual(dotproduct[i], max)) {
  //       var dot =
  //         polygon.points[i].x * normal.dx + polygon.points[i].y * normal.dy;
  //       if (normalmax === null || dot > normalmax) {
  //         normalmax = dot;
  //         indexmax = i;
  //       }
  //     }
  //   }

  //   // now we have two edges bound by min and max points, figure out which edge faces our direction vector

  //   var indexleft = indexmin - 1;
  //   var indexright = indexmin + 1;

  //   if (indexleft < 0) {
  //     indexleft = polygon.points.length - 1;
  //   }
  //   if (indexright >= polygon.points.length) {
  //     indexright = 0;
  //   }

  //   var minvertex = polygon.points[indexmin];
  //   var left = polygon.points[indexleft];
  //   var right = polygon.points[indexright];

  //   var leftvector = new Vector(left.x - minvertex.x, left.y - minvertex.y);

  //   var rightvector = new Vector(right.x - minvertex.x, right.y - minvertex.y);

  //   var dotleft = leftvector.dot(direction);
  //   var dotright = rightvector.dot(direction);

  //   // -1 = left, 1 = right
  //   var scandirection = -1;

  //   if (GeometryUtil.almostEqual(dotleft, 0)) {
  //     scandirection = 1;
  //   } else if (GeometryUtil.almostEqual(dotright, 0)) {
  //     scandirection = -1;
  //   } else {
  //     var normaldotleft;
  //     var normaldotright;

  //     if (GeometryUtil.almostEqual(dotleft, dotright)) {
  //       // the points line up exactly along the normal vector
  //       normaldotleft = leftvector.dot(normal);
  //       normaldotright = rightvector.dot(normal);
  //     } else if (dotleft < dotright) {
  //       // normalize right vertex so normal projection can be directly compared
  //       normaldotleft = leftvector.dot(normal);
  //       normaldotright = rightvector.dot(normal) * (dotleft / dotright);
  //     } else {
  //       // normalize left vertex so normal projection can be directly compared
  //       normaldotleft = leftvector.dot(normal) * (dotright / dotleft);
  //       normaldotright = rightvector.dot(normal);
  //     }

  //     if (normaldotleft > normaldotright) {
  //       scandirection = -1;
  //     } else {
  //       // technically they could be equal, (ie. the segments bound by left and right points are incident)
  //       // in which case we'll have to climb up the chain until lines are no longer incident
  //       // for now we'll just not handle it and assume people aren't giving us garbage input..
  //       scandirection = 1;
  //     }
  //   }

  //   // connect all points between indexmin and indexmax along the scan direction
  //   var edge = [];
  //   var count = 0;
  //   i = indexmin;
  //   while (count < polygon.points.length) {
  //     if (i >= polygon.points.length) {
  //       i = 0;
  //     } else if (i < 0) {
  //       i = polygon.points.length - 1;
  //     }

  //     edge.push(polygon.points[i]);

  //     if (i == indexmax) {
  //       break;
  //     }
  //     i += scandirection;
  //     count++;
  //   }

  //   return edge;
  // }

  // // returns the normal distance from p to a line segment defined by s1 s2
  // // this is basically algo 9 in [1], generalized for any vector direction
  // // eg. normal of [-1, 0] returns the horizontal distance between the point and the line segment
  // // sxinclusive: if true, include endpoints instead of excluding them
  // static pointLineDistance(
  //   p: Point,
  //   s1: Point,
  //   s2: Point,
  //   norm: Vector,
  //   s1inclusive: boolean,
  //   s2inclusive: boolean
  // ): number | null {
  //   const normal = norm.normalized();

  //   var dir = new Vector(normal.dy, -normal.dx);

  //   var pdot = p.x * dir.dx + p.y * dir.dy;
  //   var s1dot = s1.x * dir.dx + s1.y * dir.dy;
  //   var s2dot = s2.x * dir.dx + s2.y * dir.dy;

  //   var pdotnorm = p.x * normal.dx + p.y * normal.dy;
  //   var s1dotnorm = s1.x * normal.dx + s1.y * normal.dy;
  //   var s2dotnorm = s2.x * normal.dx + s2.y * normal.dy;

  //   // point is exactly along the edge in the normal direction
  //   if (
  //     GeometryUtil.almostEqual(pdot, s1dot) &&
  //     GeometryUtil.almostEqual(pdot, s2dot)
  //   ) {
  //     // point lies on an endpoint
  //     if (GeometryUtil.almostEqual(pdotnorm, s1dotnorm)) {
  //       return null;
  //     }

  //     if (GeometryUtil.almostEqual(pdotnorm, s2dotnorm)) {
  //       return null;
  //     }

  //     // point is outside both endpoints
  //     if (pdotnorm > s1dotnorm && pdotnorm > s2dotnorm) {
  //       return Math.min(pdotnorm - s1dotnorm, pdotnorm - s2dotnorm);
  //     }
  //     if (pdotnorm < s1dotnorm && pdotnorm < s2dotnorm) {
  //       return -Math.min(s1dotnorm - pdotnorm, s2dotnorm - pdotnorm);
  //     }

  //     // point lies between endpoints
  //     var diff1 = pdotnorm - s1dotnorm;
  //     var diff2 = pdotnorm - s2dotnorm;
  //     if (diff1 > 0) {
  //       return diff1;
  //     } else {
  //       return diff2;
  //     }
  //   }
  //   // point
  //   else if (GeometryUtil.almostEqual(pdot, s1dot)) {
  //     if (s1inclusive) {
  //       return pdotnorm - s1dotnorm;
  //     } else {
  //       return null;
  //     }
  //   } else if (GeometryUtil.almostEqual(pdot, s2dot)) {
  //     if (s2inclusive) {
  //       return pdotnorm - s2dotnorm;
  //     } else {
  //       return null;
  //     }
  //   } else if (
  //     (pdot < s1dot && pdot < s2dot) ||
  //     (pdot > s1dot && pdot > s2dot)
  //   ) {
  //     return null; // point doesn't collide with segment
  //   }

  //   return (
  //     pdotnorm -
  //     s1dotnorm +
  //     ((s1dotnorm - s2dotnorm) * (s1dot - pdot)) / (s1dot - s2dot)
  //   );
  // }

  static pointDistance(
    p: Point,
    s1: Point,
    s2: Point,
    norm: Vector,
    infinite?: boolean
  ): number | null {
    const normal = norm.normalized();

    var dir = new Vector(normal.dy, -normal.dx);

    var pdot = p.x * dir.dx + p.y * dir.dy;
    var s1dot = s1.x * dir.dx + s1.y * dir.dy;
    var s2dot = s2.x * dir.dx + s2.y * dir.dy;

    var pdotnorm = p.x * normal.dx + p.y * normal.dy;
    var s1dotnorm = s1.x * normal.dx + s1.y * normal.dy;
    var s2dotnorm = s2.x * normal.dx + s2.y * normal.dy;

    if (!infinite) {
      if (
        ((pdot < s1dot || GeometryUtil.almostEqual(pdot, s1dot)) &&
          (pdot < s2dot || GeometryUtil.almostEqual(pdot, s2dot))) ||
        ((pdot > s1dot || GeometryUtil.almostEqual(pdot, s1dot)) &&
          (pdot > s2dot || GeometryUtil.almostEqual(pdot, s2dot)))
      ) {
        return null; // dot doesn't collide with segment, or lies directly on the vertex
      }
      if (
        GeometryUtil.almostEqual(pdot, s1dot) &&
        GeometryUtil.almostEqual(pdot, s2dot) &&
        pdotnorm > s1dotnorm &&
        pdotnorm > s2dotnorm
      ) {
        return Math.min(pdotnorm - s1dotnorm, pdotnorm - s2dotnorm);
      }
      if (
        GeometryUtil.almostEqual(pdot, s1dot) &&
        GeometryUtil.almostEqual(pdot, s2dot) &&
        pdotnorm < s1dotnorm &&
        pdotnorm < s2dotnorm
      ) {
        return -Math.min(s1dotnorm - pdotnorm, s2dotnorm - pdotnorm);
      }
    }

    return -(
      pdotnorm -
      s1dotnorm +
      ((s1dotnorm - s2dotnorm) * (s1dot - pdot)) / (s1dot - s2dot)
    );
  }

  static segmentDistance(
    A: Point,
    B: Point,
    E: Point,
    F: Point,
    direction: Vector
  ): number | null {
    var normal = new Vector(direction.dy, -direction.dx);

    var reverse = new Vector(-direction.dx, -direction.dy);

    var dotA = A.x * normal.dx + A.y * normal.dy;
    var dotB = B.x * normal.dx + B.y * normal.dy;
    var dotE = E.x * normal.dx + E.y * normal.dy;
    var dotF = F.x * normal.dx + F.y * normal.dy;

    var crossA = A.x * direction.dx + A.y * direction.dy;
    var crossB = B.x * direction.dx + B.y * direction.dy;
    var crossE = E.x * direction.dx + E.y * direction.dy;
    var crossF = F.x * direction.dx + F.y * direction.dy;



    var ABmin = Math.min(dotA, dotB);
    var ABmax = Math.max(dotA, dotB);

    var EFmax = Math.max(dotE, dotF);
    var EFmin = Math.min(dotE, dotF);

    // segments that will merely touch at one point
    if (
      GeometryUtil.almostEqual(ABmax, EFmin, TOL) ||
      GeometryUtil.almostEqual(ABmin, EFmax, TOL)
    ) {
      return null;
    }
    // segments miss eachother completely
    if (ABmax < EFmin || ABmin > EFmax) {
      return null;
    }

    var overlap;

    if ((ABmax > EFmax && ABmin < EFmin) || (EFmax > ABmax && EFmin < ABmin)) {
      overlap = 1;
    } else {
      var minMax = Math.min(ABmax, EFmax);
      var maxMin = Math.max(ABmin, EFmin);

      var maxMax = Math.max(ABmax, EFmax);
      var minMin = Math.min(ABmin, EFmin);

      overlap = (minMax - maxMin) / (maxMax - minMin);
    }

    var crossABE = (E.y - A.y) * (B.x - A.x) - (E.x - A.x) * (B.y - A.y);
    var crossABF = (F.y - A.y) * (B.x - A.x) - (F.x - A.x) * (B.y - A.y);

    // lines are colinear
    if (
      GeometryUtil.almostEqual(crossABE, 0) &&
      GeometryUtil.almostEqual(crossABF, 0)
    ) {
      var ABnorm = new Vector(B.y - A.y, A.x - B.x).normalized();
      var EFnorm = new Vector(F.y - E.y, E.x - F.x).normalized();

      // segment normals must point in opposite directions
      if (
        Math.abs(ABnorm.dy * EFnorm.dx - ABnorm.dx * EFnorm.dy) < TOL &&
        ABnorm.dy * EFnorm.dy + ABnorm.dx * EFnorm.dx < 0
      ) {
        // normal of AB segment must point in same direction as given direction vector
        var normdot = ABnorm.dy * direction.dy + ABnorm.dx * direction.dx;
        // the segments merely slide along eachother
        if (GeometryUtil.almostEqual(normdot, 0, TOL)) {
          return null;
        }
        if (normdot < 0) {
          return 0;
        }
      }
      return null;
    }

    var distances = [];

    // coincident points
    if (GeometryUtil.almostEqual(dotA, dotE)) {
      distances.push(crossA - crossE);
    } else if (GeometryUtil.almostEqual(dotA, dotF)) {
      distances.push(crossA - crossF);
    } else if (dotA > EFmin && dotA < EFmax) {
      var d = this.pointDistance(A, E, F, reverse);
      if (d !== null && GeometryUtil.almostEqual(d, 0)) {
        //  A currently touches EF, but AB is moving away from EF
        var dB = this.pointDistance(B, E, F, reverse, true);
        if (dB == null || dB < 0 || GeometryUtil.almostEqual(dB * overlap, 0)) {
          d = null;
        }
      }
      if (d !== null) {
        distances.push(d);
      }
    }

    if (GeometryUtil.almostEqual(dotB, dotE)) {
      distances.push(crossB - crossE);
    } else if (GeometryUtil.almostEqual(dotB, dotF)) {
      distances.push(crossB - crossF);
    } else if (dotB > EFmin && dotB < EFmax) {
      var d = this.pointDistance(B, E, F, reverse);

      if (d !== null && GeometryUtil.almostEqual(d, 0)) {
        // crossA>crossB A currently touches EF, but AB is moving away from EF
        var dA = this.pointDistance(A, E, F, reverse, true);
        if (dA == null || dA < 0 || GeometryUtil.almostEqual(dA * overlap, 0)) {
          d = null;
        }
      }
      if (d !== null) {
        distances.push(d);
      }
    }

    if (dotE > ABmin && dotE < ABmax) {
      var d = this.pointDistance(E, A, B, direction);
      if (d !== null && GeometryUtil.almostEqual(d, 0)) {
        // crossF<crossE A currently touches EF, but AB is moving away from EF
        var dF = this.pointDistance(F, A, B, direction, true);
        if (dF == null || dF < 0 || GeometryUtil.almostEqual(dF * overlap, 0)) {
          d = null;
        }
      }
      if (d !== null) {
        distances.push(d);
      }
    }

    if (dotF > ABmin && dotF < ABmax) {
      var d = this.pointDistance(F, A, B, direction);
      if (d !== null && GeometryUtil.almostEqual(d, 0)) {
        // && crossE<crossF A currently touches EF, but AB is moving away from EF
        var dE = this.pointDistance(E, A, B, direction, true);
        if (dE == null || dE < 0 || GeometryUtil.almostEqual(dE * overlap, 0)) {
          d = null;
        }
      }
      if (d !== null) {
        distances.push(d);
      }
    }

    if (distances.length == 0) {
      return null;
    }

    return Math.min.apply(Math, distances);
  }

  static polygonSlideDistance(
    Ap: Polygon,
    Bp: Polygon,
    direction: Vector,
    ignoreNegative: boolean
  ): number | null {
    var Aoffsetx = 0;
    var Aoffsety = 0;
    var Boffsetx = 0;
    var Boffsety = 0;

    var A = Ap.points.slice(0);
    var B = Bp.points.slice(0);

    // close the loop for polygons
    if (A[0] != A[A.length - 1]) {
      A.push(A[0]);
    }

    if (B[0] != B[B.length - 1]) {
      B.push(B[0]);
    }

    var edgeA = A;
    var edgeB = B;

    var distance = null;

    var dir = direction.normalized();

    for (var i = 0; i < edgeB.length - 1; i++) {
      for (var j = 0; j < edgeA.length - 1; j++) {
        const A1 = new Point(edgeA[j].x + Aoffsetx, edgeA[j].y + Aoffsety);
        const A2 = new Point(
          edgeA[j + 1].x + Aoffsetx,
          edgeA[j + 1].y + Aoffsety
        );
        const B1 = new Point(edgeB[i].x + Boffsetx, edgeB[i].y + Boffsety);
        const B2 = new Point(
          edgeB[i + 1].x + Boffsetx,
          edgeB[i + 1].y + Boffsety
        );

        if (
          (GeometryUtil.almostEqual(A1.x, A2.x) &&
            GeometryUtil.almostEqual(A1.y, A2.y)) ||
          (GeometryUtil.almostEqual(B1.x, B2.x) &&
            GeometryUtil.almostEqual(B1.y, B2.y))
        ) {
          continue; // ignore extremely small lines
        }

        const d = this.segmentDistance(A1, A2, B1, B2, dir);

        if (d !== null && (distance === null || d < distance)) {
          if (!ignoreNegative || d > 0 || GeometryUtil.almostEqual(d, 0)) {
            distance = d;
          }
        }
      }
    }
    return distance;
  }

  // project each point of B onto A in the given direction, and return the
  static polygonProjectionDistance(
    Ap: Polygon,
    Bp: Polygon,
    direction: Vector
  ): number | null {
    var A = Ap.points.slice(0);
    var B = Bp.points.slice(0);

    // close the loop for polygons
    if (A[0] != A[A.length - 1]) {
      A.push(A[0]);
    }

    if (B[0] != B[B.length - 1]) {
      B.push(B[0]);
    }

    var edgeA = A;
    var edgeB = B;

    var distance = null;

    for (var i = 0; i < edgeB.length; i++) {
      // the shortest/most negative projection of B onto A
      var minprojection = null;
      for (var j = 0; j < edgeA.length - 1; j++) {
        const p = edgeB[i];
        const s1 = edgeA[j];
        const s2 = edgeA[j + 1];

        if (
          Math.abs(
            (s2.y - s1.y) * direction.dx - (s2.x - s1.x) * direction.dy
          ) < TOL
        ) {
          continue;
        }

        // project point, ignore edge boundaries
        const d = this.pointDistance(p, s1, s2, direction);

        if (d !== null && (minprojection === null || d < minprojection)) {
          minprojection = d;
        }
      }
      if (
        minprojection !== null &&
        (distance === null || minprojection > distance)
      ) {
        distance = minprojection;
      }
    }

    return distance;
  }

  static isRectangle(poly: Polygon, tolerance?: number): boolean {
    var bb = poly.getBounds();
    tolerance = tolerance || TOL;

    for (var i = 0; i < poly.points.length; i++) {
      if (
        !GeometryUtil.almostEqual(poly.points[i].x, bb.x) &&
        !GeometryUtil.almostEqual(poly.points[i].x, bb.x + bb.width)
      ) {
        return false;
      }
      if (
        !GeometryUtil.almostEqual(poly.points[i].y, bb.y) &&
        !GeometryUtil.almostEqual(poly.points[i].y, bb.y + bb.height)
      ) {
        return false;
      }
    }

    return true;
  }
}
