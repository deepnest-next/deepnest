import { Point } from "./point.js";
import { Vector } from "./vector.js";
import { GEOMETRIC_TOLERANCE, DEG_TO_RAD, TWO_PI, DEFAULT_CIRCLE_SEGMENTS } from "./constants.js";

function _almostEqual(a: number, b: number, tolerance?: number): boolean {
  if (!tolerance) {
    tolerance = GEOMETRIC_TOLERANCE;
  }
  return Math.abs(a - b) < tolerance;
}

function _onSegment(p1: Point, p2: Point, point: Point, tolerance: number): boolean {
  // Check if point lies on line segment p1-p2
  const d1 = point.distanceTo(p1);
  const d2 = point.distanceTo(p2);
  const lineLength = p1.distanceTo(p2);
  
  return _almostEqual(d1 + d2, lineLength, tolerance);
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Polygon {
  private _points: Point[];
  public offsetx: number = 0;
  public offsety: number = 0;
  public rotation: number = 0;
  public id?: string;
  public children?: Polygon[];

  constructor(points: Point[] = []) {
    this._points = [...points];
  }

  get points(): Point[] {
    return this._points;
  }

  get length(): number {
    return this._points.length;
  }

  addPoint(point: Point): void {
    this._points.push(point);
  }

  getPoint(index: number): Point | undefined {
    return this._points[index];
  }

  setPoint(index: number, point: Point): void {
    if (index >= 0 && index < this._points.length) {
      this._points[index] = point;
    }
  }

  removePoint(index: number): Point | undefined {
    if (index >= 0 && index < this._points.length) {
      return this._points.splice(index, 1)[0];
    }
    return undefined;
  }

  clear(): void {
    this._points = [];
  }

  clone(): Polygon {
    const cloned = new Polygon();
    cloned._points = this._points.map(p => new Point(p.x, p.y));
    cloned.offsetx = this.offsetx;
    cloned.offsety = this.offsety;
    cloned.rotation = this.rotation;
    cloned.id = this.id;
    cloned.children = this.children?.map(child => child.clone());
    return cloned;
  }

  area(): number {
    if (this._points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0, j = this._points.length - 1; i < this._points.length; j = i++) {
      area += (this._points[j].x + this._points[i].x) * (this._points[j].y - this._points[i].y);
    }
    return 0.5 * area;
  }

  bounds(): BoundingBox | null {
    if (this._points.length < 3) return null;

    let xmin = this._points[0].x;
    let xmax = this._points[0].x;
    let ymin = this._points[0].y;
    let ymax = this._points[0].y;

    for (let i = 1; i < this._points.length; i++) {
      const point = this._points[i];
      if (point.x > xmax) xmax = point.x;
      else if (point.x < xmin) xmin = point.x;
      
      if (point.y > ymax) ymax = point.y;
      else if (point.y < ymin) ymin = point.y;
    }

    return {
      x: xmin,
      y: ymin,
      width: xmax - xmin,
      height: ymax - ymin
    };
  }

  centroid(): Point {
    if (this._points.length === 0) return new Point(0, 0);
    
    let cx = 0;
    let cy = 0;
    let area = 0;
    
    for (let i = 0, j = this._points.length - 1; i < this._points.length; j = i++) {
      const xi = this._points[i].x;
      const yi = this._points[i].y;
      const xj = this._points[j].x;
      const yj = this._points[j].y;
      
      const a = xi * yj - xj * yi;
      area += a;
      cx += (xi + xj) * a;
      cy += (yi + yj) * a;
    }
    
    area *= 0.5;
    if (Math.abs(area) < GEOMETRIC_TOLERANCE) {
      // Fallback to simple average for degenerate polygons
      let sumX = 0, sumY = 0;
      for (const point of this._points) {
        sumX += point.x;
        sumY += point.y;
      }
      return new Point(sumX / this._points.length, sumY / this._points.length);
    }
    
    return new Point(cx / (6 * area), cy / (6 * area));
  }

  perimeter(): number {
    if (this._points.length < 2) return 0;
    
    let length = 0;
    for (let i = 0, j = this._points.length - 1; i < this._points.length; j = i++) {
      length += this._points[i].distanceTo(this._points[j]);
    }
    return length;
  }

  contains(point: Point, tolerance: number = GEOMETRIC_TOLERANCE): boolean | null {
    if (this._points.length < 3) return null;

    let inside = false;
    
    for (let i = 0, j = this._points.length - 1; i < this._points.length; j = i++) {
      const xi = this._points[i].x + this.offsetx;
      const yi = this._points[i].y + this.offsety;
      const xj = this._points[j].x + this.offsetx;
      const yj = this._points[j].y + this.offsety;

      // Check if point is exactly on a vertex
      if (_almostEqual(xi, point.x, tolerance) && _almostEqual(yi, point.y, tolerance)) {
        return null; // exactly on vertex
      }

      // Check if point is exactly on an edge
      if (_onSegment(new Point(xi, yi), new Point(xj, yj), point, tolerance)) {
        return null; // exactly on edge
      }

      // Skip very small edges
      if (_almostEqual(xi, xj, tolerance) && _almostEqual(yi, yj, tolerance)) {
        continue;
      }

      // Ray casting algorithm
      const intersect = yi > point.y != yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  translate(dx: number, dy: number): Polygon {
    const translated = this.clone();
    translated.offsetx += dx;
    translated.offsety += dy;
    return translated;
  }

  translateInPlace(dx: number, dy: number): void {
    this.offsetx += dx;
    this.offsety += dy;
  }

  rotate(angle: number, origin?: Point): Polygon {
    const rotated = this.clone();
    rotated.rotateInPlace(angle, origin);
    return rotated;
  }

  rotateInPlace(angle: number, origin?: Point): void {
    const angleRad = angle * DEG_TO_RAD;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);
    
    const center = origin || this.centroid();
    
    for (let i = 0; i < this._points.length; i++) {
      const point = this._points[i];
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      
      this._points[i] = new Point(
        center.x + dx * cosAngle - dy * sinAngle,
        center.y + dx * sinAngle + dy * cosAngle
      );
    }
    
    this.rotation += angle;
  }

  scale(factor: number, origin?: Point): Polygon {
    const scaled = this.clone();
    scaled.scaleInPlace(factor, origin);
    return scaled;
  }

  scaleInPlace(factor: number, origin?: Point): void {
    const center = origin || this.centroid();
    
    for (let i = 0; i < this._points.length; i++) {
      const point = this._points[i];
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      
      this._points[i] = new Point(
        center.x + dx * factor,
        center.y + dy * factor
      );
    }
  }

  isRectangle(tolerance: number = GEOMETRIC_TOLERANCE): boolean {
    if (this._points.length !== 4) return false;
    
    // Check if all angles are approximately 90 degrees
    for (let i = 0; i < 4; i++) {
      const p1 = this._points[i];
      const p2 = this._points[(i + 1) % 4];
      const p3 = this._points[(i + 2) % 4];
      
      const v1 = p1.to(p2);
      const v2 = p2.to(p3);
      
      const dot = v1.dot(v2);
      if (!_almostEqual(dot, 0, tolerance)) {
        return false;
      }
    }
    
    return true;
  }

  reverse(): Polygon {
    const reversed = this.clone();
    reversed._points.reverse();
    return reversed;
  }

  reverseInPlace(): void {
    this._points.reverse();
  }

  isClockwise(): boolean {
    return this.area() < 0;
  }

  ensureClockwise(): void {
    if (!this.isClockwise()) {
      this.reverseInPlace();
    }
  }

  ensureCounterClockwise(): void {
    if (this.isClockwise()) {
      this.reverseInPlace();
    }
  }

  // Get the normal vector for an edge at the given index
  getEdgeNormal(index: number): Vector | null {
    if (index < 0 || index >= this._points.length) return null;
    
    const p1 = this._points[index];
    const p2 = this._points[(index + 1) % this._points.length];
    
    const edge = p1.to(p2);
    // Return perpendicular vector (rotated 90 degrees counterclockwise)
    return new Vector(-edge.dy, edge.dx).normalized();
  }

  // Get the edge vector at the given index
  getEdgeVector(index: number): Vector | null {
    if (index < 0 || index >= this._points.length) return null;
    
    const p1 = this._points[index];
    const p2 = this._points[(index + 1) % this._points.length];
    
    return p1.to(p2);
  }

  toArray(): Array<{x: number, y: number}> {
    return this._points.map(p => ({ x: p.x, y: p.y }));
  }

  toClipperFormat(scale: number = 1): Array<{X: number, Y: number}> {
    return this._points.map(p => ({
      X: Math.round(p.x * scale),
      Y: Math.round(p.y * scale)
    }));
  }

  static fromArray(points: Array<{x: number, y: number}>): Polygon {
    const polygon = new Polygon();
    polygon._points = points.map(p => new Point(p.x, p.y));
    return polygon;
  }

  static fromClipperFormat(points: Array<{X: number, Y: number}>, scale: number = 1): Polygon {
    const polygon = new Polygon();
    polygon._points = points.map(p => new Point(p.X / scale, p.Y / scale));
    return polygon;
  }

  static createRectangle(x: number, y: number, width: number, height: number): Polygon {
    return new Polygon([
      new Point(x, y),
      new Point(x + width, y),
      new Point(x + width, y + height),
      new Point(x, y + height)
    ]);
  }

  static createCircle(centerX: number, centerY: number, radius: number, segments: number = DEFAULT_CIRCLE_SEGMENTS): Polygon {
    const points: Point[] = [];
    const angleStep = TWO_PI / segments;
    
    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(new Point(x, y));
    }
    
    return new Polygon(points);
  }

  toString(): string {
    return `Polygon[${this._points.length} points, area=${this.area().toFixed(2)}]`;
  }
}

// Export to global scope for compatibility with existing JavaScript files
declare global {
  interface Window {
    Polygon: typeof Polygon;
  }
}

if (typeof window !== 'undefined') {
  window.Polygon = Polygon;
}