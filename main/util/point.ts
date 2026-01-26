import { Vector } from "./vector.js";

/**
 * Represents a 2D point with x and y coordinates.
 * Used throughout the nesting system for polygon vertices and geometric calculations.
 */
export class Point {
  /** X coordinate of the point */
  x: number;

  /** Y coordinate of the point */
  y: number;

  /** Optional marker for NFP (No Fit Polygon) generation - used internally by nesting algorithm */
  marked?: boolean;

  /**
   * Creates a new Point instance.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @throws {Error} If either x or y is NaN
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw new Error();
    }
  }

  /**
   * Calculates the squared Euclidean distance to another point.
   * @param other - The other point to measure distance to
   * @returns The squared distance (no square root, faster for comparisons)
   * @sideEffect None
   */
  squaredDistanceTo(other: Point): number {
    return (this.x - other.x) ** 2 + (this.y - other.y) ** 2;
  }

  /**
   * Calculates the Euclidean distance to another point.
   * @param other - The other point to measure distance to
   * @returns The straight-line distance between points
   * @sideEffect None
   */
  distanceTo(other: Point): number {
    return Math.sqrt(this.squaredDistanceTo(other));
  }

  /**
   * Checks if this point is within a specified distance of another point.
   * @param other - The other point to check distance to
   * @param distance - The maximum distance threshold
   * @returns True if squared distance is less than distance squared
   * @sideEffect None
   */
  withinDistance(other: Point, distance: number): boolean {
    return this.squaredDistanceTo(other) < distance * distance;
  }

  /**
   * Creates a new point offset by dx and dy.
   * @param dx - X offset
   * @param dy - Y offset
   * @returns A new Point at (this.x + dx, this.y + dy)
   * @sideEffect None
   */
  plus(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }

  /**
   * Creates a Vector from this point to another point.
   * @param other - The target point
   * @returns A Vector pointing from other to this
   * @sideEffect None
   */
  to(other: Point): Vector {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  /**
   * Calculates the midpoint between this point and another point.
   * @param other - The other point
   * @returns A new Point at the average of the coordinates
   * @sideEffect None
   */
  midpoint(other: Point): Point {
    return new Point((this.x + other.x) / 2, (this.y + other.y) / 2);
  }

  /**
   * Checks if this point equals another point.
   * @param obj - The point to compare with
   * @returns True if both x and y coordinates are identical
   * @sideEffect None
   */
  public equals(obj: Point): boolean {
    return this.x === obj.x && this.y === obj.y;
  }

  /**
   * Returns a string representation of the point.
   * @returns String in format "<x, y>" with 1 decimal place
   * @sideEffect None
   */
  public toString(): string {
    return "<" + this.x.toFixed(1) + ", " + this.y.toFixed(1) + ">";
  }
}
