import { AxisAlignedRectangle } from "./axisalignedrectangle";
import { Polygon } from "./polygon";

/// A Shape is composed a collection of polygons, which represent either a Piece or a Hole. These
/// polygons are placed with respect to one another (for example, imagine the string "Hello World"
/// as text to be cut into a spray-paint template; the letter H and the letter e should remain in
/// the same orientation). They may also include sub-shapes, which should be of the opposite type.
/// For example, using the wasted material inside the letter o, we could cut another shape if a
/// suitable one is available.
export class Shape {
    source: Element;
    item: Array<Polygon>;
    inner: Array<Polygon>;
    bounds: AxisAlignedRectangle;
    area: number;
    quantity: number;
    filename: String;
    svgelement: SVGElement;
    selected: boolean;
    sheet: boolean;

    constructor(source: Element,
      item: Array<Polygon>,
      inner: Array<Polygon>,
      quantity: number,
      filename: String,
      svgelement: SVGElement,
      selected: boolean,
      sheet: boolean) {
      this.source = source;
      this.item = item;
      if (item.length == 0) {
        throw new Error("No contents in Shape!");
      }
      this.inner = inner;
      this.bounds = AxisAlignedRectangle.around(item);
      this.area = this.bounds.width * this.bounds.height;
      this.quantity = quantity;
      this.filename = filename;
      this.svgelement = svgelement;
      this.selected = selected;
      this.sheet = sheet;
    }
  
    map(f: (input: Polygon) => Polygon) : Shape {
      return new Shape(
        this.source,
        this.item.map(f),
        this.inner.map(f),
        this.quantity,
        this.filename,
        this.svgelement,
        this.selected,
        this.sheet);
    }
    rotate(angle: number): Shape {
      return this.map(p => p.rotate(angle));
    }
    translate(dx: number, dy: number): Shape {
      return this.map(p => p.translate(dx, dy));
    }
    simplify(inside: boolean): Shape {
      return this.map(p => p.simplify(inside));
    }
}
