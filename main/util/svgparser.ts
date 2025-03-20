/*!
 * SvgParser
 * A library to convert an SVG string to parse-able segments for CAD/CAM use
 * Licensed under the MIT license
 */
import { parseSVG, makeAbsolute } from "svg-path-parser";
import {
  CubicBezier,
  Curve,
  LineSegment,
  QuadraticBezier,
  SvgArc,
  Text,
} from "./curves";

import { FontFactory } from "./fontfactory";
import { Matrix } from "./matrix";
import { Polygon } from "./polygon";
import { Point } from "./point";
import { Shape } from "./shape";

export interface SvgParserConfiguration {
  tolerance: number; // max bound for bezier->line segment conversion, in native SVG units
  toleranceSvg: number; // fudge factor for browser inaccuracy in SVG unit handling
  scale: number;
  scalingFactor: number;
  endpointTolerance: number;
}

export class ModelsToPlace {
  filename: string;
  svgroot: any;
  // key is shape (possibly including internal holes), value is desired count.
  models: Map<Shape, number>;
  // shapes (possibly with holes) of sheets of material. value is available count.
  sheets: Map<Shape, number>;

  constructor(filename: string, svgroot: any, models: Map<Shape, number>, sheets: Map<Shape, number>) {
    this.filename = filename;
    this.svgroot = svgroot;
    this.models = models;
    this.sheets = sheets;
  }
}

export class SvgParser {
  conf: SvgParserConfiguration;
  fontFactory: FontFactory;
  // purely for backwards compatibility, delete me
  resultcache: ModelsToPlace | null;

  constructor(
    fontFactory: FontFactory,
    config?: SvgParserConfiguration,
  ) {
    this.fontFactory = fontFactory;
    // TODO: handle scaling based on viewport appropriately
    this.conf = config || {
      tolerance: 2, // max bound for bezier->line segment conversion, in native SVG units
      toleranceSvg: 0.01, // fudge factor for browser inaccuracy in SVG unit handling
      scale: 72,
      scalingFactor: 1000,
      endpointTolerance: 2,
    };
  }

  config(c: SvgParserConfiguration) {
    this.conf.endpointTolerance = c.endpointTolerance || this.conf.endpointTolerance;
    this.conf.scale = c.scale || this.conf.scale;
    this.conf.scalingFactor = c.scalingFactor || this.conf.scalingFactor;
    this.conf.tolerance = c.tolerance || this.conf.tolerance;
    this.conf.toleranceSvg = c.toleranceSvg || this.conf.toleranceSvg;
  }

