import { Vector } from "./vector.js";

/**
 * Represents a 2D point with x and y coordinates.
 * Used throughout the nesting engine for geometric calculations.
 * 
 * @example
 * ```typescript
 * const point = new Point(10, 20);
 * const distance = point.distanceTo(new Point(0, 0));
 * console.log(distance); // 22.36
 * ```
 */
export class Point {
  /** X coordinate of the point */
  x: number;
  /** Y coordinate of the point */
  y: number;
  /** Optional marker for NFP (No-Fit Polygon) generation algorithms */
  marked?: boolean;
  
  /**
   * Creates a new Point instance.
   * 
   * @param x - The x coordinate
   * @param y - The y coordinate
   * @throws {Error} If either coordinate is NaN
   * 
   * @example
   * ```typescript
   * const origin = new Point(0, 0);
   * const point = new Point(10.5, -20.3);
   * ```
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw new Error();
    }
  }

  /**
   * Calculates the squared distance to another point.
   * More efficient than distanceTo when you only need to compare distances.
   * 
   * @param other - The other point to calculate distance to
   * @returns The squared distance between this point and the other point
   * 
   * @example
   * ```typescript
   * const p1 = new Point(0, 0);
   * const p2 = new Point(3, 4);
   * const sqDist = p1.squaredDistanceTo(p2); // 25
   * ```
   */
  squaredDistanceTo(other: Point): number {
    return (this.x - other.x) ** 2 + (this.y - other.y) ** 2;
  }

  /**
   * Calculates the Euclidean distance to another point.
   * 
   * @param other - The other point to calculate distance to
   * @returns The distance between this point and the other point
   * 
   * @example
   * ```typescript
   * const p1 = new Point(0, 0);
   * const p2 = new Point(3, 4);
   * const distance = p1.distanceTo(p2); // 5
   * ```
   */
  distanceTo(other: Point): number {
    return Math.sqrt(this.squaredDistanceTo(other));
  }

  /**
   * Checks if this point is within a specified distance of another point.
   * More efficient than calculating the actual distance.
   * 
   * @param other - The other point to check distance to
   * @param distance - The maximum distance threshold
   * @returns True if the points are within the specified distance
   * 
   * @example
   * ```typescript
   * const p1 = new Point(0, 0);
   * const p2 = new Point(3, 4);
   * const isClose = p1.withinDistance(p2, 6); // true
   * const isFar = p1.withinDistance(p2, 4); // false
   * ```
   */
  withinDistance(other: Point, distance: number): boolean {
    return this.squaredDistanceTo(other) < distance * distance;
  }

  /**
   * Creates a new point by adding the specified offsets to this point's coordinates.
   * 
   * @param dx - The x offset to add
   * @param dy - The y offset to add
   * @returns A new Point with the offset coordinates
   * 
   * @example
   * ```typescript
   * const point = new Point(10, 20);
   * const offset = point.plus(5, -3); // Point(15, 17)
   * ```
   */
  plus(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }

  /**
   * Creates a vector from this point to another point.
   * 
   * @param other - The destination point
   * @returns A Vector representing the direction and distance from this point to the other
   * 
   * @example
   * ```typescript
   * const start = new Point(0, 0);
   * const end = new Point(3, 4);
   * const vector = start.to(end); // Vector(3, 4)
   * ```
   */
  to(other: Point): Vector {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  /**
   * Calculates the midpoint between this point and another point.
   * 
   * @param other - The other point
   * @returns A new Point representing the midpoint
   * 
   * @example
   * ```typescript
   * const p1 = new Point(0, 0);
   * const p2 = new Point(10, 20);
   * const mid = p1.midpoint(p2); // Point(5, 10)
   * ```
   */
  midpoint(other: Point): Point {
    return new Point((this.x + other.x) / 2, (this.y + other.y) / 2);
  }

  /**
   * Checks if this point is exactly equal to another point.
   * 
   * @param obj - The other point to compare with
   * @returns True if both x and y coordinates are exactly equal
   * 
   * @example
   * ```typescript
   * const p1 = new Point(1, 2);
   * const p2 = new Point(1, 2);
   * const p3 = new Point(1, 3);
   * console.log(p1.equals(p2)); // true
   * console.log(p1.equals(p3)); // false
   * ```
   */
  public equals(obj: Point): boolean {
    return this.x === obj.x && this.y === obj.y;
  }

  /**
   * Returns a string representation of this point.
   * 
   * @returns A formatted string showing the x and y coordinates
   * 
   * @example
   * ```typescript
   * const point = new Point(10.567, -20.123);
   * console.log(point.toString()); // "<10.6, -20.1>"
   * ```
   */
  public toString(): string {
    return "<" + this.x.toFixed(1) + ", " + this.y.toFixed(1) + ">";
  }
}
