import { Point } from "./point.js";
import { Matrix } from "./matrix.js";
import { HullPolygon } from "./HullPolygon.js";

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
  // private clearCache(): void {
  //   this._area = undefined;
  //   this._bounds = undefined;
  //   this._perimeter = undefined;
  //   this._centroid = undefined;
  // }

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
   * Simplifies the polygon using Douglas-Peucker algorithm
   * @param tolerance The tolerance for simplification (larger = more simplified)
   * @param preserveCorners Whether to preserve sharp corners
   * @returns New simplified Polygon instance
   */
  simplify(tolerance: number, preserveCorners: boolean = false): Polygon {
    if (tolerance <= 0 || this.points.length < 3) {
      return this.clone();
    }

    // Try to use external simplify function, fallback to basic simplification
    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const simplifyFn = (globalScope as any)?.deepnest?.simplifyPolygon;
      
      if (simplifyFn) {
        // Convert to polyline format (closed polygon with duplicate first/last point)
        const polyline = [...this.points.map(p => ({ x: p.x, y: p.y }))];
        polyline.push(polyline[0]);

        // Mark long segments to preserve if preserveCorners is true
        if (preserveCorners) {
          const fixedTolerance = (40 * tolerance) ** 2;
          for (let i = 0; i < polyline.length - 1; i++) {
            const p1 = polyline[i];
            const p2 = polyline[i + 1];
            const sqd = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
            if (sqd > fixedTolerance) {
              (p1 as any).marked = true;
              (p2 as any).marked = true;
            }
          }
        }

        const simplified = simplifyFn(polyline, tolerance, true) || polyline;
        
        // Remove duplicate last point
        if (simplified.length > 0) {
          simplified.pop();
        }

        if (simplified.length >= 3) {
          const simplifiedPoints = simplified.map((p: any) => new Point(p.x, p.y));
          const result = new Polygon(simplifiedPoints);

          // Simplify children if they exist
          if (this.children && this.children.length > 0) {
            result.children = this.children.map(child => child.simplify(tolerance, preserveCorners));
          }

          return result;
        }
      }
    } catch (error) {
      // Fall through to basic simplification
    }

    // Fallback: basic simplification - just return the polygon
    // In a production environment, we could implement a basic RDP algorithm here
    return this.clone();
  }

  /**
   * Creates offset polygons at the specified distance
   * Positive distance creates outward offset, negative creates inward offset
   * @param distance The offset distance
   * @returns Array of new Polygon instances representing the offset
   */
  offset(distance: number): Polygon[] {
    if (distance === 0 || this.points.length < 3) {
      return [this.clone()];
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      
      if (ClipperLib) {
        // Convert to Clipper format
        const clipperPoly = this.toClipperPath();
        
        // Create clipper offset
        const miterLimit = 4;
        const arcTolerance = 0.3 * 10000000; // Default curve tolerance scaled
        const co = new ClipperLib.ClipperOffset(miterLimit, arcTolerance);
        
        co.AddPath(
          clipperPoly,
          ClipperLib.JoinType.jtMiter,
          ClipperLib.EndType.etClosedPolygon
        );

        const offsetPaths = new ClipperLib.Paths();
        co.Execute(offsetPaths, distance * 10000000);

        // Convert back to Polygon instances
        const results: Polygon[] = [];
        for (let i = 0; i < offsetPaths.length; i++) {
          const polygon = this.fromClipperPath(offsetPaths[i]);
          if (polygon && polygon.points.length >= 3) {
            results.push(polygon);
          }
        }

        return results.length > 0 ? results : [this.clone()];
      }
    } catch (error) {
      // Fall through to fallback
    }

    // Fallback: return original polygon if Clipper is not available
    return [this.clone()];
  }

  /**
   * Cleans the polygon by removing self-intersections and degenerate features
   * @param tolerance Optional tolerance for cleaning (default: 1e-10)
   * @returns New cleaned Polygon instance or null if polygon becomes invalid
   */
  clean(tolerance: number = 1e-10): Polygon | null {
    if (this.points.length < 3) {
      return null;
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      
      if (ClipperLib) {
        // Convert to Clipper format
        const clipperPoly = this.toClipperPath();

        // Remove self-intersections
        const simplified = ClipperLib.Clipper.SimplifyPolygon(
          clipperPoly,
          ClipperLib.PolyFillType.pftNonZero
        );

        if (!simplified || simplified.length === 0) {
          return null;
        }

        // Find the largest remaining polygon
        let biggest = simplified[0];
        let biggestArea = Math.abs(ClipperLib.Clipper.Area(biggest));
        
        for (let i = 1; i < simplified.length; i++) {
          const area = Math.abs(ClipperLib.Clipper.Area(simplified[i]));
          if (area > biggestArea) {
            biggest = simplified[i];
            biggestArea = area;
          }
        }

        // Clean up singularities and coincident points
        const cleaned = ClipperLib.Clipper.CleanPolygon(
          biggest,
          tolerance * 10000000 // Scale tolerance to clipper coordinates
        );

        if (!cleaned || cleaned.length === 0) {
          return null;
        }

        const result = this.fromClipperPath(cleaned);
        if (!result || result.points.length < 3) {
          return null;
        }

        // Remove duplicate endpoints
        const start = result.points[0];
        const end = result.points[result.points.length - 1];
        if (Math.abs(start.x - end.x) < tolerance && Math.abs(start.y - end.y) < tolerance) {
          result.points.pop();
        }

        // Clean children if they exist
        if (this.children && this.children.length > 0) {
          result.children = this.children
            .map(child => child.clean(tolerance))
            .filter(child => child !== null) as Polygon[];
        }

        return result.points.length >= 3 ? result : null;
      }
    } catch (error) {
      // Fall through to fallback
    }

    // Fallback: basic cleaning - just remove duplicate endpoints
    const result = this.clone();
    const start = result.points[0];
    const end = result.points[result.points.length - 1];
    if (Math.abs(start.x - end.x) < tolerance && Math.abs(start.y - end.y) < tolerance) {
      result.points.pop();
    }

    return result.points.length >= 3 ? result : null;
  }

  /**
   * Calculates the convex hull of the polygon
   * @returns New Polygon instance representing the convex hull
   */
  hull(): Polygon {
    if (this.points.length < 3) {
      return this.clone();
    }

    // Use the imported HullPolygon class
    const hullPoints = HullPolygon.hull(this.points);
    
    if (!hullPoints || hullPoints.length < 3) {
      return this.clone();
    }

    return new Polygon(hullPoints);
  }

  /**
   * Converts polygon to Clipper library format
   * @param scale Optional scale factor (default: 10000000)
   * @returns Clipper path
   */
  private toClipperPath(scale: number = 10000000): any {
    const clipperPath = this.points.map(p => ({
      X: p.x,
      Y: p.y
    }));

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      if (ClipperLib?.JS?.ScaleUpPath) {
        ClipperLib.JS.ScaleUpPath(clipperPath, scale);
      } else {
        // Manual scaling if ClipperLib is not available
        clipperPath.forEach(p => {
          p.X *= scale;
          p.Y *= scale;
        });
      }
    } catch (error) {
      // Manual scaling fallback
      clipperPath.forEach(p => {
        p.X *= scale;
        p.Y *= scale;
      });
    }

    return clipperPath;
  }

  /**
   * Converts from Clipper library format to Polygon
   * @param clipperPath Clipper path
   * @param scale Optional scale factor (default: 10000000)
   * @returns New Polygon instance
   */
  private fromClipperPath(clipperPath: any, scale: number = 10000000): Polygon | null {
    if (!clipperPath || clipperPath.length < 3) {
      return null;
    }

    const points = clipperPath.map((cp: any) => new Point(
      cp.X / scale,
      cp.Y / scale
    ));

    return new Polygon(points);
  }

  /**
   * Calculates the No-Fit Polygon (NFP) between two polygons
   * The NFP represents all positions where polygon B can be placed relative to polygon A without overlap
   * @param A The stationary polygon
   * @param B The moving polygon  
   * @param inside Whether to calculate interior NFP (B inside A) or exterior NFP
   * @returns Array of NFP polygons
   */
  static noFitPolygon(A: Polygon, B: Polygon, inside: boolean = false): Polygon[] {
    if (!A || A.points.length < 3 || !B || B.points.length < 3) {
      return [];
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const addon = (globalScope as any)?.addon;
      
      if (addon?.calculateNFP) {
        // Use native addon for NFP calculation (most accurate and fast)
        const result = addon.calculateNFP(
          A.toArray(),
          B.toArray(),
          inside
        );
        
        if (result && Array.isArray(result)) {
          return result.map((nfpPoints: any) => {
            if (Array.isArray(nfpPoints) && nfpPoints.length >= 3) {
              return Polygon.fromArray(nfpPoints);
            }
            return null;
          }).filter((p: Polygon | null) => p !== null) as Polygon[];
        }
      }

      // Fallback to JavaScript implementation
      const GeometryUtil = (globalScope as any)?.GeometryUtil;
      if (GeometryUtil?.noFitPolygon) {
        const result = GeometryUtil.noFitPolygon(
          A.toArray(),
          B.toArray(),
          inside
        );
        
        if (result && Array.isArray(result)) {
          return result.map((nfpPoints: any) => {
            if (Array.isArray(nfpPoints) && nfpPoints.length >= 3) {
              return Polygon.fromArray(nfpPoints);
            }
            return null;
          }).filter((p: Polygon | null) => p !== null) as Polygon[];
        }
      }
    } catch (error) {
      console.warn('NFP calculation failed:', error);
    }

    // Fallback: return empty array if NFP calculation is not available
    return [];
  }

  /**
   * Optimized NFP calculation for rectangular polygons
   * @param A The stationary rectangular polygon
   * @param B The moving rectangular polygon
   * @returns Array containing the rectangular NFP, or empty array if not applicable
   */
  static noFitPolygonRectangle(A: Polygon, B: Polygon): Polygon[] {
    if (!A || A.points.length !== 4 || !B || B.points.length !== 4) {
      return [];
    }

    if (!A.isRectangle() || !B.isRectangle()) {
      return [];
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const GeometryUtil = (globalScope as any)?.GeometryUtil;
      
      if (GeometryUtil?.noFitPolygonRectangle) {
        const result = GeometryUtil.noFitPolygonRectangle(
          A.toArray(),
          B.toArray()
        );
        
        if (result && Array.isArray(result) && result.length > 0) {
          return result.map((nfpPoints: any) => {
            if (Array.isArray(nfpPoints) && nfpPoints.length >= 3) {
              return Polygon.fromArray(nfpPoints);
            }
            return null;
          }).filter((p: Polygon | null) => p !== null) as Polygon[];
        }
      }

      // Manual calculation for rectangles
      const boundsA = A.bounds();
      const boundsB = B.bounds();

      // Check if B can fit inside A
      if (boundsB.width > boundsA.width || boundsB.height > boundsA.height) {
        return [];
      }

      // Calculate the NFP as a rectangle representing valid placement positions
      const nfpBounds = {
        x: boundsA.x - boundsB.x,
        y: boundsA.y - boundsB.y,
        width: boundsA.width - boundsB.width,
        height: boundsA.height - boundsB.height
      };

      if (nfpBounds.width <= 0 || nfpBounds.height <= 0) {
        return [];
      }

      const nfpPoints = [
        new Point(nfpBounds.x, nfpBounds.y),
        new Point(nfpBounds.x + nfpBounds.width, nfpBounds.y),
        new Point(nfpBounds.x + nfpBounds.width, nfpBounds.y + nfpBounds.height),
        new Point(nfpBounds.x, nfpBounds.y + nfpBounds.height)
      ];

      return [new Polygon(nfpPoints)];
    } catch (error) {
      console.warn('Rectangle NFP calculation failed:', error);
      return [];
    }
  }

  /**
   * Merges two touching polygons into a single polygon representing their combined outer perimeter
   * @param other The other polygon to merge with this one
   * @returns New Polygon representing the merged outer perimeter, or null if merge fails
   */
  merge(other: Polygon): Polygon | null {
    if (!other || other.points.length < 3) {
      return null;
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const GeometryUtil = (globalScope as any)?.GeometryUtil;
      
      if (GeometryUtil?.polygonHull) {
        // Add offset properties that the original function expects
        const thisArray = this.toArray();
        const otherArray = other.toArray();
        (thisArray as any).offsetx = 0;
        (thisArray as any).offsety = 0;
        (otherArray as any).offsetx = 0;
        (otherArray as any).offsety = 0;

        const result = GeometryUtil.polygonHull(thisArray, otherArray);
        
        if (result && Array.isArray(result) && result.length >= 3) {
          return Polygon.fromArray(result);
        }
      }

      // Fallback: use convex hull of combined points
      const combinedPoints = [...this.points, ...other.points];
      const combinedPolygon = new Polygon(combinedPoints);
      return combinedPolygon.hull();
    } catch (error) {
      console.warn('Polygon merge failed:', error);
      return null;
    }
  }

  /**
   * Calculates the minimum distance this polygon would need to slide in the given direction
   * to avoid overlap with another polygon
   * @param other The other polygon to avoid
   * @param direction The direction vector to slide in
   * @param ignoreNegative Whether to ignore negative distances (default: false)
   * @returns The minimum slide distance, or null if no collision would occur
   */
  slideDistance(other: Polygon, direction: Point, ignoreNegative: boolean = false): number | null {
    if (!other || other.points.length < 3 || this.points.length < 3) {
      return null;
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const GeometryUtil = (globalScope as any)?.GeometryUtil;
      
      if (GeometryUtil?.polygonSlideDistance) {
        // Convert to arrays and add offset properties
        const thisArray = this.toArray();
        const otherArray = other.toArray();
        (thisArray as any).offsetx = 0;
        (thisArray as any).offsety = 0;
        (otherArray as any).offsetx = 0;
        (otherArray as any).offsety = 0;

        return GeometryUtil.polygonSlideDistance(
          thisArray,
          otherArray,
          direction,
          ignoreNegative
        );
      }
    } catch (error) {
      console.warn('Slide distance calculation failed:', error);
    }

    // Fallback: basic implementation using bounding boxes
    return this.fallbackSlideDistance(other, direction, ignoreNegative);
  }

  /**
   * Projects each point of another polygon onto this polygon in the given direction
   * and returns the minimum projection distance
   * @param other The polygon to project onto this one
   * @param direction The projection direction vector
   * @returns The minimum projection distance, or null if projection fails
   */
  projectionDistance(other: Polygon, direction: Point): number | null {
    if (!other || other.points.length < 3 || this.points.length < 3) {
      return null;
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const GeometryUtil = (globalScope as any)?.GeometryUtil;
      
      if (GeometryUtil?.polygonProjectionDistance) {
        // Convert to arrays and add offset properties
        const thisArray = this.toArray();
        const otherArray = other.toArray();
        (thisArray as any).offsetx = 0;
        (thisArray as any).offsety = 0;
        (otherArray as any).offsetx = 0;
        (otherArray as any).offsety = 0;

        return GeometryUtil.polygonProjectionDistance(
          thisArray,
          otherArray,
          direction
        );
      }
    } catch (error) {
      console.warn('Projection distance calculation failed:', error);
    }

    // Fallback: return null if GeometryUtil is not available
    return null;
  }

  /**
   * Calculates the distance from a point to a line segment in a given direction
   * @param point The point to measure from
   * @param segmentStart First point of the line segment
   * @param segmentEnd Second point of the line segment
   * @param direction The direction vector (normal to the measurement direction)
   * @param infinite Whether to treat the segment as an infinite line (default: false)
   * @returns The distance, or null if no intersection
   */
  static pointToSegmentDistance(
    point: Point,
    segmentStart: Point,
    segmentEnd: Point,
    direction: Point,
    infinite: boolean = false
  ): number | null {
    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const GeometryUtil = (globalScope as any)?.GeometryUtil;
      
      if (GeometryUtil?.pointDistance) {
        return GeometryUtil.pointDistance(
          point,
          segmentStart,
          segmentEnd,
          direction,
          infinite
        );
      }
    } catch (error) {
      console.warn('Point to segment distance calculation failed:', error);
    }

    // Fallback: simple perpendicular distance calculation
    return Polygon.fallbackPointToSegmentDistance(point, segmentStart, segmentEnd, direction, infinite);
  }

  /**
   * Calculates the distance between this polygon and another polygon
   * @param other The other polygon
   * @returns The minimum distance between the polygons (0 if they intersect)
   */
  distanceTo(other: Polygon): number {
    if (!other || other.points.length < 3 || this.points.length < 3) {
      return Infinity;
    }

    // Quick check for intersection
    if (this.intersects(other)) {
      return 0;
    }

    // Find minimum distance between all edges
    let minDistance = Infinity;

    for (let i = 0; i < this.points.length; i++) {
      const thisStart = this.points[i];
      const thisEnd = this.points[(i + 1) % this.points.length];

      for (let j = 0; j < other.points.length; j++) {
        const otherStart = other.points[j];
        const otherEnd = other.points[(j + 1) % other.points.length];

        const distance = this.segmentToSegmentDistance(thisStart, thisEnd, otherStart, otherEnd);
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }

    return minDistance;
  }

  /**
   * Fallback implementation for slide distance using bounding box approximation
   */
  private fallbackSlideDistance(other: Polygon, direction: Point, ignoreNegative: boolean): number | null {
    const thisBounds = this.bounds();
    const otherBounds = other.bounds();

    // Normalize direction vector
    const length = Math.hypot(direction.x, direction.y);
    if (length === 0) return null;
    
    const normalizedDir = new Point(direction.x / length, direction.y / length);

    // Calculate how far to slide based on bounding box overlap
    const dx = normalizedDir.x > 0 ? 
      (otherBounds.x + otherBounds.width) - thisBounds.x :
      otherBounds.x - (thisBounds.x + thisBounds.width);
    
    const dy = normalizedDir.y > 0 ? 
      (otherBounds.y + otherBounds.height) - thisBounds.y :
      otherBounds.y - (thisBounds.y + thisBounds.height);

    const distance = dx * normalizedDir.x + dy * normalizedDir.y;

    if (ignoreNegative && distance < 0) {
      return null;
    }

    return distance;
  }

  /**
   * Fallback implementation for point to segment distance
   */
  private static fallbackPointToSegmentDistance(
    point: Point,
    segmentStart: Point,
    segmentEnd: Point,
    direction: Point,
    infinite: boolean
  ): number | null {
    // Normalize direction vector
    const length = Math.hypot(direction.x, direction.y);
    if (length === 0) return null;
    
    const normal = new Point(direction.x / length, direction.y / length);

    // Create perpendicular vector
    const perpendicular = new Point(normal.y, -normal.x);

    // Project point onto the line
    const segmentVector = new Point(segmentEnd.x - segmentStart.x, segmentEnd.y - segmentStart.y);
    const pointVector = new Point(point.x - segmentStart.x, point.y - segmentStart.y);

    const segmentLength = Math.hypot(segmentVector.x, segmentVector.y);
    if (segmentLength === 0) return null;

    const segmentUnit = new Point(segmentVector.x / segmentLength, segmentVector.y / segmentLength);
    const projection = pointVector.x * segmentUnit.x + pointVector.y * segmentUnit.y;

    if (!infinite && (projection < 0 || projection > segmentLength)) {
      return null; // Point projection falls outside segment
    }

    // Calculate perpendicular distance
    const projectionPoint = new Point(
      segmentStart.x + projection * segmentUnit.x,
      segmentStart.y + projection * segmentUnit.y
    );

    const distance = Math.hypot(point.x - projectionPoint.x, point.y - projectionPoint.y);
    
    // Determine sign based on which side of the line the point is on
    const cross = pointVector.x * perpendicular.x + pointVector.y * perpendicular.y;
    return cross >= 0 ? distance : -distance;
  }

  /**
   * Calculates the distance between two line segments
   */
  private segmentToSegmentDistance(a1: Point, a2: Point, b1: Point, b2: Point): number {
    // Check if segments intersect
    if (this.lineSegmentsIntersect(a1, a2, b1, b2)) {
      return 0;
    }

    // Calculate distance from endpoints to opposite segments
    const distances = [
      this.pointToSegmentDistance(a1, b1, b2),
      this.pointToSegmentDistance(a2, b1, b2),
      this.pointToSegmentDistance(b1, a1, a2),
      this.pointToSegmentDistance(b2, a1, a2)
    ].filter(d => d !== null) as number[];

    return distances.length > 0 ? Math.min(...distances) : Infinity;
  }

  /**
   * Calculates the distance from a point to a line segment
   */
  private pointToSegmentDistance(point: Point, segmentStart: Point, segmentEnd: Point): number {
    const segmentVector = new Point(segmentEnd.x - segmentStart.x, segmentEnd.y - segmentStart.y);
    const pointVector = new Point(point.x - segmentStart.x, point.y - segmentStart.y);

    const segmentLengthSquared = segmentVector.x * segmentVector.x + segmentVector.y * segmentVector.y;
    
    if (segmentLengthSquared === 0) {
      // Segment is a point
      return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
    }

    const projection = (pointVector.x * segmentVector.x + pointVector.y * segmentVector.y) / segmentLengthSquared;

    if (projection < 0) {
      // Closest point is segmentStart
      return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
    } else if (projection > 1) {
      // Closest point is segmentEnd
      return Math.hypot(point.x - segmentEnd.x, point.y - segmentEnd.y);
    } else {
      // Closest point is on the segment
      const closestPoint = new Point(
        segmentStart.x + projection * segmentVector.x,
        segmentStart.y + projection * segmentVector.y
      );
      return Math.hypot(point.x - closestPoint.x, point.y - closestPoint.y);
    }
  }

  /**
   * Performs boolean union operation with another polygon using Clipper
   * @param other The other polygon to union with
   * @returns Array of resulting polygons from the union operation
   */
  union(other: Polygon): Polygon[] {
    if (!other || other.points.length < 3 || this.points.length < 3) {
      return [this.clone()];
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      
      if (ClipperLib) {
        const clipper = new ClipperLib.Clipper();
        const solution = new ClipperLib.Paths();

        // Convert polygons to Clipper format
        const thisPath = this.toClipperPath();
        const otherPath = other.toClipperPath();

        // Add paths to clipper
        clipper.AddPath(thisPath, ClipperLib.PolyType.ptSubject, true);
        clipper.AddPath(otherPath, ClipperLib.PolyType.ptClip, true);

        // Execute union operation
        const success = clipper.Execute(
          ClipperLib.ClipType.ctUnion,
          solution,
          ClipperLib.PolyFillType.pftNonZero,
          ClipperLib.PolyFillType.pftNonZero
        );

        if (success && solution.length > 0) {
          const results: Polygon[] = [];
          for (let i = 0; i < solution.length; i++) {
            const polygon = this.fromClipperPath(solution[i]);
            if (polygon && polygon.points.length >= 3) {
              results.push(polygon);
            }
          }
          return results.length > 0 ? results : [this.clone()];
        }
      }
    } catch (error) {
      console.warn('Union operation failed:', error);
    }

    // Fallback: return both polygons
    return [this.clone(), other.clone()];
  }

  /**
   * Performs boolean intersection operation with another polygon using Clipper
   * @param other The other polygon to intersect with
   * @returns Array of resulting polygons from the intersection operation
   */
  intersection(other: Polygon): Polygon[] {
    if (!other || other.points.length < 3 || this.points.length < 3) {
      return [];
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      
      if (ClipperLib) {
        const clipper = new ClipperLib.Clipper();
        const solution = new ClipperLib.Paths();

        // Convert polygons to Clipper format
        const thisPath = this.toClipperPath();
        const otherPath = other.toClipperPath();

        // Add paths to clipper
        clipper.AddPath(thisPath, ClipperLib.PolyType.ptSubject, true);
        clipper.AddPath(otherPath, ClipperLib.PolyType.ptClip, true);

        // Execute intersection operation
        const success = clipper.Execute(
          ClipperLib.ClipType.ctIntersection,
          solution,
          ClipperLib.PolyFillType.pftNonZero,
          ClipperLib.PolyFillType.pftNonZero
        );

        if (success && solution.length > 0) {
          const results: Polygon[] = [];
          for (let i = 0; i < solution.length; i++) {
            const polygon = this.fromClipperPath(solution[i]);
            if (polygon && polygon.points.length >= 3) {
              results.push(polygon);
            }
          }
          return results;
        }
      }
    } catch (error) {
      console.warn('Intersection operation failed:', error);
    }

    // Fallback: check if polygons intersect
    return this.intersects(other) ? [this.clone()] : [];
  }

  /**
   * Performs boolean difference operation (this - other) using Clipper
   * @param other The polygon to subtract from this one
   * @returns Array of resulting polygons from the difference operation
   */
  difference(other: Polygon): Polygon[] {
    if (!other || other.points.length < 3 || this.points.length < 3) {
      return [this.clone()];
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      
      if (ClipperLib) {
        const clipper = new ClipperLib.Clipper();
        const solution = new ClipperLib.Paths();

        // Convert polygons to Clipper format
        const thisPath = this.toClipperPath();
        const otherPath = other.toClipperPath();

        // Add paths to clipper
        clipper.AddPath(thisPath, ClipperLib.PolyType.ptSubject, true);
        clipper.AddPath(otherPath, ClipperLib.PolyType.ptClip, true);

        // Execute difference operation
        const success = clipper.Execute(
          ClipperLib.ClipType.ctDifference,
          solution,
          ClipperLib.PolyFillType.pftNonZero,
          ClipperLib.PolyFillType.pftNonZero
        );

        if (success && solution.length > 0) {
          const results: Polygon[] = [];
          for (let i = 0; i < solution.length; i++) {
            const polygon = this.fromClipperPath(solution[i]);
            if (polygon && polygon.points.length >= 3) {
              results.push(polygon);
            }
          }
          return results.length > 0 ? results : [];
        }
      }
    } catch (error) {
      console.warn('Difference operation failed:', error);
    }

    // Fallback: return original if no intersection, empty if identical or fully contained
    if (this === other || this.intersects(other)) {
      return []; // Empty if identical or intersecting (simplified fallback)
    }
    return [this.clone()];
  }

  /**
   * Performs boolean XOR (exclusive or) operation with another polygon using Clipper
   * @param other The other polygon to XOR with
   * @returns Array of resulting polygons from the XOR operation
   */
  xor(other: Polygon): Polygon[] {
    if (!other || other.points.length < 3 || this.points.length < 3) {
      if (!other) {
        return [this.clone()];
      }
      return [this.clone(), other.clone()];
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      
      if (ClipperLib) {
        const clipper = new ClipperLib.Clipper();
        const solution = new ClipperLib.Paths();

        // Convert polygons to Clipper format
        const thisPath = this.toClipperPath();
        const otherPath = other.toClipperPath();

        // Add paths to clipper
        clipper.AddPath(thisPath, ClipperLib.PolyType.ptSubject, true);
        clipper.AddPath(otherPath, ClipperLib.PolyType.ptClip, true);

        // Execute XOR operation
        const success = clipper.Execute(
          ClipperLib.ClipType.ctXor,
          solution,
          ClipperLib.PolyFillType.pftNonZero,
          ClipperLib.PolyFillType.pftNonZero
        );

        if (success && solution.length > 0) {
          const results: Polygon[] = [];
          for (let i = 0; i < solution.length; i++) {
            const polygon = this.fromClipperPath(solution[i]);
            if (polygon && polygon.points.length >= 3) {
              results.push(polygon);
            }
          }
          return results.length > 0 ? results : [];
        }
      }
    } catch (error) {
      console.warn('XOR operation failed:', error);
    }

    // Fallback: return both if no intersection, neither if identical or fully overlapping
    if (this === other) {
      return []; // XOR of identical polygons is empty
    }
    if (this.intersects(other)) {
      return []; // Simplified fallback for overlapping
    }
    return [this.clone(), other.clone()];
  }

  /**
   * Calculates the Minkowski sum of this polygon with another polygon using Clipper
   * @param other The other polygon to calculate Minkowski sum with
   * @param isClosed Whether the paths should be treated as closed (default: true)
   * @returns Array of resulting polygons from the Minkowski sum
   */
  minkowskiSum(other: Polygon, isClosed: boolean = true): Polygon[] {
    if (!other || other.points.length < 3 || this.points.length < 3) {
      return [this.clone()];
    }

    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      
      if (ClipperLib?.Clipper?.MinkowskiSum) {
        // Convert polygons to Clipper format
        const thisPath = this.toClipperPath();
        const otherPath = other.toClipperPath();

        // Calculate Minkowski sum
        const solution = ClipperLib.Clipper.MinkowskiSum(thisPath, otherPath, isClosed);

        if (solution && solution.length > 0) {
          const results: Polygon[] = [];
          for (let i = 0; i < solution.length; i++) {
            const polygon = this.fromClipperPath(solution[i]);
            if (polygon && polygon.points.length >= 3) {
              results.push(polygon);
            }
          }
          return results.length > 0 ? results : [this.clone()];
        }
      }
    } catch (error) {
      console.warn('Minkowski sum operation failed:', error);
    }

    // Fallback: return original polygon
    return [this.clone()];
  }

  /**
   * Performs multiple boolean operations in sequence
   * @param operations Array of operation objects with type and polygon
   * @returns Array of resulting polygons
   */
  batchOperations(operations: Array<{type: 'union' | 'intersection' | 'difference' | 'xor', polygon: Polygon}>): Polygon[] {
    let results = [this.clone()];

    for (const op of operations) {
      const newResults: Polygon[] = [];
      
      for (const polygon of results) {
        let opResults: Polygon[];
        
        switch (op.type) {
          case 'union':
            opResults = polygon.union(op.polygon);
            break;
          case 'intersection':
            opResults = polygon.intersection(op.polygon);
            break;
          case 'difference':
            opResults = polygon.difference(op.polygon);
            break;
          case 'xor':
            opResults = polygon.xor(op.polygon);
            break;
          default:
            opResults = [polygon];
        }
        
        newResults.push(...opResults);
      }
      
      results = newResults;
      
      // Stop if no results remain
      if (results.length === 0) {
        break;
      }
    }

    return results;
  }

  /**
   * Calculates the area using Clipper library for more accurate results
   * @returns The area calculated by Clipper, or falls back to built-in area calculation
   */
  clipperArea(): number {
    try {
      const globalScope = typeof window !== 'undefined' ? window : global;
      const ClipperLib = (globalScope as any)?.ClipperLib;
      
      if (ClipperLib?.Clipper?.Area) {
        const clipperPath = this.toClipperPath();
        return Math.abs(ClipperLib.Clipper.Area(clipperPath)) / (10000000 * 10000000);
      }
    } catch (error) {
      console.warn('Clipper area calculation failed:', error);
    }

    // Fallback to built-in area calculation
    return Math.abs(this.area());
  }

  /**
   * Reverses the orientation of the polygon (clockwise to counter-clockwise or vice versa)
   * @returns New Polygon with reversed orientation
   */
  reverse(): Polygon {
    const reversedPoints = [...this.points].reverse();
    const reversed = new Polygon(reversedPoints);
    
    // Reverse children if they exist
    if (this.children && this.children.length > 0) {
      reversed.children = this.children.map(child => child.reverse());
    }
    
    return reversed;
  }

  /**
   * Checks if the polygon has clockwise orientation
   * @returns true if clockwise, false if counter-clockwise
   */
  isClockwise(): boolean {
    return this.area() < 0;
  }

  /**
   * Ensures the polygon has the specified orientation
   * @param clockwise Whether the polygon should be clockwise
   * @returns New Polygon with the specified orientation
   */
  ensureOrientation(clockwise: boolean): Polygon {
    if (this.isClockwise() === clockwise) {
      return this.clone();
    }
    return this.reverse();
  }

  /**
   * Creates a Polygon from an SVG element (polygon, polyline, rect, circle, ellipse, path)
   * @param element The SVG element to convert
   * @param tolerance Tolerance for curve approximation (default: 2)
   * @param toleranceSvg Tolerance for SVG unit handling (default: 0.01)
   * @returns New Polygon instance or null if conversion fails
   */
  static fromSVGElement(element: SVGElement, tolerance: number = 2, toleranceSvg: number = 0.01): Polygon | null {
    if (!element) {
      return null;
    }

    const coords = Polygon.polygonifyElement(element, tolerance);
    if (!coords || coords.length < 3) {
      return null;
    }

    // Remove duplicate endpoint if it coincides with starting point
    while (coords.length > 0) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      const dx = Math.abs(first.x - last.x);
      const dy = Math.abs(first.y - last.y);
      
      if (dx < toleranceSvg && dy < toleranceSvg) {
        coords.pop();
      } else {
        break;
      }
    }

    if (coords.length < 3) {
      return null;
    }

    try {
      const points = coords.map(coord => new Point(coord.x, coord.y));
      return new Polygon(points);
    } catch (error) {
      console.warn('Failed to create polygon from SVG element:', error);
      return null;
    }
  }

  /**
   * Creates a Polygon from an SVG path element
   * @param path The SVG path element
   * @param tolerance Tolerance for curve approximation (default: 2)
   * @returns New Polygon instance or null if conversion fails
   */
  static fromSVGPath(path: SVGPathElement, tolerance: number = 2): Polygon | null {
    if (!path || !(path as any).pathSegList) {
      return null;
    }

    try {
      const coords = Polygon.polygonifyPath(path, tolerance);
      if (!coords || coords.length < 3) {
        return null;
      }

      const points = coords.map(coord => new Point(coord.x, coord.y));
      return new Polygon(points);
    } catch (error) {
      console.warn('Failed to create polygon from SVG path:', error);
      return null;
    }
  }

  /**
   * Converts the polygon to an SVG path string
   * @param precision Number of decimal places for coordinates (default: 3)
   * @returns SVG path string
   */
  toSVGPath(precision: number = 3): string {
    if (this.points.length === 0) {
      return '';
    }

    const formatNumber = (num: number): string => {
      return Number(num.toFixed(precision)).toString();
    };

    const first = this.points[0];
    let path = `M ${formatNumber(first.x)} ${formatNumber(first.y)}`;

    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      path += ` L ${formatNumber(point.x)} ${formatNumber(point.y)}`;
    }

    path += ' Z'; // Close the path
    return path;
  }

  /**
   * Creates an SVG polygon element
   * @param svgDocument The SVG document to create the element in
   * @param precision Number of decimal places for coordinates (default: 3)
   * @returns SVG polygon element
   */
  toSVGPolygon(svgDocument: Document, precision: number = 3): SVGPolygonElement {
    const polygon = svgDocument.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    
    const formatNumber = (num: number): string => {
      return Number(num.toFixed(precision)).toString();
    };

    const pointsStr = this.points
      .map(p => `${formatNumber(p.x)},${formatNumber(p.y)}`)
      .join(' ');
    
    polygon.setAttribute('points', pointsStr);
    return polygon;
  }

  /**
   * Creates an SVG polyline element
   * @param svgDocument The SVG document to create the element in
   * @param precision Number of decimal places for coordinates (default: 3)
   * @returns SVG polyline element
   */
  toSVGPolyline(svgDocument: Document, precision: number = 3): SVGPolylineElement {
    const polyline = svgDocument.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    
    const formatNumber = (num: number): string => {
      return Number(num.toFixed(precision)).toString();
    };

    const pointsStr = this.points
      .map(p => `${formatNumber(p.x)},${formatNumber(p.y)}`)
      .join(' ');
    
    polyline.setAttribute('points', pointsStr);
    return polyline;
  }

  /**
   * Converts SVG element to coordinate array (polygonify functionality)
   * @param element SVG element to convert
   * @param tolerance Tolerance for curve approximation
   * @returns Array of coordinate objects
   */
  private static polygonifyElement(element: SVGElement, tolerance: number): { x: number; y: number }[] {
    const poly: { x: number; y: number }[] = [];

    switch (element.tagName.toLowerCase()) {
      case 'polygon':
      case 'polyline':
        const svgPoints = (element as SVGPolygonElement | SVGPolylineElement).points;
        for (let i = 0; i < svgPoints.length; i++) {
          const point = svgPoints.getItem(i);
          poly.push({ x: point.x, y: point.y });
        }
        break;

      case 'rect':
        const rect = element as SVGRectElement;
        const x = parseFloat(rect.getAttribute('x') || '0') || 0;
        const y = parseFloat(rect.getAttribute('y') || '0') || 0;
        const width = parseFloat(rect.getAttribute('width') || '0') || 0;
        const height = parseFloat(rect.getAttribute('height') || '0') || 0;

        // Don't create rectangles with zero area
        if (width <= 0 || height <= 0) {
          return [];
        }

        poly.push({ x: x, y: y });
        poly.push({ x: x + width, y: y });
        poly.push({ x: x + width, y: y + height });
        poly.push({ x: x, y: y + height });
        break;

      case 'circle':
        const circle = element as SVGCircleElement;
        const radius = parseFloat(circle.getAttribute('r') || '0') || 0;
        const cx = parseFloat(circle.getAttribute('cx') || '0') || 0;
        const cy = parseFloat(circle.getAttribute('cy') || '0') || 0;

        // Don't create circles with zero radius
        if (radius <= 0) {
          return [];
        }

        // Calculate number of segments needed for the given tolerance
        let numSegments = Math.ceil((2 * Math.PI) / Math.acos(1 - (tolerance / radius)));
        if (numSegments < 12) {
          numSegments = 12;
        }

        for (let i = 0; i <= numSegments; i++) {
          const theta = i * (2 * Math.PI) / numSegments;
          poly.push({
            x: radius * Math.cos(theta) + cx,
            y: radius * Math.sin(theta) + cy
          });
        }
        break;

      case 'ellipse':
        const ellipse = element as SVGEllipseElement;
        const rx = parseFloat(ellipse.getAttribute('rx') || '0') || 0;
        const ry = parseFloat(ellipse.getAttribute('ry') || '0') || 0;
        const maxRadius = Math.max(rx, ry);
        const elCx = parseFloat(ellipse.getAttribute('cx') || '0') || 0;
        const elCy = parseFloat(ellipse.getAttribute('cy') || '0') || 0;

        // Don't create ellipses with zero radius
        if (rx <= 0 || ry <= 0) {
          return [];
        }

        let elNumSegments = Math.ceil((2 * Math.PI) / Math.acos(1 - (tolerance / maxRadius)));
        if (elNumSegments < 12) {
          elNumSegments = 12;
        }

        for (let i = 0; i <= elNumSegments; i++) {
          const theta = i * (2 * Math.PI) / elNumSegments;
          poly.push({
            x: rx * Math.cos(theta) + elCx,
            y: ry * Math.sin(theta) + elCy
          });
        }
        break;

      case 'path':
        const pathPoly = Polygon.polygonifyPath(element as SVGPathElement, tolerance);
        return pathPoly || [];

      default:
        console.warn(`Unsupported SVG element type: ${element.tagName}`);
        return [];
    }

    return poly;
  }

  /**
   * Converts SVG path element to coordinate array
   * @param path SVG path element
   * @param tolerance Tolerance for curve approximation
   * @returns Array of coordinate objects
   */
  private static polygonifyPath(path: SVGPathElement, tolerance: number): { x: number; y: number }[] | null {
    try {
      // Check if pathSegList is available (deprecated but still used in some environments)
      if (!(path as any).pathSegList) {
        // Fallback: use pathData or attempt to parse the 'd' attribute
        console.warn('SVG pathSegList not available, using fallback path parsing');
        return Polygon.parsePathData(path.getAttribute('d') || '', tolerance);
      }

      const seglist = (path as any).pathSegList;
      const poly: { x: number; y: number }[] = [];
      
      let x = 0, y = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0;
      let prevx = 0, prevy = 0, prevx1 = 0, prevy1 = 0, prevx2 = 0, prevy2 = 0;

      for (let i = 0; i < seglist.numberOfItems; i++) {
        const s = seglist.getItem(i);
        const command = s.pathSegTypeAsLetter;

        prevx = x;
        prevy = y;
        prevx1 = x1;
        prevy1 = y1;
        prevx2 = x2;
        prevy2 = y2;

        // Handle absolute vs relative coordinates
        if (/[MLHVCSQTA]/.test(command)) {
          // Absolute coordinates
          if ('x1' in s) x1 = (s as any).x1;
          if ('x2' in s) x2 = (s as any).x2;
          if ('y1' in s) y1 = (s as any).y1;
          if ('y2' in s) y2 = (s as any).y2;
          if ('x' in s) x = (s as any).x;
          if ('y' in s) y = (s as any).y;
        } else {
          // Relative coordinates
          if ('x1' in s) x1 = x + (s as any).x1;
          if ('x2' in s) x2 = x + (s as any).x2;
          if ('y1' in s) y1 = y + (s as any).y1;
          if ('y2' in s) y2 = y + (s as any).y2;
          if ('x' in s) x += (s as any).x;
          if ('y' in s) y += (s as any).y;
        }

        switch (command) {
          case 'm':
          case 'M':
          case 'l':
          case 'L':
          case 'h':
          case 'H':
          case 'v':
          case 'V':
            poly.push({ x: x, y: y });
            break;

          case 'q':
          case 'Q':
          case 't':
          case 'T':
            // Quadratic Bezier curves - linearize them
            if (command === 't' || command === 'T') {
              // Implicit control point for smooth quadratic
              if (i > 0 && /[QqTt]/.test(seglist.getItem(i - 1).pathSegTypeAsLetter)) {
                x1 = prevx + (prevx - prevx1);
                y1 = prevy + (prevy - prevy1);
              } else {
                x1 = prevx;
                y1 = prevy;
              }
            }
            
            // Linearize quadratic Bezier (simplified approximation)
            const quadSteps = Math.max(4, Math.ceil(tolerance * 2));
            for (let t = 1; t <= quadSteps; t++) {
              const ratio = t / quadSteps;
              const invRatio = 1 - ratio;
              const px = invRatio * invRatio * prevx + 2 * invRatio * ratio * x1 + ratio * ratio * x;
              const py = invRatio * invRatio * prevy + 2 * invRatio * ratio * y1 + ratio * ratio * y;
              poly.push({ x: px, y: py });
            }
            break;

          case 'c':
          case 'C':
          case 's':
          case 'S':
            // Cubic Bezier curves - linearize them
            if (command === 's' || command === 'S') {
              // Implicit first control point for smooth cubic
              if (i > 0 && /[CcSs]/.test(seglist.getItem(i - 1).pathSegTypeAsLetter)) {
                x1 = prevx + (prevx - prevx2);
                y1 = prevy + (prevy - prevy2);
              } else {
                x1 = prevx;
                y1 = prevy;
              }
            }
            
            // Linearize cubic Bezier (simplified approximation)
            const cubicSteps = Math.max(6, Math.ceil(tolerance * 3));
            for (let t = 1; t <= cubicSteps; t++) {
              const ratio = t / cubicSteps;
              const invRatio = 1 - ratio;
              const px = invRatio * invRatio * invRatio * prevx + 
                        3 * invRatio * invRatio * ratio * x1 + 
                        3 * invRatio * ratio * ratio * x2 + 
                        ratio * ratio * ratio * x;
              const py = invRatio * invRatio * invRatio * prevy + 
                        3 * invRatio * invRatio * ratio * y1 + 
                        3 * invRatio * ratio * ratio * y2 + 
                        ratio * ratio * ratio * y;
              poly.push({ x: px, y: py });
            }
            break;

          case 'a':
          case 'A':
            // Arc - linearize with line segments (simplified approximation)
            const arcSteps = Math.max(8, Math.ceil(tolerance * 4));
            for (let t = 1; t <= arcSteps; t++) {
              const ratio = t / arcSteps;
              const px = prevx + ratio * (x - prevx);
              const py = prevy + ratio * (y - prevy);
              poly.push({ x: px, y: py });
            }
            break;

          case 'z':
          case 'Z':
            // Close path - no additional points needed
            break;
        }
      }

      return poly;
    } catch (error) {
      console.warn('Failed to polygonify path:', error);
      return null;
    }
  }

  /**
   * Fallback parser for SVG path data when pathSegList is not available
   * @param pathData The 'd' attribute value of the path
   * @param tolerance Tolerance for curve approximation
   * @returns Array of coordinate objects
   */
  private static parsePathData(pathData: string, _tolerance: number): { x: number; y: number }[] {
    // This is a simplified fallback - in a real implementation you would want
    // a more robust SVG path parser
    const poly: { x: number; y: number }[] = [];
    
    // Simple regex to extract basic move and line commands
    const commands = pathData.match(/[MLHVZmlhvz][^MLHVZmlhvz]*/g) || [];
    
    let x = 0, y = 0;
    
    for (const cmd of commands) {
      const command = cmd[0];
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
      
      switch (command) {
        case 'M':
          if (coords.length >= 2) {
            x = coords[0];
            y = coords[1];
            poly.push({ x, y });
          }
          break;
        case 'm':
          if (coords.length >= 2) {
            x += coords[0];
            y += coords[1];
            poly.push({ x, y });
          }
          break;
        case 'L':
          for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              x = coords[i];
              y = coords[i + 1];
              poly.push({ x, y });
            }
          }
          break;
        case 'l':
          for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              x += coords[i];
              y += coords[i + 1];
              poly.push({ x, y });
            }
          }
          break;
        case 'H':
          if (coords.length >= 1) {
            x = coords[0];
            poly.push({ x, y });
          }
          break;
        case 'h':
          if (coords.length >= 1) {
            x += coords[0];
            poly.push({ x, y });
          }
          break;
        case 'V':
          if (coords.length >= 1) {
            y = coords[0];
            poly.push({ x, y });
          }
          break;
        case 'v':
          if (coords.length >= 1) {
            y += coords[0];
            poly.push({ x, y });
          }
          break;
        // For curves and arcs, we just approximate with line segments
        case 'C':
        case 'c':
        case 'Q':
        case 'q':
        case 'A':
        case 'a':
          // Simplified: just use the end point
          if (coords.length >= 2) {
            const endIndex = coords.length - 2;
            const endX = command === command.toUpperCase() ? coords[endIndex] : x + coords[endIndex];
            const endY = command === command.toUpperCase() ? coords[endIndex + 1] : y + coords[endIndex + 1];
            x = endX;
            y = endY;
            poly.push({ x, y });
          }
          break;
      }
    }
    
    return poly;
  }

  /**
   * String representation of the polygon
   */
  toString(): string {
    const pointsStr = this.points.map((p) => p.toString()).join(", ");
    return `Polygon([${pointsStr}])`;
  }
}
