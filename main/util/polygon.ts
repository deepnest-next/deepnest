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
  // These will be added in Phase 1.2
  // private _area?: number;
  // private _bounds?: BoundingBox;
  // private _perimeter?: number;
  // private _centroid?: Point;

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
  // This will be implemented in Phase 1.2 when cache properties are added
  // private clearCache(): void {
  //   this._area = undefined;
  //   this._bounds = undefined;
  //   this._perimeter = undefined;
  //   this._centroid = undefined;
  // }

  /**
   * String representation of the polygon
   */
  toString(): string {
    const pointsStr = this.points.map((p) => p.toString()).join(", ");
    return `Polygon([${pointsStr}])`;
  }
}
