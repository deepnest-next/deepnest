import { Vector } from "./vector.js";

export class Point {
  x: number;
  y: number;
  marked?: boolean; // For NFP generation
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw new Error();
    }
  }

  squaredDistanceTo(other: Point): number {
    return (this.x - other.x) ** 2 + (this.y - other.y) ** 2;
  }

  distanceTo(other: Point): number {
    return Math.sqrt(this.squaredDistanceTo(other));
  }

  withinDistance(other: Point, distance: number): boolean {
    return this.squaredDistanceTo(other) < distance * distance;
  }

  plus(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }

  to(other: Point): Vector {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  midpoint(other: Point): Point {
    return new Point((this.x + other.x) / 2, (this.y + other.y) / 2);
  }

  public equals(obj: Point): boolean {
    return this.x === obj.x && this.y === obj.y;
  }
  public toString(): string {
    return "<" + this.x.toFixed(1) + ", " + this.y.toFixed(1) + ">";
  }
}
