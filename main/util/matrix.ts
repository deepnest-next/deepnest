/**
 * Matrix transformation utility for SVG transformations
 * Handles 2D affine transformations including translate, scale, rotate, skew, and matrix operations
 * Based on SVG transform attribute format: matrix(a,b,c,d,e,f)
 */

import { Point } from "./point.js";

/**
 * Base interface for transformation operations
 */
interface Transformation {
  /**
   * Return the 6-element matrix representation
   * Format: [a, b, c, d, e, f] corresponding to SVG transform matrix
   * @returns Array of 6 numbers representing the transformation matrix
   * @sideEffect None
   */
  matrix6(): Array<number>;
}

/**
 * Translation transformation
 * Moves elements by tx in x direction and ty in y direction
 */
class Translate implements Transformation {
  type: "translate";
  /** X translation amount */
  tx: number;
  /** Y translation amount */
  ty: number;

  /**
   * Create a translation transformation
   * @param tx - X translation amount
   * @param ty - Y translation amount
   */
  constructor(tx: number, ty: number) {
    this.tx = tx;
    this.ty = ty;
    this.type = "translate";
  }

  /**
   * Get 6-element matrix representation
   * @returns [1, 0, 0, 1, tx, ty]
   * @sideEffect None
   */
  matrix6() {
    return [1, 0, 0, 1, this.tx, this.ty];
  }
}

/**
 * Scale transformation
 * Scales elements by sx in x direction and sy in y direction
 */
class Scale implements Transformation {
  type: "scale";
  /** X scaling factor */
  sx: number;
  /** Y scaling factor */
  sy: number;

  /**
   * Create a scale transformation
   * @param sx - X scaling factor
   * @param sy - Y scaling factor
   */
  constructor(sx: number, sy: number) {
    this.sx = sx;
    this.sy = sy;
    this.type = "scale";
  }

  /**
   * Get 6-element matrix representation
   * @returns [sx, 0, 0, sy, 0, 0]
   * @sideEffect None
   */
  matrix6() {
    return [this.sx, 0, 0, this.sy, 0, 0];
  }
}

/**
 * Rotation transformation
 * Rotates elements clockwise around the origin
 */
class Rotate implements Transformation {
  type: "rotate";
  /** Rotation angle in degrees (clockwise) */
  angle: number;

  /**
   * Create a rotation transformation
   * @param angle - Rotation angle in degrees (clockwise)
   */
  constructor(angle: number) {
    this.angle = angle;
    this.type = "rotate";
  }

  /**
   * Get 6-element matrix representation
   * Converts degrees to radians and calculates cos/sin
   * @returns [cos, sin, -sin, cos, 0, 0]
   * @sideEffect None
   */
  matrix6() {
    const rad = (this.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [cos, sin, -sin, cos, 0, 0];
  }
}

/**
 * X-axis skew transformation
 * Skews elements along the X axis by the specified angle
 */
class SkewX implements Transformation {
  type: "skewx";
  /** Skew angle in degrees */
  angle: number;

  /**
   * Create an X-axis skew transformation
   * @param angle - Skew angle in degrees
   */
  constructor(angle: number) {
    this.angle = angle;
    this.type = "skewx";
  }

  /**
   * Get 6-element matrix representation
   * @returns [1, 0, tan(angle), 1, 0, 0]
   * @sideEffect None
   */
  matrix6() {
    return [1, 0, Math.tan((this.angle * Math.PI) / 180), 1, 0, 0];
  }
}

/**
 * Y-axis skew transformation
 * Skews elements along the Y axis by the specified angle
 */
class SkewY implements Transformation {
  type: "skewy";
  /** Skew angle in degrees */
  angle: number;

  /**
   * Create a Y-axis skew transformation
   * @param angle - Skew angle in degrees
   */
  constructor(angle: number) {
    this.angle = angle;
    this.type = "skewy";
  }

  /**
   * Get 6-element matrix representation
   * @returns [1, tan(angle), 0, 1, 0, 0]
   * @sideEffect None
   */
  matrix6() {
    return [1, Math.tan((this.angle * Math.PI) / 180), 0, 1, 0, 0];
  }
}

/**
 * Arbitrary matrix transformation
 * Allows specifying a custom 6-element transformation matrix
 */
class ArbitraryMatrix implements Transformation {
  type: "matrix";
  /** Matrix data: [a, b, c, d, e, f] */
  matrix: Array<number>;

