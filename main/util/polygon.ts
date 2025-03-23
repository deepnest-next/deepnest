// Contains code adapted from https://d3js.org/d3-polygon/ Version 1.0.2. Copyright 2016 Mike Bostock.
import { Point } from "./point";
import { AxisAlignedRectangle } from "./axisalignedrectangle";
import { GeometryUtil } from "./geometryutil";
var ClipperLib = require('../../main/util/clipper.js');
import { IntPoint } from "./intpoint";


function lexicographicOrder(a: Point, b: Point): number {
  return a.x - b.x || a.y - b.y;
}

// Returns the 2D cross product of AB and AC vectors, i.e., the z-component of
// the 3D cross product in a quadrant I Cartesian coordinate system (+x is
// right, +y is up). Returns a positive value if ABC is counter-clockwise,
// negative if clockwise, and zero if the points are collinear.
function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

// Computes the upper convex hull per the monotone chain algorithm.
// Assumes points.length >= 3, is sorted by x, unique in y.
// Returns an array of indices into points in left-to-right order.
function computeUpperHullIndexes(points: Array<Point>) {
  var n = points.length,
    indexes = [0, 1],
    size = 2;

  for (var i = 2; i < n; ++i) {
    while (
      size > 1 &&
      cross(points[indexes[size - 2]], points[indexes[size - 1]], points[i]) <=
        0
    )
      --size;
    indexes[size++] = i;
  }

  return indexes.slice(0, size); // remove popped points
}

export class Polygon {
  points: Array<Point>;

  constructor(points: Array<Point>);
  constructor(points: Array<IntPoint>, scale: number);
  constructor(...args: any[]) {
    if (args.length == 1) {
      const points : Array<Point> = args[0];
      if (points.length < 3) {
        throw new RangeError(
          "A polygon must have at least 3 sides, got " + points.length
        );
      }
      if (
        GeometryUtil.almostEqual(points[0].x, points[points.length - 1].x) &&
        GeometryUtil.almostEqual(points[0].y, points[points.length - 1].y)
      ) {
        points.pop();
      }
      this.points = points;
    } else if (args.length == 2) {
      const points : Array<Point> = args[0];
      const scale = args[1];
      if (points.length < 3) {
        throw new RangeError(
          "A polygon must have at least 3 sides, got " + points.length
        );
      }
      if (
        GeometryUtil.almostEqual(points[0].x, points[points.length - 1].x) &&
        GeometryUtil.almostEqual(points[0].y, points[points.length - 1].y)
      ) {
        points.pop();
      }
      this.points = points.map(p => new Point(p.x / scale, p.y / scale));
    } else {
      throw new Error("Invalid usage: should get 1 arg but got " + args.length);
    }
  }

  area(): number {
    var i = -1,
      n = this.points.length,
      a,
      b = this.points[n - 1],
      area = 0;

    while (++i < n) {
      a = b;
      b = this.points[i];
      area += a.y * b.x - a.x * b.y;
    }

    return area / 2;
  }
  reverse() {
    this.points.reverse();
  }

  perimeter(): number {
    var i = -1,
      n = this.points.length,
      b = this.points[n - 1],
      xa,
      ya,
      xb = b.x,
      yb = b.y,
      perimeter = 0;

    while (++i < n) {
      xa = xb;
      ya = yb;
      b = this.points[i];
      xb = b.x;
      yb = b.y;
      xa -= xb;
      ya -= yb;
      perimeter += Math.sqrt(xa * xa + ya * ya);
    }

    return perimeter;
  }

  centroid(): Point {
    var i = -1,
      n = this.points.length,
      x = 0,
      y = 0,
      a,
      b = this.points[n - 1],
      c,
      k = 0;

    while (++i < n) {
      a = b;
      b = this.points[i];
      k += c = a.x * b.y - b.x * a.y;
      x += (a.x + b.x) * c;
      y += (a.y + b.y) * c;
    }

    k *= 3;
    return new Point(x / k, y / k);
  }

  getBounds(): AxisAlignedRectangle {
    var xmin = this.points[0].x;
    var xmax = this.points[0].x;
    var ymin = this.points[0].y;
    var ymax = this.points[0].y;

    for (var i = 1; i < this.points.length; i++) {
      if (this.points[i].x > xmax) {
        xmax = this.points[i].x;
      } else if (this.points[i].x < xmin) {
        xmin = this.points[i].x;
      }

      if (this.points[i].y > ymax) {
        ymax = this.points[i].y;
      } else if (this.points[i].y < ymin) {
        ymin = this.points[i].y;
      }
    }

    return new AxisAlignedRectangle(xmin, ymin, xmax - xmin, ymax - ymin);
  }

