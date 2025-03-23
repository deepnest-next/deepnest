import { Point } from "./point";
import { Polygon } from "./polygon";

export abstract class Curve {
  abstract linearize(tol: number): Array<Point>;
  abstract start(): Point;
  abstract end(): Point;
  abstract toString(): String;
}

export class LineSegment extends Curve {
  p1: Point;
  p2: Point;

  constructor(p1: Point, p2: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
  }

  isFlat(): boolean {
    return true;
  }
  linearize(): Point[] {
    return [this.p1, this.p2];
  }
  start() {
    return this.p1;
  }
  end() {
    return this.p2;
  }
  toString() {
    return "Line segment from " + this.p1 + " to " + this.p2;
  }
}

function lerp(p1: Point, p2: Point, t: number) : Point {
  if (t < 0 || t > 1) {
    throw new Error();
  }
  return new Point(
    p1.x + (p2.x - p1.x) * t,
    p1.y + (p2.y - p1.y) * t
  );
}

export class QuadraticBezier extends Curve {
  // Bezier algos from http://algorithmist.net/docs/subdivision.pdf
  p1: Point;
  p2: Point;
  c1: Point;
  constructor(p1: Point, p2: Point, c1: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.c1 = c1;
  }
  // Roger Willcocks bezier flatness criterion
  isFlat(tol: number): boolean {
    const ux = 2 * this.c1.x - this.p1.x - this.p2.x;
    const uy = 2 * this.c1.y - this.p1.y - this.p2.y;
    return ux * ux + uy * uy <= 4 * tol * tol;
  }

  // turn Bezier into line segments via de Casteljau, returns an array of points
  linearize(tol: number): Array<Point> {
    var finished = [this.p1]; // list of points to return
    var todo: Array<QuadraticBezier> = [this]; // list of Beziers to divide

    // recursion could stack overflow, loop instead
    while (todo.length > 0) {
      var segment = todo[0];

      if (segment.isFlat(tol)) {
        // reached subdivision limit
        finished.push(segment.p2);
        todo.shift();
      } else {
        var divided = segment.subdivide(0.5);
        todo.splice(0, 1, divided[0], divided[1]);
      }
    }
    return finished;
  }

  // subdivide a single Bezier
  // t is the percent along the Bezier to divide at. eg. 0.5
  subdivide(t: number): [QuadraticBezier, QuadraticBezier] {
    var mid1 = lerp(this.p1, this.c1, t);
    var mid2 = lerp(this.c1, this.p2, t);
    var mida = lerp(mid1, mid2, t);

    var seg1 = new QuadraticBezier(this.p1, mida, mid1);
    var seg2 = new QuadraticBezier(mida, this.p2, mid2);

    return [seg1, seg2];
  }
  start() {
    return this.p1;
  }
  end() {
    return this.p2;
  }
  public toString() {
    return "Quadratic Bezier(" + this.p1 + ", " + this.p2 + ", " + this.c1 + ")";
  }
}
export class CubicBezier extends Curve {
  p1: Point;
  p2: Point;
  c1: Point;
  c2: Point;
  constructor(p1: Point, p2: Point, c1: Point, c2: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.c1 = c1;
    this.c2 = c2;
  }

  isFlat(tol: number): boolean {
    var ux = 3 * this.c1.x - 2 * this.p1.x - this.p2.x;
    ux *= ux;
    var uy = 3 * this.c1.y - 2 * this.p1.y - this.p2.y;
    uy *= uy;
    var vx = 3 * this.c2.x - 2 * this.p2.x - this.p1.x;
    vx *= vx;
    var vy = 3 * this.c2.y - 2 * this.p2.y - this.p1.y;
    vy *= vy;

    if (ux < vx) {
      ux = vx;
    }
    if (uy < vy) {
      uy = vy;
    }

    return ux + uy <= 16 * tol * tol;
  }

  linearize(tol: number): Array<Point> {
    var finished = [this.p1]; // list of points to return
    var todo: Array<CubicBezier> = [this]; // list of Beziers to divide

    // recursion could stack overflow, loop instead

    while (todo.length > 0) {
      var segment = todo[0];

      if (segment.isFlat(tol)) {
        // reached subdivision limit
        finished.push(segment.p2);
        todo.shift();
      } else {
        var divided = segment.subdivide(0.5);
        todo.splice(0, 1, divided[0], divided[1]);
      }
    }
    console.log("%s expanded to %d segments", this, finished.length);
    return finished;
  }

