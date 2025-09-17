// based on https://d3js.org/d3-polygon/ Version 1.0.2.

import { Point } from "./point.js";
import { Polygon } from "./polygon.js";

// Type definition for a polygon (array of points) - keeping for backwards compatibility
type PolygonArray = Point[];

// Type for points with index used in hull calculation
interface IndexedPoint {
  x: number;
  y: number;
  index: number;
}

/**
 * A class providing polygon operations like area calculation, centroid, hull, etc.
 */
export class HullPolygon {
  /**
   * Returns the signed area of the specified polygon.
   */
  public static area(polygon: Polygon | PolygonArray): number {
    if (polygon instanceof Polygon) {
      return polygon.area();
    }
    
    let i = -1;
    const n = polygon.length;
    let a: Point;
    let b = polygon[n - 1];
    let area = 0;

    while (++i < n) {
      a = b;
      b = polygon[i];
      area += a.y * b.x - a.x * b.y;
    }

    return area / 2;
  }

  /**
   * Returns the centroid of the specified polygon.
   */
  public static centroid(polygon: Polygon | PolygonArray): Point {
    if (polygon instanceof Polygon) {
      return polygon.centroid();
    }
    
    let i = -1;
    const n = polygon.length;
    let x = 0;
    let y = 0;
    let a: Point;
    let b = polygon[n - 1];
    let c: number;
    let k = 0;

    while (++i < n) {
      a = b;
      b = polygon[i];
      k += c = a.x * b.y - b.x * a.y;
      x += (a.x + b.x) * c;
      y += (a.y + b.y) * c;
    }

    k *= 3;
    return new Point(x / k, y / k);
  }

  /**
   * Returns the convex hull of the specified points.
   * The returned hull is represented as a new Polygon
   * arranged in counterclockwise order.
   */
  public static hull(points: Polygon | PolygonArray): Polygon | null {
    const pointArray = points instanceof Polygon ? points.points : points;
    const n = pointArray.length;
    if (n < 3) return null;

    let i: number;
    const sortedPoints: IndexedPoint[] = new Array(n);
    const flippedPoints: IndexedPoint[] = new Array(n);

    for (i = 0; i < n; ++i) {
      sortedPoints[i] = {
        x: pointArray[i].x,
        y: pointArray[i].y,
        index: i,
      };
    }

    sortedPoints.sort(HullPolygon.lexicographicOrder);

    for (i = 0; i < n; ++i) {
      flippedPoints[i] = {
        x: sortedPoints[i].x,
        y: -sortedPoints[i].y,
        index: i,
      };
    }

    const upperIndexes = HullPolygon.computeUpperHullIndexes(sortedPoints);
    const lowerIndexes = HullPolygon.computeUpperHullIndexes(flippedPoints);

    // Construct the hull polygon, removing possible duplicate endpoints.
    const skipLeft = lowerIndexes[0] === upperIndexes[0];
    const skipRight =
      lowerIndexes[lowerIndexes.length - 1] ===
      upperIndexes[upperIndexes.length - 1];
    const hullPoints: Point[] = [];

    // Add upper hull in right-to-left order.
    // Then add lower hull in left-to-right order.
    for (i = upperIndexes.length - 1; i >= 0; --i)
      hullPoints.push(pointArray[sortedPoints[upperIndexes[i]].index]);
    for (
      i = skipLeft ? 1 : 0;
      i < lowerIndexes.length - (skipRight ? 1 : 0);
      ++i
    )
      hullPoints.push(pointArray[sortedPoints[lowerIndexes[i]].index]);

    return new Polygon(hullPoints);
  }

  /**
   * Returns true if and only if the specified point is inside the specified polygon.
   */
  public static contains(polygon: Polygon | PolygonArray, point: Point): boolean {
    if (polygon instanceof Polygon) {
      const result = polygon.contains(point);
      return result === true; // convert null to false
    }
    
    const n = polygon.length;
    let p = polygon[n - 1];
    const x = point.x;
    const y = point.y;
    let x0 = p.x;
    let y0 = p.y;
    let x1: number;
    let y1: number;
    let inside = false;

    for (let i = 0; i < n; ++i) {
      p = polygon[i];
      x1 = p.x;
      y1 = p.y;
      if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1)
        inside = !inside;
      x0 = x1;
      y0 = y1;
    }

    return inside;
  }

  /**
   * Returns the length of the perimeter of the specified polygon.
   */
  public static length(polygon: Polygon | PolygonArray): number {
    if (polygon instanceof Polygon) {
      return polygon.perimeter();
    }
    
    let i = -1;
    const n = polygon.length;
    let b = polygon[n - 1];
    let xa: number;
    let ya: number;
    let xb = b.x;
    let yb = b.y;
    let perimeter = 0;

    while (++i < n) {
      xa = xb;
      ya = yb;
      b = polygon[i];
      xb = b.x;
      yb = b.y;
      xa -= xb;
      ya -= yb;
      perimeter += Math.hypot(xa, ya);
    }

    return perimeter;
  }

  /**
   * Returns the 2D cross product of AB and AC vectors, i.e., the z-component of
   * the 3D cross product in a quadrant I Cartesian coordinate system (+x is
   * right, +y is up). Returns a positive value if ABC is counter-clockwise,
   * negative if clockwise, and zero if the points are collinear.
   */
  private static cross(a: Point, b: Point, c: Point): number {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  /**
   * Lexicographically compares two points.
   */
  private static lexicographicOrder(a: IndexedPoint, b: IndexedPoint): number {
    return a.x - b.x || a.y - b.y;
  }

  /**
   * Computes the upper convex hull per the monotone chain algorithm.
   * Assumes points.length >= 3, is sorted by x, unique in y.
   * Returns an array of indices into points in left-to-right order.
   */
  private static computeUpperHullIndexes(points: IndexedPoint[]): number[] {
    const n = points.length;
    const indexes = [0, 1];
    let size = 2;

    for (let i = 2; i < n; ++i) {
      while (
        size > 1 &&
        HullPolygon.cross(
          new Point(points[indexes[size - 2]].x, points[indexes[size - 2]].y),
          new Point(points[indexes[size - 1]].x, points[indexes[size - 1]].y),
          new Point(points[i].x, points[i].y),
        ) <= 0
      )
        --size;
      indexes[size++] = i;
    }

    return indexes.slice(0, size); // remove popped points
  }
}
