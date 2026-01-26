/**
 * Configuration types for the nesting engine
 */

/**
 * NestConfig - Configuration object for the nesting algorithm
 *
 * Contains all parameters that control the behavior of the placement engine,
 * including scaling, placement strategy, rotation options, and optimization flags.
 */
export interface NestConfig {
  /**
   * Scale factor for Clipper integer operations
   * Clipper uses integer coordinates, so we scale up floating-point coordinates
   * to preserve precision during boolean operations
   */
  clipperScale: number;

  /**
   * Placement strategy for parts
   * - 'gravity': Place parts using gravity-based fitness
   * - 'box': Place parts to minimize bounding box
   * - 'convexhull': Place parts to minimize convex hull
   */
  placementType: "gravity" | "box" | "convexhull";

  /**
   * Number of rotation angles to evaluate for each part
   * Higher values allow more rotation options but increase computation time
   * Examples: 4 (cardinal directions), 8 (45° increments), 360 (every degree)
   */
  rotations: number;

  /**
   * Minimum space between parts in units
   * Used for laser kerf, CNC offset, or other spacing requirements
   */
  spacing: number;

  /**
   * Enable merging of common edges between parts
   * When true, adjacent edges are merged to reduce cutting operations
   */
  mergeLines: boolean;

  /**
   * Explore concave areas during placement
   * When true, attempts to place parts in concave regions of other parts
   * Increases computation time but may improve packing efficiency
   */
  exploreConcave: boolean;

  /**
   * Simplify polygons before processing
   * When true, removes redundant points from polygon outlines
   */
  simplify: boolean;

  /**
   * Optional threshold for hole fitting
   * Parts with area below this threshold may be placed in holes of other parts
   * If not specified, hole fitting is disabled
   */
  holeAreaThreshold?: number;

  /**
   * Scale factor for converting between user units and internal units
   * Used for minimum line length calculations in edge merging
   */
  scale: number;

  /**
   * Tolerance for curve approximation
   * Used to determine how closely lines must align to be considered merged
   */
  curveTolerance: number;

  /**
   * Time ratio for converting merged edge length to time savings
   * Used in fitness calculation when mergeLines is enabled
   */
  timeRatio: number;
}
