import { Point } from "./point";
import { Polygon } from "./polygon";

export class AxisAlignedRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    static around(ps: Polygon[]) : AxisAlignedRectangle {
      let xmin = Infinity;
      let xmax = -Infinity;
      let ymin = Infinity;
      let ymax = -Infinity;
      for (const p of ps) {
        const b = p.getBounds();
        xmin = Math.min(xmin, b.x);
        xmax = Math.max(xmax, b.x + b.width);
        ymin = Math.min(ymin, b.y);
        ymax = Math.max(ymax, b.y + b.height);
      }
      return new AxisAlignedRectangle(xmin, ymin, xmax - xmin, ymax - ymin);
    }
  
    asPolygon(): Polygon {
      var frame = [];
      frame.push(new Point(this.x, this.y));
      frame.push(new Point(this.x + this.width, this.y));
      frame.push(new Point(this.x + this.width, this.y + this.height));
      frame.push(new Point(this.x, this.y + this.height));
  
      return new Polygon(frame);
    }
  }
  