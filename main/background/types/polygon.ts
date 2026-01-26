/**
 * Point interface representing a 2D coordinate
 *
 * Used throughout the nesting algorithm to represent vertices of polygons
 * and other coordinate-based calculations.
 */
export interface Point {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Optional flag indicating if this point is exact (not approximated) */
  exact?: boolean;
}

/**
 * Polygon interface extending Point[] with optional metadata
 *
 * A polygon is represented as an array of points (vertices) with optional
 * properties for tracking source, rotation, and nested children (holes).
 * The array itself contains the outer boundary points.
 */
export interface Polygon extends Array<Point> {
  /** Optional nested polygons (holes within this polygon) */
  children?: Polygon[];
  /** Optional source identifier (e.g., SVG element ID) */
  source?: string;
  /** Optional rotation angle in degrees */
  rotation?: number;
  /** Optional unique identifier for this polygon */
  id?: string;
  /** Optional filename or source file reference */
  filename?: string;
}

/**
 * PolygonWithChildren interface explicitly requiring children array
 *
 * Used in contexts where a polygon is guaranteed to have nested children
 * (holes). This is a stricter type than Polygon for type safety.
 */
export interface PolygonWithChildren extends Polygon {
  /** Required nested polygons (holes within this polygon) */
  children: Polygon[];
}

/**
 * PolygonBounds interface representing the bounding box of a polygon
 *
 * Used for quick spatial calculations and comparisons without
 * iterating through all polygon vertices.
 */
export interface PolygonBounds {
  /** X coordinate of the bounding box top-left corner */
  x: number;
  /** Y coordinate of the bounding box top-left corner */
  y: number;
  /** Width of the bounding box */
  width: number;
  /** Height of the bounding box */
  height: number;
}