  /**
   * Create an arbitrary matrix transformation
   * @param matrix - Optional array of 6 numbers for matrix values
   * @throws RangeError if matrix does not contain exactly 6 elements
   */
  constructor(matrix?: Array<number>) {
    if (matrix?.length != 6) {
      throw new RangeError(
        "Matrix data must contain exactly six values, got " + matrix,
      );
    }
    this.matrix = matrix ?? [1, 0, 0, 1, 0, 0];
    this.type = "matrix";
  }

  /**
   * Get 6-element matrix representation
   * @returns The matrix array
   * @sideEffect None
   */
  matrix6() {
    return this.matrix;
  }
}

/**
 * Matrix transformation builder for SVG coordinate systems
 * Provides fluent API for chaining 2D affine transformations
 */
export class Matrix {
  /** Base matrix values: [a, b, c, d, e, f] - identity by default */
  v: Array<number>;

  /** Queue of transformations to apply in order */
  queue: Array<Transformation> = [];

  /** Cached combined matrix - null when dirty */
  cache: Array<number> | null = null;

  /**
   * Create a new Matrix instance
   * @param v - Optional initial matrix values (defaults to identity matrix [1,0,0,1,0,0])
   */
  constructor(v?: Array<number>) {
    this.v = v || [1, 0, 0, 1, 0, 0];
  }

  /**
   * Create a deep clone of this Matrix instance
   * @returns A new Matrix with a copy of the transformation queue
   * @sideEffect None
   */
  clone(): Matrix {
    const result = new Matrix();
    result.queue = this.queue.slice();
    return result;
  }

  /**
   * Check if a matrix represents the identity transformation
   * @param m - Matrix array to check [a, b, c, d, e, f]
   * @returns True if matrix is identity [1, 0, 0, 1, 0, 0]
   * @sideEffect None
   */
  static isIdentityMatrix(m: Array<number>): boolean {
    return (
      m[0] === 1 &&
      m[1] === 0 &&
      m[2] === 0 &&
      m[3] === 1 &&
      m[4] === 0 &&
      m[5] === 0
    );
  }

  /**
   * Check if this Matrix is currently the identity transformation
   * @returns True if transformation has no effect
   * @sideEffect None
   */
  isIdentity(): boolean {
    if (!this.cache) {
      this.cache = this.toArray();
    }

    return Matrix.isIdentityMatrix(this.cache);
  }

  /**
   * Add a transformation to the queue
   * @param m - Transformation or array to add
   * @returns This Matrix instance for chaining
   * @sideEffect Invalidates cache, modifies queue
   */
  matrix(m: Array<number>): Matrix;
  matrix(m: ArbitraryMatrix): Matrix;
  matrix(m: Transformation): Matrix {
    this.cache = null;
    if (Array.isArray(m)) {
      return this.matrix(new ArbitraryMatrix(m));
    } else {
      if (Matrix.isIdentityMatrix(m)) {
        return this;
      }
      this.queue.push(m);
      return this;
    }
  }

  /**
   * Add a translation to the transformation queue
   * @param tx - X translation amount
   * @param ty - Y translation amount
   * @returns This Matrix instance for chaining
   * @sideEffect Invalidates cache, modifies queue
   */
  translate(tx: number, ty: number): Matrix {
    if (tx !== 0 || ty !== 0) {
      this.cache = null;
      this.queue.push(new Translate(tx, ty));
    }
    return this;
  }

  /**
   * Add a scale transformation to the queue
   * @param sx - X scaling factor
   * @param sy - Y scaling factor
   * @returns This Matrix instance for chaining
   * @sideEffect Invalidates cache, modifies queue
   */
  scale(sx: number, sy: number): Matrix {
    if (sx !== 1 || sy !== 1) {
      this.cache = null;
      this.queue.push(new Scale(sx, sy));
    }
    return this;
  }

  /**
   * Add a rotation around a specific point to the queue
   * @param angle - Rotation angle in degrees (clockwise)
   * @param rx - Rotation center X coordinate
   * @param ry - Rotation center Y coordinate
   * @returns This Matrix instance for chaining
   * @sideEffect Invalidates cache, modifies queue with translate+rotate+translate pattern
   */
  rotate(angle: number, rx: number, ry: number): Matrix {
    if (angle !== 0) {
      this.translate(rx, ry);
      this.queue.push(new Rotate(angle));
      this.cache = null;

      this.translate(-rx, -ry);
    }
    return this;
  }

  /**
   * Add an X-axis skew to the queue
   * @param angle - Skew angle in degrees
   * @returns This Matrix instance for chaining
   * @sideEffect Invalidates cache, modifies queue
   */
  skewX(angle: number): Matrix {
    if (angle !== 0) {
      this.cache = null;
      this.queue.push(new SkewX(angle));
    }
    return this;
  }