  subdivide(t: number): [CubicBezier, CubicBezier] {
    var mid1 = lerp(this.p1, this.c1, t);
    var mid2 = lerp(this.c1, this.c2, t);
    var mid3 = lerp(this.c2, this.p2, t);
    var mida = lerp(mid1, mid2, t);
    var midb = lerp(mid2, mid3, t);
    var midx = lerp(mida, midb, t);

    var seg1 = new CubicBezier(this.p1, midx, mid1, mida);
    var seg2 = new CubicBezier(midx, this.p2, midb, mid3);
    return [seg1, seg2];
  }
  start() {
    return this.p1;
  }
  end() {
    return this.p2;
  }
  public toString() {
    return "Cubic Bezier(" + this.p1 + ", " + this.p2 + ", " + this.c1 + ", " + this.c2 + ")";
  }

}

export class SvgArc extends Curve {
  p1: Point;
  p2: Point;
  rx: number;
  ry: number;
  angle: number;
  largearc: boolean;
  sweep: boolean;
  constructor(
    p1: Point,
    p2: Point,
    rx: number,
    ry: number,
    angle: number,
    largearc: boolean,
    sweep: boolean
  ) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.rx = rx;
    this.ry = ry;
    this.angle = angle % 360;
    this.largearc = largearc;
    this.sweep = sweep;
  }
  linearize(tol: number) {
    // list of points to return. Points will be added to the beginning of the list.
    var finished = [this.p2];

    var arc = this.svgToCenter();
    var todo: Array<CenteredArc> = [arc]; // list of arcs to divide

    // recursion could stack overflow, loop instead
    while (todo.length > 0) {
      arc = todo[0];

      const segmentFlat = arc.isFlat(tol);
      if (segmentFlat) {
        finished.unshift(segmentFlat.p1);
        todo.shift();
      } else {
        var arc1 = new CenteredArc(
          arc.center,
          arc.rx,
          arc.ry,
          arc.theta,
          0.5 * arc.extent,
          arc.angle
        );
        var arc2 = new CenteredArc(
          arc.center,
          arc.rx,
          arc.ry,
          arc.theta + 0.5 * arc.extent,
          0.5 * arc.extent,
          arc.angle
        );
        todo.splice(0, 1, arc1, arc2);
      }
    }
    console.log("%s expanded to %d segments at tolerance %f", this, finished.length, tol);

    return finished;
  }

  isFlat(tol: number): boolean {
    // FIXME this is an awful lazy way to do this
    return this.svgToCenter().isFlat(tol) != null;
  }

  // convert from SVG format arc to center point arc
  svgToCenter(): CenteredArc {
    var mid = this.p1.midpoint(this.p2);
    var diff = new Point(
      0.5 * (this.p2.x - this.p1.x),
      0.5 * (this.p2.y - this.p1.y)
    );

    var angle = (Math.PI * (this.angle % 360)) / 180;

    var cos = Math.cos(angle);
    var sin = Math.sin(angle);

    var x1 = cos * diff.x + sin * diff.y;
    var y1 = -sin * diff.x + cos * diff.y;

    var rx = Math.abs(this.rx);
    var ry = Math.abs(this.ry);
    var Prx = rx * rx;
    var Pry = ry * ry;
    var Px1 = x1 * x1;
    var Py1 = y1 * y1;

    var radiiCheck = Px1 / Prx + Py1 / Pry;
    var radiiSqrt = Math.sqrt(radiiCheck);
    if (radiiCheck > 1) {
      rx = radiiSqrt * rx;
      ry = radiiSqrt * ry;
      Prx = rx * rx;
      Pry = ry * ry;
    }

    var sign = this.largearc != this.sweep ? -1 : 1;
    var sq = (Prx * Pry - Prx * Py1 - Pry * Px1) / (Prx * Py1 + Pry * Px1);

    sq = sq < 0 ? 0 : sq;

    var coef = sign * Math.sqrt(sq);
    var cx1 = coef * ((rx * y1) / ry);
    var cy1 = coef * -((ry * x1) / rx);

    var cx = mid.x + (cos * cx1 - sin * cy1);
    var cy = mid.y + (sin * cx1 + cos * cy1);

    var ux = (x1 - cx1) / rx;
    var uy = (y1 - cy1) / ry;
    var vx = (-x1 - cx1) / rx;
    var vy = (-y1 - cy1) / ry;
    var n = Math.sqrt(ux * ux + uy * uy);
    var p = ux;
    sign = uy < 0 ? -1 : 1;

    var theta = sign * Math.acos(p / n);

    n = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    p = ux * vx + uy * vy;
    sign = ux * vy - uy * vx < 0 ? -1 : 1;
    var delta = sign * Math.acos(p / n);

    delta *= 180 / Math.PI;
    theta *= 180 / Math.PI;

    if (this.sweep && delta > 0) {
      delta -= 360;
    } else if (!this.sweep && delta < 0) {
      delta += 360;
    }

    delta %= 360;
    theta %= 360;

    return new CenteredArc(
      new Point(cx, cy),
      rx,
      ry,
      theta,
      delta,
      angle
    );
  }
  start(): Point {
    return this.p1;
  }
  end(): Point {
    return this.p2;
  }
  public toString() {
    return "SvgArc(" + this.p1 + ", " + this.p2 + ", rx=" + this.rx + ", ry=" + this.ry + ", angle=" + this.angle + ", largeArc=" + this.largearc + ", sweep=" + this.sweep + ")";
  }

}

