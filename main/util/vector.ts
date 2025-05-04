// floating point comparison tolerance
var TOL = Math.pow(10, -9); // Floating point error is likely to be above 1 epsilon

function _almostEqual(a: number, b: number, tolerance?: number) {
  if (!tolerance) {
    tolerance = TOL;
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
  length() : number {
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
    var len = Math.sqrt(sqLen);
    return new Vector(this.dx / len, this.dy / len);
  }
}