  /**
   * Add a Y-axis skew to the queue
   * @param angle - Skew angle in degrees
   * @returns This Matrix instance for chaining
   * @sideEffect Invalidates cache, modifies queue
   */
  skewY(angle: number): Matrix {
    if (angle !== 0) {
      this.cache = null;
      this.queue.push(new SkewY(angle));
    }
    return this;
  }

  /**
   * Flatten all queued transformations into a single matrix
   * Combines all transformations in queue using matrix multiplication
   * @returns Combined matrix as 6-element array
   * @sideEffect Updates cache
   */
  toArray(): Array<number> {
    if (this.cache) {
      return this.cache;
    }

    let cache = this.v;
    this.queue.forEach(
      (item) => (cache = Matrix.combine(cache, item.matrix6())),
    );

    this.cache = cache;
    return this.cache;
  }

  /**
   * Apply this transformation to a Point
   * @param point - The point to transform
   * @param isRelative - If true, skip translation component (relative transform)
   * @returns A new Point at the transformed coordinates
   * @sideEffect None (returns new Point, doesn't modify input)
   */
  calc(point: Point, isRelative?: boolean): Point {
    // Don't change point on empty transforms queue
    if (!this.queue.length) {
      return point;
    }

    // Calculate final matrix, if not exists
    if (!this.cache) {
      this.cache = this.toArray();
    }

    const m = this.cache;

    // Apply matrix to point
    return new Point(
      point.x * m[0] + point.y * m[2] + (isRelative ? 0 : m[4]),
      point.x * m[1] + point.y * m[3] + (isRelative ? 0 : m[5]),
    );
  }

  /**
   * Combine two transformation matrices
   * Matrix multiplication: result = m1 × m2
   * @param m1 - First matrix [a1, b1, c1, d1, e1, f1]
   * @param m2 - Second matrix [a2, b2, c2, d2, e2, f2]
   * @returns Combined matrix [a, b, c, d, e, f]
   * @sideEffect None
   */
  static combine(m1: Array<number>, m2: Array<number>): Array<number> {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
  }

  /**
   * Parse and apply an SVG transform string
   * Supports: matrix, translate, scale, rotate, skewX, skewY
   * @param transformString - SVG transform attribute value (e.g., "translate(10 50) rotate(45)")
   * @returns This Matrix instance for chaining
   * @sideEffect Invalidates cache, modifies queue by appending parsed transformations
   */
  applyTransformString(transformString: string): Matrix {
    if (!transformString) return this;

    const operations = {
      matrix: true,
      scale: true,
      rotate: true,
      translate: true,
      skewX: true,
      skewY: true,
    };

    const CMD_SPLIT_RE =
      /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
    const PARAMS_SPLIT_RE = /[\s,]+/;

    let cmd: string = "";
    let params: Array<number>;

    // Split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate', '-45', '']
    for (const item of transformString.split(CMD_SPLIT_RE)) {
      // Skip empty elements
      if (!item.length) {
        continue;
      }

      // remember operation
      if (Object.prototype.hasOwnProperty.call(operations, item)) {
        cmd = item;
        continue;
      }

      // extract params & apply operation to matrix
      params = item.split(PARAMS_SPLIT_RE).map(function (i) {
        return +i || 0;
      });

      // If params count is not correct - ignore command
      switch (cmd) {
        case "matrix":
          if (params.length === 6) {
            this.matrix(new ArbitraryMatrix(params));
          }
          break;

        case "scale":
          if (params.length === 1) {
            this.scale(params[0], params[0]);
          } else if (params.length === 2) {
            this.scale(params[0], params[1]);
          }
          break;

        case "rotate":
          if (params.length === 1) {
            this.rotate(params[0], 0, 0);
          } else if (params.length === 3) {
            this.rotate(params[0], params[1], params[2]);
          }
          break;

        case "translate":
          if (params.length === 1) {
            this.translate(params[0], 0);
          } else if (params.length === 2) {
            this.translate(params[0], params[1]);
          }
          break;

        case "skewX":
          if (params.length === 1) {
            this.skewX(params[0]);
          }
          break;

        case "skewY":
          if (params.length === 1) {
            this.skewY(params[0]);
          }
          break;
      }
    }

    return this;
  }

  /**
   * Apply this transformation to an array of Points
   * @param points - Array of Points to transform
   * @returns New array of Points with transformed coordinates
   * @sideEffect None (returns new array, doesn't modify input)
   */
  apply(points: Array<Point>): Array<Point> {
    return points.map((p) => this.calc(p));
  }
}
