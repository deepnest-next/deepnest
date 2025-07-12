import { Point } from "./point.js";
import { Matrix } from "./matrix.js";

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
   * Tests if a point is inside the polygon using the ray casting algorithm
   * @param point The point to test
   * @param tolerance Optional tolerance for numerical precision (default: 1e-10)
   * @returns true if point is inside, false if outside, null if exactly on edge
   */
  contains(point: Point, tolerance: number = 1e-10): boolean | null {
    if (this.points.length < 3) {
      return null;
    }

    let inside = false;
    const n = this.points.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.points[i].x;
      const yi = this.points[i].y;
      const xj = this.points[j].x;
      const yj = this.points[j].y;

      // Check if point is exactly on vertex
      if (
        Math.abs(point.x - xi) < tolerance &&
        Math.abs(point.y - yi) < tolerance
      ) {
        return null; // On vertex
      }

      // Skip very small edges
      if (
        Math.abs(xi - xj) < tolerance &&
        Math.abs(yi - yj) < tolerance
      ) {
        continue;
      }

      // Ray casting algorithm
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      
      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Tests if this polygon intersects with another polygon
   * @param other The other polygon to test intersection with
   * @returns true if polygons intersect, false otherwise
   */
  intersects(other: Polygon): boolean {
    // Quick bounding box check first
    const thisBounds = this.bounds();
    const otherBounds = other.bounds();
    
    if (
      thisBounds.x + thisBounds.width < otherBounds.x ||
      otherBounds.x + otherBounds.width < thisBounds.x ||
      thisBounds.y + thisBounds.height < otherBounds.y ||
      otherBounds.y + otherBounds.height < thisBounds.y
    ) {
      return false; // Bounding boxes don't overlap
    }

    // Check if any edges intersect
    for (let i = 0; i < this.points.length; i++) {
      const a1 = this.points[i];
      const a2 = this.points[(i + 1) % this.points.length];

      for (let j = 0; j < other.points.length; j++) {
        const b1 = other.points[j];
        const b2 = other.points[(j + 1) % other.points.length];

        if (this.lineSegmentsIntersect(a1, a2, b1, b2)) {
          return true;
        }
      }
    }

    // Check if one polygon is completely inside the other
    if (this.points.length > 0 && other.contains(this.points[0]) === true) {
      return true;
    }
    if (other.points.length > 0 && this.contains(other.points[0]) === true) {
      return true;
    }

    return false;
  }

  /**
   * Checks if this polygon is rectangular within a given tolerance
   * @param tolerance Optional tolerance for angle and side length comparison
   * @returns true if polygon is rectangular
   */
  isRectangle(tolerance: number = 1e-10): boolean {
    if (this.points.length !== 4) {
      return false;
    }

    const bounds = this.bounds();
    
    // Check if all points lie on the bounding box edges
    for (const point of this.points) {
      const onLeftEdge = Math.abs(point.x - bounds.x) < tolerance;
      const onRightEdge = Math.abs(point.x - (bounds.x + bounds.width)) < tolerance;
      const onBottomEdge = Math.abs(point.y - bounds.y) < tolerance;
      const onTopEdge = Math.abs(point.y - (bounds.y + bounds.height)) < tolerance;

      const onVerticalEdge = onLeftEdge || onRightEdge;
      const onHorizontalEdge = onBottomEdge || onTopEdge;

      if (!onVerticalEdge || !onHorizontalEdge) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper method to test if two line segments intersect
   * @param a1 First point of first line segment
   * @param a2 Second point of first line segment
   * @param b1 First point of second line segment
   * @param b2 Second point of second line segment
   * @returns true if line segments intersect (but not if they just touch at endpoints)
   */
  private lineSegmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
    const tolerance = 1e-10;

    // Calculate line parameters
    const a1x = a2.y - a1.y;
    const b1x = a1.x - a2.x;
    const c1 = a2.x * a1.y - a1.x * a2.y;
    
    const a2x = b2.y - b1.y;
    const b2x = b1.x - b2.x;
    const c2 = b2.x * b1.y - b1.x * b2.y;

    const denom = a1x * b2x - a2x * b1x;

    // Lines are parallel
    if (Math.abs(denom) < tolerance) {
      return false;
    }

    // Calculate intersection point
    const x = (b1x * c2 - b2x * c1) / denom;
    const y = (a2x * c1 - a1x * c2) / denom;

    // Check if intersection point is in the interior of both line segments (not at endpoints)
    const onSegmentAInterior = 
      Math.abs(a1.x - a2.x) <= tolerance ? 
        (a1.y <= a2.y ? y > a1.y + tolerance && y < a2.y - tolerance : y > a2.y + tolerance && y < a1.y - tolerance) :
        (a1.x <= a2.x ? x > a1.x + tolerance && x < a2.x - tolerance : x > a2.x + tolerance && x < a1.x - tolerance);

    const onSegmentBInterior = 
      Math.abs(b1.x - b2.x) <= tolerance ?
        (b1.y <= b2.y ? y > b1.y + tolerance && y < b2.y - tolerance : y > b2.y + tolerance && y < b1.y - tolerance) :
        (b1.x <= b2.x ? x > b1.x + tolerance && x < b2.x - tolerance : x > b2.x + tolerance && x < b1.x - tolerance);

    return onSegmentAInterior && onSegmentBInterior;
  }

  /**
   * Rotates the polygon by the specified angle in degrees around origin (0,0)
   * @param degrees Angle in degrees (positive = counterclockwise)
   * @returns New Polygon instance with rotated points
   */
  rotate(degrees: number): Polygon {
    if (degrees === 0) {
      return this.clone();
    }

    const angle = (degrees * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotatedPoints = this.points.map(p => {
      const x = p.x * cos - p.y * sin;
      const y = p.x * sin + p.y * cos;
      return new Point(x, y);
    });

    const rotated = new Polygon(rotatedPoints);
    
    // Rotate children if they exist
    if (this.children && this.children.length > 0) {
      rotated.children = this.children.map(child => child.rotate(degrees));
    }

    return rotated;
  }

  /**
   * Rotates the polygon by the specified angle around a given center point
   * @param degrees Angle in degrees (positive = counterclockwise)
   * @param center Center point of rotation
   * @returns New Polygon instance with rotated points
   */
  rotateAround(degrees: number, center: Point): Polygon {
    if (degrees === 0) {
      return this.clone();
    }

    // Translate to origin, rotate, then translate back
    return this.translate(-center.x, -center.y)
               .rotate(degrees)
               .translate(center.x, center.y);
  }

  /**
   * Translates the polygon by the specified offset
   * @param dx Horizontal offset
   * @param dy Vertical offset
   * @returns New Polygon instance with translated points
   */
  translate(dx: number, dy: number): Polygon {
    if (dx === 0 && dy === 0) {
      return this.clone();
    }

    const translatedPoints = this.points.map(p => 
      new Point(p.x + dx, p.y + dy)
    );

    const translated = new Polygon(translatedPoints);
    
    // Translate children if they exist
    if (this.children && this.children.length > 0) {
      translated.children = this.children.map(child => child.translate(dx, dy));
    }

    return translated;
  }

  /**
   * Scales the polygon by the specified factors around origin (0,0)
   * @param sx Horizontal scale factor
   * @param sy Vertical scale factor (defaults to sx for uniform scaling)
   * @returns New Polygon instance with scaled points
   */
  scale(sx: number, sy?: number): Polygon {
    if (sy === undefined) {
      sy = sx; // Uniform scaling
    }

    if (sx === 1 && sy === 1) {
      return this.clone();
    }

    const scaledPoints = this.points.map(p => 
      new Point(p.x * sx, p.y * sy!)
    );

    const scaled = new Polygon(scaledPoints);
    
    // Scale children if they exist
    if (this.children && this.children.length > 0) {
      scaled.children = this.children.map(child => child.scale(sx, sy));
    }

    return scaled;
  }

  /**
   * Scales the polygon around a given center point
   * @param sx Horizontal scale factor
   * @param sy Vertical scale factor (defaults to sx for uniform scaling)
   * @param center Center point of scaling
   * @returns New Polygon instance with scaled points
   */
  scaleAround(sx: number, sy: number | undefined, center: Point): Polygon {
    if (sy === undefined) {
      sy = sx; // Uniform scaling
    }

    if (sx === 1 && sy === 1) {
      return this.clone();
    }

    // Translate to origin, scale, then translate back
    return this.translate(-center.x, -center.y)
               .scale(sx, sy)
               .translate(center.x, center.y);
  }

  /**
   * Applies a transformation matrix to the polygon
   * @param matrix The transformation matrix to apply
   * @returns New Polygon instance with transformed points
   */
  transform(matrix: Matrix): Polygon {
    if (matrix.isIdentity()) {
      return this.clone();
    }

    const transformedPoints = this.points.map(p => matrix.calc(p));
    const transformed = new Polygon(transformedPoints);
    
    // Transform children if they exist
    if (this.children && this.children.length > 0) {
      transformed.children = this.children.map(child => child.transform(matrix));
    }

    return transformed;
  }

  /**
   * String representation of the polygon
   */
  toString(): string {
    const pointsStr = this.points.map((p) => p.toString()).join(", ");
    return `Polygon([${pointsStr}])`;
  }
}