  // purely for backwards compatibility, delete me
  load(dirpath: string, svgstring: string, scale: number, scalingFactor: number) : ModelsToPlace {
    this.conf.scale = scale;
    this.conf.scalingFactor = scalingFactor;
    this.resultcache = this.parse(dirpath, svgstring);
    return this.resultcache;
  }
  // purely for backwards compatibility, delete me
  toPartsAndSheets(models: ModelsToPlace) : any {
    let pieces : any[] = [];
    for (const entry of models.models.entries()) {
      const piece = entry[0];
      const count = entry[1];
      // var g : any = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      piece.item.map(chunk => {
        let simplePiece : any = document.createElementNS('http://www.w3.org/2000/svg', 'poly');
        simplePiece.setAttribute("points", chunk.points.map(p => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "));
        simplePiece.bounds = chunk.getBounds();
        simplePiece.area = simplePiece.bounds.width * simplePiece.bounds.height;
        simplePiece.quantity = count;
        simplePiece.filename = models.filename;
        simplePiece.svgelements = [piece.source];
          // g.appendChild(simplePiece);
        pieces.push(simplePiece);
      })

    }
    for (const sheet of models.sheets.keys()) {
      var g : any = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      sheet.item.map(chunk => {
        let simpleSheet = document.createElementNS('http://www.w3.org/2000/svg', 'poly');
        simpleSheet.setAttribute("points", chunk.points.map(p => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "));
        g.appendChild(simpleSheet);
      })
      g.sheet = true;
      pieces.push(g);
    }
    return pieces;
  }

  parse(filename: string, svgString: string): ModelsToPlace {
    if (!svgString || typeof svgString !== "string") {
      throw Error("invalid SVG string");
    }

    // small hack. inkscape svgs opened and saved in illustrator will fail from a lack of an inkscape xmlns
    if (/inkscape/.test(svgString) && !/xmlns:inkscape/.test(svgString)) {
      svgString = svgString.replace(
        /xmlns=/i,
        ' xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns='
      );
    }
    var parser = new DOMParser();
    const svgRoot = parser.parseFromString(svgString, "image/svg+xml");

    const resultModels: Map<Shape, number> = new Map();
    const sheets: Map<Shape, number> = new Map();

    this.findShapes(resultModels, sheets, new Map<String, SVGElement>(), svgRoot.firstElementChild!, new Matrix());
    return new ModelsToPlace(filename, svgRoot, resultModels, sheets);
  }

  decodeElement(
    transform: Matrix,
    e: Element,
    handleSheet: (
      currentTransform: Matrix,
      availableQuantity: number,
      bounds: Polygon
    ) => void,
    handleShape: (
      currentTransform: Matrix,
      desiredQuantity: number,
      bounds: Polygon
    ) => void
  ): Matrix {
    const desiredQuantity = parseInt(e.getAttribute("desiredQuantity") || "1");
    const availableQuantity = parseInt(
      e.getAttribute("availableQuantity") || "1"
    );
    const strokeWidth = parseFloat(e.getAttribute("stroke-width") || "0");
    const handler = e.getAttribute("sheet") ? handleSheet : handleShape;

    switch (e.tagName) {
      case "ellipse": {
        const cx = parseFloat(e.getAttribute("cx")!);
        const cy = parseFloat(e.getAttribute("cy")!);
        const rx = parseFloat(e.getAttribute("rx")!);
        const ry = parseFloat(e.getAttribute("ry")!);
        const top = new Point(cx, cy + ry);
        const bottom = new Point(cx, cy - ry);
        this.buildPolygon(transform, availableQuantity, strokeWidth, handler, [new SvgArc(top, bottom, rx, ry, 0, true, true),
          new SvgArc(bottom, top, rx, ry, 0, true, true)]);
        break;
      }
      case "line":
        if (strokeWidth > 0) {
          this.buildPolygon(transform, availableQuantity, strokeWidth, handler, [
            new LineSegment(
              new Point(
                parseFloat(e.getAttribute("x1")!),
                parseFloat(e.getAttribute("y1")!)
              ),
              new Point(
                parseFloat(e.getAttribute("x2")!),
                parseFloat(e.getAttribute("y2")!)
              )
            ),
          ]);
        }
        break;
      case "circle": {
        const cx = parseFloat(e.getAttribute("cx")!);
        const cy = parseFloat(e.getAttribute("cy")!);
        const r = parseFloat(e.getAttribute("r")!);
        const top = new Point(cx, cy + r);
        const bottom = new Point(cx, cy - r);

        this.buildPolygon(transform, availableQuantity, strokeWidth, handler, [new SvgArc(top, bottom, r, r, 0, true, true),
           new SvgArc(bottom, top, r, r, 0, true, true)]);
        break;
      }
      case "rect":
        const width = parseFloat(e.getAttribute("width")!);
        const height = parseFloat(e.getAttribute("height")!);
        const x = parseFloat(e.getAttribute("x") ?? "0");
        const y = parseFloat(e.getAttribute("y") ?? "0");
        const p1 = new Point(x, y);
        const p2 = new Point(x + width, y);
        const p3 = new Point(x + width, y + height);
        const p4 = new Point(x, y + height);
        this.buildPolygon(transform, availableQuantity, strokeWidth, handler, [
          new LineSegment(p1, p2),
          new LineSegment(p2, p3),
          new LineSegment(p3, p4),
          new LineSegment(p4, p1),
        ]);
        break;

      case "polygon":
      case "polyline": {
        const points: Array<Point> = e
          .getAttribute("points")!
          .split(" ")
          .map((p) => {
            const pair = p.split(",");
            return new Point(parseFloat(pair[0]), parseFloat(pair[1]));
          });
        var result = [];
        for (let i = 0; i < points.length; i++) {
          if (i < points.length - 1) {
            result.push(new LineSegment(points[i], points[i + 1]));
          } else {
            if (e.tagName == "polygon") {
              // connect last to first
              result.push(new LineSegment(points[i], points[0]));
            } else {
              // this is a poly-line, which is open
            }
          }
        }
        // A polygon is inherently closed, a polyline can be closed if its end is "pretty close" to its start.
        if (
          e.tagName == "polygon" ||
          // FIXME add a tolerance here
          (result.length >= 3 && result[0].start().equals(result[result.length - 1].end()))) {
            this.buildPolygon(transform, availableQuantity, strokeWidth, handler, result);
          }
        break;
      }
      case "text":
        // FIXME find appropriate font from context. May need to look at styles up the tree.
        // FIXME handle transformations: this could be rotated, sheared, etc.
        const dx = parseFloat(e.getAttribute("x")!);
        const dy = parseFloat(e.getAttribute("y")!);
        new Text(
          e.textContent!,
          this.fontFactory.get(e.getAttribute("font-family")!),
          parseFloat(e.getAttribute("font-size")!))
            .getPolygons(this.conf.toleranceSvg,
              p => handler(transform, availableQuantity, p.translate(dx, dy)));
        break;
      case "path":
        const d = e.getAttribute("d")!;
        // console.log("Parsing path: %s", d);
        this.parsePathString(d, (p) => {
          if (p[0].start().equals(p[p.length - 1].end()) || strokeWidth > 0) {
            const path: Point[] = p
              .flatMap((t: Curve) => t.linearize(this.conf.toleranceSvg))
              .map((point: Point) => transform.calc(point));
            var poly = new Polygon(path);
            // const sw = e.getAttribute("stroke-width");
            // if (sw != null) {
            //   const offset = (parseFloat(sw) / 2.0);
            //   console.log("Offsetting path " + path + " by: " + offset);

            //   poly = poly.offset(offset, this.conf.scale, this.conf.toleranceSvg)[0];
            // }
            handleShape(transform, desiredQuantity, poly);
          }
        });
        break;
      case "radialGradient":
        // No need to handle this, it doesn't change the shape overall.
        break;
      case "use":
        // TODO: Keep a dictionary of what previously seen IDs translated to in terms of shapes, and repeat those, handling transforms.
        break;
      case "sodipodi:namedview":
        // inkscape magics, ignore
        break;
      default:
        throw new Error("Un-handled element " + e.tagName);
    }

    return transform;
  }

  private buildPolygon(transform: Matrix, availableQuantity: number, _strokeWidth: number | null, handle: (
    currentTransform: Matrix,
    availableQuantity: number,
    bounds: Polygon
  ) => void, curves: Array<Curve>) {
    const path: Point[] = transform.apply(
      curves.flatMap((t: Curve) => t.linearize(this.conf.toleranceSvg))
    );
    if (path.length < 3) {
      return;
    }
    var poly = new Polygon(path);

    handle(transform, availableQuantity, poly);
  }

  private findShapes(
    resultModels: Map<Shape, number>,
    sheets: Map<Shape, number>,
    defs: Map<String, SVGElement>,
    e: Element,
    transform: Matrix
  ) {
    const newTransform = transform
      .clone().applyTransformString(e.getAttribute("transform") ?? "");

    const children: SVGElement[] = Array.prototype.slice.call(e.children);
    switch (e.tagName) {
      case "image":
      case "g":
      case "svg":
        for (let index = 0; index < e.children.length; index++) {
          const c = e.children[index];
          this.findShapes(resultModels, sheets, new Map<String, SVGElement>(defs), c, transform);
        }
        break;
      case "defs":
        break;
      default:
        this.decodeElement(
          newTransform,
          e,
          (currentTransform, availableQuantity, bounds) => {
            console.log("findShapes: Finding holes in part. Element %s has %d children",
              e.tagName, children.length);
            const holes = children.flatMap((c) =>
              this.findHoles(resultModels, sheets, defs, c, currentTransform)
            );
            sheets.set(new Shape(e, [bounds], holes), availableQuantity);
          },
          (currentTransform, desiredQuantity, path) => {
            console.log("findShapes: Finding holes in sheet. Element %s has %d children",
              e.tagName, children.length);
            const holes = children.flatMap((c) =>
              this.findHoles(resultModels, sheets, defs, c, currentTransform)
            );
            resultModels.set(new Shape(e, [path], holes), desiredQuantity);
          }
        );
        break;
    }
  }
  private findHoles(
    resultModels: Map<Shape, number>,
    sheets: Map<Shape, number>,
    defs: Map<String, SVGElement>,
    e: Element,
    transform: Matrix
  ): Array<Polygon> {
    const children: SVGElement[] = Array.prototype.slice.call(e.children);
    console.log("findHoles: Element %s has %d children", e.tagName, children.length);

    var holes: Array<Polygon> = [];
    this.decodeElement(
      transform,
      e,
      () => {
        // FIXME ignoring this sheet definition?
        
      },
      (_currentTransform, _desiredQuantity, path) => {
        holes.push(path);
      }
    );
    children.forEach((c) => this.findShapes(resultModels, sheets, new Map<String, SVGElement>(defs), c, transform));
    return holes;
  }
  private parsePathString(
    pathD: string,
    handle: (path: Array<Curve>) => void
  ): void {
    const pathComponents = makeAbsolute(parseSVG(pathD));
    var result: Array<Curve> = [];
    var lastCubic: CubicBezier | null = null;
    var lastQuadratic: QuadraticBezier | null = null;
    for (const c of pathComponents) {
      switch (c.code) {
        case "A":
          result.push(
            new SvgArc(
              new Point(c.x0, c.y0),
              new Point(c.x, c.y),
              c.rx,
              c.ry,
              c.xAxisRotation,
              c.largeArc,
              c.sweep
            )
          );
          lastCubic = lastQuadratic = null;
          break;
        case "C": {
          const cubic = new CubicBezier(
            new Point(c.x0, c.y0),
            new Point(c.x, c.y),
            new Point(c.x1, c.y1),
            new Point(c.x2, c.y2),
          );
          lastCubic = cubic;
          lastQuadratic = null;
          result.push(cubic);
          break;
        }
        case "S": {
          var control : Point;
          if (lastCubic == null) {
            control = new Point(0, 0);
          } else {
            control = new Point(
              2 * lastCubic.c2.x - lastCubic.p2.x,
              2 * lastCubic.c2.y - lastCubic.p2.y
            );
          }
          const cubic: CubicBezier = new CubicBezier(
            new Point(c.x0, c.y0),
            control,
            new Point(c.x2, c.y2),
            new Point(c.x, c.y)
          );
          lastCubic = cubic;
          lastQuadratic = null;
          result.push(cubic);
          break;
        }
        case "H":
        case "L":
        case "V":
          result.push(
            new LineSegment(new Point(c.x0, c.y0), new Point(c.x, c.y))
          );
          lastCubic = lastQuadratic = null;
          break;
        case "M":
          if (result.length != 0) {
            handle(result);
          }
          result = [];
          lastCubic = lastQuadratic = null;
          break;
        case "Q": {
          const quad = new QuadraticBezier(
            new Point(c.x0, c.y0),
            new Point(c.x1, c.y1),
            new Point(c.x, c.y)
          );
          result.push(quad);
          lastCubic = null;
          lastQuadratic = quad;
          break;
        }
        case "T": {
          var control : Point;
          if (lastQuadratic == null) {
            control = new Point(0, 0);
          } else {
            control = new Point(
              2 * lastQuadratic.c1.x - lastQuadratic.p2.x,
              2 * lastQuadratic.c1.y - lastQuadratic.p2.y
            );
          }
          const quad = new QuadraticBezier(
            new Point(c.x0, c.y0),
            control,
            new Point(c.x, c.y)
          );
          result.push(quad);
          lastCubic = null;
          lastQuadratic = quad;
          break;
        }
        case "Z":
          result.push(
            new LineSegment(new Point(c.x0, c.y0), new Point(c.x, c.y))
          );
          lastCubic = lastQuadratic = null;
          break;
      }
    }
    if (result.length != 0) {
      handle(result);
    }
  }
}
