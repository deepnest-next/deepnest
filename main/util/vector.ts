/**
 * Vector utility for 2D geometric calculations
 * Provides operations on 2D vectors including dot product, length, scaling, and normalization
 */

/** Floating point comparison tolerance - accounts for floating point arithmetic errors */
const TOL = Math.pow(10, -9);

/**
 * Compare two numbers with tolerance for floating point arithmetic
 * @param a - First number to compare
 * @param b - Second number to compare
 * @param tolerance - Optional comparison tolerance (defaults to TOL)
 * @returns True if absolute difference is less than tolerance
 * @sideEffect None
 */
function _almostEqual(a: number, b: number, tolerance?: number) {
  if (!tolerance) {
    tolerance = TOL;
  }
  return Math.abs(a - b) < tolerance;
}

/**
 * 2D Vector class for geometric calculations
 * Represents a direction and magnitude in 2D space
 */
export class Vector {
  /** X component of the vector */
  dx: number;

  /** Y component of the vector */
  dy: number;

  /**
   * Create a new Vector instance
   * @param dx - X component
   * @param dy - Y component
   */
  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }

  /**
   * Calculate dot product with another vector
   * @param other - The other vector
   * @returns The dot product (a · b = |a||b|cosθ)
   * @sideEffect None
   */
  dot(other: Vector): number {
    return this.dx * other.dx + this.dy * other.dy;
  }

  /**
   * Calculate squared length of the vector
   * Faster than length() for comparisons since it avoids sqrt
   * @returns The squared magnitude (|v|²)
   * @sideEffect None
   */
  squaredLength(): number {
    return this.dx * this.dx + this.dy * this.dy;
  }

  /**
   * Calculate Euclidean length (magnitude) of the vector
   * @returns The length of the vector (|v|)
   * @sideEffect None
   */
  length(): number {
    return Math.sqrt(this.squaredLength());
  }

  /**
   * Scale the vector by a scalar factor
   * @param scale - The scaling factor
   * @returns A new Vector with scaled components
   * @sideEffect None
   */
  scaled(scale: number): Vector {
    return new Vector(this.dx * scale, this.dy * scale);
  }

  /**
   * Return a unit vector in the same direction
   * @returns A normalized Vector with length 1
   * @sideEffect None
   */
  normalized(): Vector {
    const sqLen = this.squaredLength();
    if (_almostEqual(sqLen,1)) {
      return this; // given vector was already a unit vector
    }
    const len = Math.sqrt(sqLen);
    return new Vector(this.dx / len, this.dy / len);
  }
}