export class CenteredArc {
  center: Point;
  rx: number;
  ry: number;
  theta: number;
  extent: number;
  angle: number;

  constructor(
    center: Point,
    rx: number,
    ry: number,
    theta: number,
    extent: number,
    angle: number
  ) {
    this.center = center;
    this.rx = rx;
    this.ry = ry;
    this.theta = theta;
    this.extent = extent;
    this.angle = angle;
  }

  // compare midpoint of line with midpoint of arc
  // this is not 100% accurate, but should be a good heuristic for flatness in most cases
  isFlat(tol: number): SvgArc | null {
    var fullarc = this.centerToSvg(
      this.center,
      this.rx,
      this.ry,
      this.theta,
      this.extent,
      this.angle
    );
    var subarc = this.centerToSvg(
      this.center,
      this.rx,
      this.ry,
      this.theta,
      0.5 * this.extent,
      this.angle
    );
    var arcmid = subarc.p2;

    var mid = new Point(
      0.5 * (fullarc.p1.x + fullarc.p2.x),
      0.5 * (fullarc.p1.y + fullarc.p2.y)
    );

    if (mid.squaredDistanceTo(arcmid) < tol * tol) return fullarc;
    else return null;
  }

  // convert from center point/angle sweep definition to SVG point and flag definition of arcs
  // ported from http://commons.oreilly.com/wiki/index.php/SVG_Essentials/Paths
  centerToSvg(
    center: Point,
    rx: number,
    ry: number,
    theta1: number,
    extent: number,
    angleDegrees: number
  ): SvgArc {
    var theta2 = theta1 + extent;

    var cos = Math.cos((angleDegrees / 180) * Math.PI);
    var sin = Math.sin((angleDegrees / 180) * Math.PI);

    var t1cos = Math.cos((theta1 / 180) * Math.PI);
    var t1sin = Math.sin((theta1 / 180) * Math.PI);

    var t2cos = Math.cos((theta2 / 180) * Math.PI);
    var t2sin = Math.sin((theta2 / 180) * Math.PI);

    var x0 = center.x + cos * rx * t1cos + -sin * ry * t1sin;
    var y0 = center.y + sin * rx * t1cos + cos * ry * t1sin;

    var x1 = center.x + cos * rx * t2cos + -sin * ry * t2sin;
    var y1 = center.y + sin * rx * t2cos + cos * ry * t2sin;

    var largearc = extent > 180;
    var sweep = extent > 0;

    return new SvgArc(
      new Point(x0, y0),
      new Point(x1, y1),
      rx,
      ry,
      angleDegrees,
      largearc,
      sweep
    );
  }
}

export class Text {
  content: string;
  font: opentype.Font;
  size: number;
  constructor(
    content: string,
    font: opentype.Font,
    size: number
  ) {
    this.content = content;
    this.font = font;
    this.size = size;
  }

  getPolygons(tol: number, accept: (p: Polygon) => void) {
    const commands = this.font.getPath(this.content, 0, 0, this.size).commands;
    var path = [];
    var first = new Point(0, 0);
    var last = new Point(0, 0);
    for (const command of commands) {
      switch (command.type) {
        case "C": {
          const next = new Point(command.x, command.y);
          path.push(new CubicBezier(last, next, new Point(command.x1, command.y1), new Point(command.x2, command.y2)));
          last = next;
          break;
        }
        case "L": {
          const next = new Point(command.x, command.y);
          path.push(new LineSegment(last, next));
          last = next;
          break;
        }
        case "M":
          first = last = new Point(command.x, command.y);
          if (path.length != 0) {
            const r = new Polygon(path.flatMap(e => e.linearize(tol)));
            console.log("Path: " + path + "\n becomes "  + r);
            accept(r);
          }
          path = [];
          break;
        case "Q": {
          const next = new Point(command.x, command.y);
          path.push(new QuadraticBezier(last, next, new Point(command.x1, command.y1)));
          last = next;
          break;
        }
        case "Z":
          if (path.length != 0) {
            const r = new Polygon(path.flatMap(e => e.linearize(tol)));
            console.log("Path: " + path + "\n becomes "  + r);
            accept(r);
          }
          last = first;
          path = [];
          break;
      }
    }
  }

  public toString() {
    return "Text(content=" + this.content + ", size=" + this.size + ", font=" + this.font, ")";
  }

}
