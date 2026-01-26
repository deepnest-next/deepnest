import type { Point } from "../types/index.js";

/**
 * Clipper coordinate format with uppercase X, Y properties.
 */
export interface ClipperPoint {
  X: number;
  Y: number;
}

/**
 * Converts polygon from nest format (lowercase x, y) to Clipper format (uppercase X, Y).
 *
 * @param {Array} polygon - Polygon in nest format (array of {x, y} points)
 * @return {Array} Polygon in Clipper format (array of {X, Y} points)
 *
 * This is a simple coordinate transformation that prepares polygons for Clipper operations.
 * No scaling is applied here; scaling is handled separately by Clipper's ScaleUpPath function.
 */
export function toClipperCoordinates(polygon: Point[]): ClipperPoint[] {
  const clone: ClipperPoint[] = [];
  for (let i = 0; i < polygon.length; i++) {
    clone.push({
      X: polygon[i].x,
      Y: polygon[i].y,
    });
  }
  return clone;
}

/**
 * Converts polygon from Clipper coordinate format back to nest format.
 *
 * @param {Array} polygon - Polygon in Clipper format (uppercase X, Y)
 * @param {number} scale - Scale factor used when converting to Clipper coordinates (must match original scale)
 * @return {Array} Polygon in nest format (lowercase x, y)
 *
 * This is the inverse operation of toClipperCoordinates, with the addition of
 * scaling down from Clipper's integer coordinate space to our floating point coordinates.
 */
export function toNestCoordinates(
  polygon: ClipperPoint[],
  scale: number,
): Point[] {
  const clone: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    clone.push({
      x: polygon[i].X / scale,
      y: polygon[i].Y / scale,
    });
  }
  return clone;
}
