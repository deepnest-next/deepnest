import { Point } from "./point";

interface Transformation {
  matrix6(): Array<number>;
}
class Translate implements Transformation {
  type: "translate";
  tx: number;
  ty: number;
  constructor(tx: number, ty: number) {
    this.tx = tx;
    this.ty = ty;
  }
  matrix6() {
    return [1, 0, 0, 1, this.tx, this.ty];
  }
}
class Scale implements Transformation {
  type: "scale";
  sx: number;
  sy: number;
  constructor(sx: number, sy: number) {
    this.sx = sx;
    this.sy = sy;
  }
  matrix6() {
    return [this.sx, 0, 0, this.sy, 0, 0];
  }
}
class Rotate implements Transformation {
  type: "rotate";
  angle: number;
  constructor(angle: number) {
    this.angle = angle;
  }
  matrix6() {
    const rad = (this.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [cos, sin, -sin, cos, 0, 0];
  }
}
class SkewX implements Transformation {
  type: "skewx";
  angle: number;
  constructor(angle: number) {
    this.angle = angle;
  }
  matrix6() {
    return [1, 0, Math.tan((this.angle * Math.PI) / 180), 1, 0, 0];
  }
}
class SkewY implements Transformation {
  type: "skewy";
  angle: number;
  constructor(angle: number) {
    this.angle = angle;
  }
  matrix6() {
    return [1, Math.tan((this.angle * Math.PI) / 180), 0, 1, 0, 0];
  }
}
class ArbitraryMatrix implements Transformation {
  type: "matrix";
  matrix: Array<number>;
  constructor(matrix?: Array<number>) {

    if (matrix?.length != 6) {
      throw new RangeError(
        "Matrix data must contain exactly six values, got " + matrix
      );
    }
    this.matrix = matrix ?? [1, 0, 0, 1, 0, 0];
  }
  matrix6() {
    return this.matrix;
  }
}

export class Matrix {
  v: Array<number>;
  queue: Array<Transformation> = []; // list of matrixes to apply
  cache: ArbitraryMatrix | null = null; // combined matrix cache

  constructor(v?: Array<number>) {
    this.v = v || [1, 0, 0, 1, 0, 0];
  }

  clone(): Matrix {
    const result = new Matrix();
    result.queue = this.queue.slice();
    return result;
  }

  isIdentity(): boolean {
    if (!this.cache) {
      this.cache = this.toArray();
    }

    var m = this.cache;

    return (
      m.matrix[0] === 1 &&
      m.matrix[1] === 0 &&
      m.matrix[2] === 0 &&
      m.matrix[3] === 1 &&
      m.matrix[4] === 0 &&
      m.matrix[5] === 0
    );
  }

  matrix(m: Matrix): Matrix {
    if (m.isIdentity()) {
      return this;
    }
    this.cache = null;
    m.queue.forEach((t) => this.queue.push(t));
    return this;
  }

  translate(tx: number, ty: number): Matrix {
    if (tx !== 0 || ty !== 0) {
      this.cache = null;
      this.queue.push(new Translate(tx, ty));
    }
    return this;
  }

  scale(sx: number, sy: number): Matrix {
    if (sx !== 1 || sy !== 1) {
      this.cache = null;
      this.queue.push(new Scale(sx, sy));
    }
    return this;
  }

  rotate(angle: number, rx: number, ry: number): Matrix {
    if (angle !== 0) {
      this.translate(rx, ry);
      this.queue.push(new Rotate(angle));
      this.cache = null;

      this.translate(-rx, -ry);
    }
    return this;
  }

  skewX(angle: number): Matrix {
    if (angle !== 0) {
      this.cache = null;
      this.queue.push(new SkewX(angle));
    }
    return this;
  }

  skewY(angle: number): Matrix {
    if (angle !== 0) {
      this.cache = null;
      this.queue.push(new SkewY(angle));
    }
    return this;
  }

  // Flatten queue
  toArray(): ArbitraryMatrix {
    if (this.cache) {
      return this.cache;
    }

    var cache = [1, 0, 0, 1, 0, 0];
    this.queue.forEach(
      (item) => (cache = Matrix.combine(cache, item.matrix6()))
    );

    this.cache = new ArbitraryMatrix(cache);
    return this.cache;
  }

  // Apply list of matrixes to (x,y) point.
  // If `isRelative` set, `translate` component of matrix will be skipped
  calc(point: Point, isRelative?: boolean): Point {
    var m;

    // Don't change point on empty transforms queue
    if (!this.queue.length) {
      return point;
    }

    // Calculate final matrix, if not exists
    //
    // NB. if you deside to apply transforms to point one-by-one,
    // they should be taken in reverse order

    if (!this.cache) {
      this.cache = this.toArray();
    }

    m = this.cache;

    // Apply matrix to point
    return new Point(
      point.x * m.matrix[0] +
        point.y * m.matrix[2] +
        (isRelative ? 0 : m.matrix[4]),
      point.x * m.matrix[1] +
        point.y * m.matrix[3] +
        (isRelative ? 0 : m.matrix[5])
    );
  }
  // combine 2 matrixes
  // m1, m2 - [a, b, c, d, e, g]
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

  // takes an SVG transform string and returns corresponding SVGMatrix
  // from https://github.com/fontello/svgpath
  applyTransformString(transformString: string): Matrix {
    if (!transformString) return this;

    var operations = {
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

    var cmd: string = "";
    var params: Array<number>;

    // Split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate',  '-45', '']
    for (const item in transformString.split(CMD_SPLIT_RE)) {
      // Skip empty elements
      if (!item.length) {
        continue;
      }

      // remember operation
      if (operations.hasOwnProperty(item)) {
        cmd = item;
        continue;
      }

      // extract params & att operation to matrix
      params = item.split(PARAMS_SPLIT_RE).map(function (i) {
        return +i || 0;
      });

      // If params count is not correct - ignore command
      switch (cmd) {
        case "matrix":
          if (params.length === 6) {
            this.matrix(new Matrix(params));
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

  apply(points: Array<Point>): Array<Point> {
    return points.map((p) => this.calc(p));
  }
}
