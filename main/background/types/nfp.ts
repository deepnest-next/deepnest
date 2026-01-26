/**
 * NFP (No Fit Polygon) type definitions for the nesting algorithm
 *
 * The No Fit Polygon represents all possible positions where one polygon
 * can be placed such that it touches but does not intersect another polygon.
 * NFPs can have children (holes) representing inner boundaries.
 */

import { Point, Polygon } from "./polygon.js";

/**
 * NFP type: A polygon with optional children representing holes
 *
 * The NFP is represented as an array of points (the outer boundary)
 * with optional children arrays representing inner boundaries (holes).
 * This is used in the Minkowski sum calculations for placement.
 */
export interface NFP extends Array<Point> {
  /** Optional nested polygons representing holes in the NFP */
  children?: Point[][];
}

/**
 * NFPCacheKey interface for identifying cached NFP computations
 *
 * The cache key uniquely identifies an NFP computation based on:
 * - The two polygons being compared (A and B)
 * - Their rotation angles
 * - Their source identifiers
 *
 * This allows the algorithm to reuse previously computed NFPs
 * without recalculating them.
 */
export interface NFPCacheKey {
  /** Source identifier of polygon A (container) */
  Asource: number | string;
  /** Source identifier of polygon B (part to place) */
  Bsource: number | string;
  /** Rotation angle of polygon A in degrees */
  Arotation: number;
  /** Rotation angle of polygon B in degrees */
  Brotation: number;
  /** Optional: The actual polygon A object (for reference) */
  A?: Polygon;
  /** Optional: The actual polygon B object (for reference) */
  B?: Polygon;
}

/**
 * NFPCacheEntry interface for storing cached NFP data
 *
 * Represents what gets stored in the NFP cache database.
 * Can store either a single NFP or an array of NFPs (for inner NFPs).
 */
export interface NFPCacheEntry {
  /** The cached NFP polygon(s) - single or array */
  nfp: NFP | NFP[];
  /** Whether this is an inner NFP (array of NFPs) */
  inner?: boolean;
  /** Timestamp when this entry was cached (optional) */
  timestamp?: number;
}
