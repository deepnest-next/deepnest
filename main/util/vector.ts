/** Floating point comparison tolerance for vector calculations */
const TOL = Math.pow(10, -9); // Floating point error is likely to be above 1 epsilon

/**
 * Compares two floating point numbers for approximate equality.
 * 
 * @param a - First number to compare
 * @param b - Second number to compare
 * @param tolerance - Optional tolerance value (defaults to TOL)
 * @returns True if the numbers are approximately equal within the tolerance
 */
function _almostEqual(a: number, b: number, tolerance?: number) {
  if (!tolerance) {
    tolerance = TOL;
  }
  return Math.abs(a - b) < tolerance;
}

/**
 * Represents a 2D vector with dx and dy components.
 * Used for geometric calculations, transformations, and physics simulations.
 * 
 * @example
 * ```typescript
 * const velocity = new Vector(10, 5);
 * const normalized = velocity.normalized();
 * const dotProduct = velocity.dot(new Vector(1, 0));
 * ```
 */
export class Vector {
  /** The x component of the vector */
  dx: number;
  /** The y component of the vector */
  dy: number;
  
  /**
   * Creates a new Vector instance.
   * 
   * @param dx - The x component of the vector
   * @param dy - The y component of the vector
   * 
   * @example
   * ```typescript
   * const rightVector = new Vector(1, 0);
   * const upVector = new Vector(0, 1);
   * const diagonal = new Vector(1, 1);
   * ```
   */
  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }

  /**
   * Calculates the dot product of this vector and another vector.
   * The dot product is useful for calculating angles and projections.
   * 
   * @param other - The other vector to calculate dot product with
   * @returns The dot product (scalar value)
   * 
   * @example
   * ```typescript
   * const v1 = new Vector(3, 4);
   * const v2 = new Vector(1, 0);
   * const dot = v1.dot(v2); // 3
   * 
   * // Check if vectors are perpendicular
   * const perpendicular = v1.dot(new Vector(-4, 3)) === 0; // true
   * ```
   */
  dot(other: Vector): number {
    return this.dx * other.dx + this.dy * other.dy;
  }

  /**
   * Calculates the squared length (magnitude) of this vector.
   * More efficient than length() when you only need to compare magnitudes.
   * 
   * @returns The squared length of the vector
   * 
   * @example
   * ```typescript
   * const vector = new Vector(3, 4);
   * const squaredLen = vector.squaredLength(); // 25
   * ```
   */
  squaredLength(): number {
    return this.dx * this.dx + this.dy * this.dy;
  }

  /**
   * Calculates the length (magnitude) of this vector.
   * 
   * @returns The length of the vector
   * 
   * @example
   * ```typescript
   * const vector = new Vector(3, 4);
   * const length = vector.length(); // 5
   * ```
   */
  length(): number {
    return Math.sqrt(this.squaredLength());
  }

  /**
   * Creates a new vector by scaling this vector by a factor.
   * 
   * @param scale - The scaling factor
   * @returns A new Vector scaled by the given factor
   * 
   * @example
   * ```typescript
   * const vector = new Vector(2, 3);
   * const doubled = vector.scaled(2); // Vector(4, 6)
   * const reversed = vector.scaled(-1); // Vector(-2, -3)
   * ```
   */
  scaled(scale: number): Vector {
    return new Vector(this.dx * scale, this.dy * scale);
  }

  /**
   * Creates a unit vector (length = 1) pointing in the same direction as this vector.
   * Returns the same vector instance if it's already normalized to avoid unnecessary computation.
   * 
   * @returns A new Vector with length 1, or the same vector if already normalized
   * 
   * @example
   * ```typescript
   * const vector = new Vector(3, 4);
   * const unit = vector.normalized(); // Vector(0.6, 0.8)
   * console.log(unit.length()); // 1
   * 
   * // Already normalized vector returns itself
   * const alreadyUnit = new Vector(1, 0);
   * const stillUnit = alreadyUnit.normalized(); // Same instance
   * ```
   */
  normalized(): Vector {
    const sqLen = this.squaredLength();
    if (_almostEqual(sqLen, 1)) {
      return this; // given vector was already a unit vector
    }
    const len = Math.sqrt(sqLen);
    return new Vector(this.dx / len, this.dy / len);
  }
}