  hull(): Polygon {
    const n = this.points.length;

    var i,
      sortedPoints = new Array(n),
      flippedPoints = new Array(n);

    for (i = 0; i < n; ++i)
      sortedPoints[i] = [+this.points[i].x, +this.points[i].y, i];
    sortedPoints.sort(lexicographicOrder);
    for (i = 0; i < n; ++i)
      flippedPoints[i] = [sortedPoints[i][0], -sortedPoints[i][1]];

    var upperIndexes = computeUpperHullIndexes(sortedPoints),
      lowerIndexes = computeUpperHullIndexes(flippedPoints);

    // Construct the hull polygon, removing possible duplicate endpoints.
    var skipLeft: boolean = lowerIndexes[0] === upperIndexes[0],
      skipRight: boolean =
        lowerIndexes[lowerIndexes.length - 1] ===
        upperIndexes[upperIndexes.length - 1],
      hull = [];

    // Add upper hull in right-to-l order.
    // Then add lower hull in left-to-right order.
    for (i = upperIndexes.length - 1; i >= 0; --i)
      hull.push(this.points[sortedPoints[upperIndexes[i]][2]]);
    for (i = +skipLeft; i < lowerIndexes.length - (skipRight ? 1 : 0); ++i)
      hull.push(this.points[sortedPoints[lowerIndexes[i]][2]]);
    return new Polygon(hull);
  }

  offset(amount: number, curveTolerance: number) {
    if (!amount || amount == 0 || GeometryUtil.almostEqual(amount, 0)) {
      return this;
    }
    const scale = 1000000;

    var p = this.svgToClipper(scale);

    var miterLimit = 4;
    var co = new ClipperLib.ClipperOffset(
      miterLimit,
      curveTolerance * scale
    );
    co.AddPath(
      p,
      ClipperLib.JoinType.jtMiter,
      ClipperLib.EndType.etClosedPolygon
    );

    var newpaths = new ClipperLib.Paths();
    co.Execute(newpaths, amount * scale);

    var result = [];
    for (var i = 0; i < newpaths.length; i++) {
      result.push(Polygon.clipperToSvg(newpaths[i], scale));
    }

    return result;
  };

  simplify(_inside: boolean) : Polygon {
    // FIXME
    return this;
  }

  // converts a polygon from normal float coordinates to integer coordinates used by clipper, as well as x/y -> X/Y
  svgToClipper(scale: number) : Array<IntPoint> {
    var clip = [];
    for (var i = 0; i < this.points.length; i++) {
      clip.push({ X: this.points[i].x * scale, Y: this.points[i].y * scale });
    }

    return clip;
  };
  
  static clipperToSvg(points: Array<IntPoint>, scale: number): Polygon {
    return new Polygon(points, scale);
  };
  
  containsPoint(point: Point): boolean {
    var n = this.points.length,
      p = this.points[n - 1],
      x = point.x,
      y = point.y,
      x0 = p.x,
      y0 = p.y,
      x1,
      y1,
      inside = false;

    for (var i = 0; i < n; ++i) {
      (p = this.points[i]), (x1 = p.x), (y1 = p.x);
      if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1)
        inside = !inside;
      (x0 = x1), (y0 = y1);
    }
    return inside;
  }

  rotate(radians: number): Polygon {
    var rotated: Array<Point> = [];
    for (var i = 0; i < this.points.length; i++) {
      var x = this.points[i].x;
      var y = this.points[i].y;
      rotated.push(
        new Point(
          x * Math.cos(radians) - y * Math.sin(radians),
          x * Math.sin(radians) + y * Math.cos(radians)
        )
      );
    }
    return new Polygon(rotated);
  }

  translate(dx: number, dy: number): Polygon {
    var translated: Array<Point> = [];
    for (var i = 0; i < this.points.length; i++) {
      translated.push(new Point(this.points[i].x + dx, this.points[i].y + dy));
    }
    return new Polygon(translated);
  }

  // Lerp along the entire perimeter.
  pointAt(offset: number) : Point {
    // What amount of perimeter do we want to get?
    var goal = offset * this.perimeter();
    for (var index = 0; index < this.points.length; index++) {
      const segment = this.points[index].to(this.points[index + 1]);
      const segLength = segment.length();
      if (segLength > goal) {
        const r = segment.scaled(goal / segLength);
        return this.points[index].plus(r.dx, r.dy);
      }
      goal -= segLength;
    }
    return new Point(Infinity, Infinity);
  }

  isPositive() : boolean {
    return this.area() > 0;
  }

  public toString() {
    return "Polygon(" + this.points.map(p => p.toString()).join(", ") + ")";
  }

}
