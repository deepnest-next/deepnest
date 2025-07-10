import { GEOMETRIC_TOLERANCE } from "./constants.js";

function _almostEqual(a: number, b: number, tolerance?: number) {
  if (!tolerance) {
    tolerance = GEOMETRIC_TOLERANCE;
  }
  return Math.abs(a - b) < tolerance;
}

export class Vector {
  dx: number;
  dy: number;
  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }

  dot(other: Vector): number {
    return this.dx * other.dx + this.dy * other.dy;
  }
  squaredLength(): number {
    return this.dx * this.dx + this.dy * this.dy;
  }
  length(): number {
    return Math.sqrt(this.squaredLength());
  }
  scaled(scale: number): Vector {
    return new Vector(this.dx * scale, this.dy * scale);
  }

  normalized(): Vector {
    const sqLen = this.squaredLength();
    if (_almostEqual(sqLen, 1)) {
      return this; // given vector was already a unit vector
    }
    const len = Math.sqrt(sqLen);
    return new Vector(this.dx / len, this.dy / len);
  }
}
