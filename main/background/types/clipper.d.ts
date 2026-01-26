/**
 * Ambient type declarations for ClipperLib
 *
 * ClipperLib is a complex polygon clipping library. Rather than fully typing it,
 * we provide minimal type definitions for the specific operations used in the
 * nesting engine. Complex operations use `any` to avoid diminishing returns.
 */

declare const ClipperLib: {
  /**
   * Clipper point with uppercase X/Y coordinates
   * Used internally by Clipper for integer-based polygon operations
   */
  ClipperPoint: {
    X: number;
    Y: number;
  };

  /**
   * Clipper path - array of points
   */
  ClipperPath: Array<{ X: number; Y: number }>;

  /**
   * JavaScript-specific Clipper operations
   */
  JS: {
    /**
     * Scale up a path by the given factor
     * Converts floating-point coordinates to integers for Clipper operations
     */
    ScaleUpPath(path: Array<{ X: number; Y: number }>, scale: number): void;

    /**
     * Scale down a path by the given factor
     * Converts integer coordinates back to floating-point
     */
    ScaleDownPath(path: Array<{ X: number; Y: number }>, scale: number): void;

    /**
     * Minkowski sum operation - complex operation, typed as any
     */
    MinkowskiSum(pattern: any, path: any, pathIsClosed: boolean): any;

    /**
     * Polygon area calculation
     */
    Area(path: Array<{ X: number; Y: number }>): number;

    /**
     * Polygon simplification
     */
    SimplifyPolygon(polygon: any, fillType?: any): any;

    /**
     * Polygon cleaning
     */
    CleanPolygon(polygon: any, distance?: number): any;

    /**
     * Offset polygon (expand/contract)
     */
    OffsetPolygons(
      polygons: any,
      delta: number,
      joinType: number,
      miterLimit: number,
      autoFix: boolean,
    ): any;
  };

  /**
   * Clipper engine for boolean operations
   */
  Clipper: any;

  /**
   * Polygon fill types
   */
  PolyFillType: {
    pftEvenOdd: number;
    pftNonZero: number;
    pftPositive: number;
    pftNegative: number;
  };

  /**
   * Join types for offset operations
   */
  JoinType: {
    jtSquare: number;
    jtRound: number;
    jtMiter: number;
  };

  /**
   * End types for offset operations
   */
  EndType: {
    etClosedPolygon: number;
    etClosedLine: number;
    etOpenSquare: number;
    etOpenRound: number;
    etOpenButt: number;
  };
};
