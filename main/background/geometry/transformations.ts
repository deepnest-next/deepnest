import type { Point, Polygon, PolygonWithChildren } from "../types/index.js";
import { HullPolygon } from "../../util/HullPolygon.js";
import { Point as PointClass } from "../../util/point.js";

/**
 * Translates a polygon by the specified offset vector.
 *
 * @param {Polygon} p - Polygon to shift (array of {x, y} points)
 * @param {Object} shift - Offset vector with x and y properties
 * @param {number} shift.x - X-axis translation amount
 * @param {number} shift.y - Y-axis translation amount
 * @return {Polygon} New polygon with all points translated by the offset
 *
 * This is a non-destructive operation. Recursively shifts any child polygons (holes).
 */
export function shiftPolygon(
  p: Polygon,
  shift: { x: number; y: number },
): Polygon {
  const shifted: Point[] = [];
  for (let i = 0; i < p.length; i++) {
    shifted.push({
      x: p[i].x + shift.x,
      y: p[i].y + shift.y,
      exact: p[i].exact,
    });
  }

  if (p.children && p.children.length) {
    (shifted as PolygonWithChildren).children = [];
    for (let i = 0; i < p.children.length; i++) {
      (shifted as PolygonWithChildren).children!.push(
        shiftPolygon(p.children[i], shift),
      );
    }
  }

  return shifted as Polygon;
}

/**
 * Rotates a polygon by a specified angle around the origin (0, 0).
 *
 * @param {Polygon} polygon - Polygon to rotate (array of {x, y} points)
 * @param {number} degrees - Rotation angle in degrees (positive = counter-clockwise)
 * @return {Polygon} New polygon with all points rotated by the specified angle
 *
 * Uses standard 2D rotation matrix transformation:
 * x' = x*cos(θ) - y*sin(θ)
 * y' = x*sin(θ) + y*cos(θ)
 *
 * This is a non-destructive operation. Recursively rotates any child polygons (holes).
 */
export function rotatePolygon(polygon: Polygon, degrees: number): Polygon {
  const rotated: Point[] = [];
  // Convert degrees to radians: multiply by π/180
  // Standard mathematical conversion required for trigonometric functions
  const angle = (degrees * Math.PI) / 180;
  for (let i = 0; i < polygon.length; i++) {
    const x = polygon[i].x;
    const y = polygon[i].y;
    const x1 = x * Math.cos(angle) - y * Math.sin(angle);
    const y1 = x * Math.sin(angle) + y * Math.cos(angle);

    rotated.push({ x: x1, y: y1, exact: polygon[i].exact });
  }

  if (polygon.children && polygon.children.length > 0) {
    (rotated as PolygonWithChildren).children = [];
    for (let j = 0; j < polygon.children.length; j++) {
      (rotated as PolygonWithChildren).children!.push(
        rotatePolygon(polygon.children[j], degrees),
      );
    }
  }

  return rotated as Polygon;
}

/**
 * Computes the convex hull of a polygon.
 *
 * @param {Polygon} polygon - Polygon to compute hull for (array of {x, y} points)
 * @return {Polygon} Convex hull polygon, or original polygon if hull calculation fails
 *
 * Uses the HullPolygon utility to compute the convex hull. If the hull calculation
 * fails (returns null), the original polygon is returned unchanged.
 */
export function getHull(polygon: Polygon): Polygon {
  // Convert the polygon points to proper Point objects for HullPolygon
  const points: PointClass[] = [];
  for (let i = 0; i < polygon.length; i++) {
    points.push(new PointClass(polygon[i].x, polygon[i].y));
  }

  const hullpoints = HullPolygon.hull(points);

  // If hull calculation failed, return original polygon
  if (!hullpoints) {
    return polygon;
  }

  return hullpoints as Polygon;
}
