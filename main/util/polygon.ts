import { Point } from "./point.js";

// Type definition for bounding box
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A class representing a polygon with comprehensive geometric operations.
 * Supports nested polygons (holes) and provides methods for all common polygon operations.
 */
export class Polygon {
  /** The vertices of the polygon */
  public readonly points: Point[];

  /** Child polygons representing holes */
  public children?: Polygon[];

  /** Cached values for expensive computations */
  private _area?: number;
  private _bounds?: BoundingBox;
  private _perimeter?: number;
  private _centroid?: Point;

  /**
   * Creates a new Polygon from an array of Points
   * @param points Array of Point objects defining the polygon vertices
   * @throws Error if less than 3 points are provided
   */
  constructor(points: Point[]) {
    if (points.length < 3) {
      throw new Error("Polygon must have at least 3 points");
    }

    // Deep copy points to ensure immutability
    this.points = points.map((p) => new Point(p.x, p.y));
  }

  /**
   * Creates a Polygon from an array of coordinate objects
   * @param coords Array of objects with x and y properties
   * @returns New Polygon instance
   */
  static fromArray(coords: { x: number; y: number }[]): Polygon {
    const points = coords.map((coord) => new Point(coord.x, coord.y));
    return new Polygon(points);
  }

  /**
   * Converts the polygon to an array of coordinate objects
   * @returns Array of objects with x and y properties
   */
  toArray(): { x: number; y: number }[] {
    return this.points.map((p) => ({ x: p.x, y: p.y }));
  }

  /**
   * Creates a deep copy of this polygon
   * @returns New Polygon instance with copied points and children
   */
  clone(): Polygon {
    const cloned = new Polygon(this.points);

    if (this.children && this.children.length > 0) {
      cloned.children = this.children.map((child) => child.clone());
    }

    return cloned;
  }

  /**
   * Checks if the polygon is valid (has at least 3 non-collinear points)
   * @returns true if the polygon is valid
   */
  isValid(): boolean {
    if (this.points.length < 3) {
      return false;
    }

    // Check for collinear points (all points on same line)
    // Calculate cross product to detect if points form a proper polygon
    let hasNonZeroCross = false;

    for (let i = 0; i < this.points.length; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % this.points.length];
      const p3 = this.points[(i + 2) % this.points.length];

      // Cross product of vectors p1->p2 and p2->p3
      const cross =
        (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);

      if (Math.abs(cross) > 1e-10) {
        hasNonZeroCross = true;
        break;
      }
    }

    return hasNonZeroCross;
  }

  /**
   * Gets the number of vertices in the polygon
   */
  get length(): number {
    return this.points.length;
  }

  /**
   * Clears all cached computed values
   * Should be called when the polygon is modified
   */
  private clearCache(): void {
    this._area = undefined;
    this._bounds = undefined;
    this._perimeter = undefined;
    this._centroid = undefined;
  }

  /**
   * Calculates the signed area of the polygon
   * Positive area indicates counter-clockwise winding, negative indicates clockwise
   * @returns The signed area of the polygon
   */
  area(): number {
    if (this._area !== undefined) {
      return this._area;
    }

    let area = 0;
    const n = this.points.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      area += (this.points[j].x + this.points[i].x) * (this.points[j].y - this.points[i].y);
    }
    
    this._area = area / 2;
    return this._area;
  }

  /**
   * Calculates the bounding box of the polygon
   * @returns BoundingBox containing x, y, width, height
   */
  bounds(): BoundingBox {
    if (this._bounds !== undefined) {
      return this._bounds;
    }

    if (this.points.length === 0) {
      this._bounds = { x: 0, y: 0, width: 0, height: 0 };
      return this._bounds;
    }

    let xmin = this.points[0].x;
    let xmax = this.points[0].x;
    let ymin = this.points[0].y;
    let ymax = this.points[0].y;

    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      if (point.x > xmax) {
        xmax = point.x;
      } else if (point.x < xmin) {
        xmin = point.x;
      }

      if (point.y > ymax) {
        ymax = point.y;
      } else if (point.y < ymin) {
        ymin = point.y;
      }
    }

    this._bounds = {
      x: xmin,
      y: ymin,
      width: xmax - xmin,
      height: ymax - ymin,
    };
    
    return this._bounds;
  }

  /**
   * Calculates the centroid (center of mass) of the polygon
   * @returns Point representing the centroid
   */
  centroid(): Point {
    if (this._centroid !== undefined) {
      return this._centroid;
    }

    let x = 0;
    let y = 0;
    let k = 0;
    const n = this.points.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const a = this.points[j];
      const b = this.points[i];
      const c = a.x * b.y - b.x * a.y;
      k += c;
      x += (a.x + b.x) * c;
      y += (a.y + b.y) * c;
    }

    k *= 3;
    this._centroid = new Point(x / k, y / k);
    return this._centroid;
  }

  /**
   * Calculates the perimeter (total edge length) of the polygon
   * @returns The perimeter length
   */
  perimeter(): number {
    if (this._perimeter !== undefined) {
      return this._perimeter;
    }

    let perimeter = 0;
    const n = this.points.length;

    for (let i = 0; i < n; i++) {
      const current = this.points[i];
      const next = this.points[(i + 1) % n];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      perimeter += Math.hypot(dx, dy);
    }

    this._perimeter = perimeter;
    return this._perimeter;
  }

  /**
   * String representation of the polygon
   */
  toString(): string {
    const pointsStr = this.points.map((p) => p.toString()).join(", ");
    return `Polygon([${pointsStr}])`;
  }
}
