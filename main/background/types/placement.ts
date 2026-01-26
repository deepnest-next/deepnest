/**
 * Placement type definitions for the nesting algorithm
 *
 * Defines the data structures used to represent part placements on sheets,
 * including shift vectors, individual placements, and the overall result.
 */

import { Polygon } from "./polygon.js";

/**
 * ShiftVector interface representing a placement position and rotation
 *
 * Used to describe where and how a part should be placed relative to
 * previously placed parts or the sheet boundary.
 */
export interface ShiftVector {
  /** X coordinate of the placement position */
  x: number;
  /** Y coordinate of the placement position */
  y: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Source identifier of the part being placed */
  source: number | string;
  /** Optional: The actual polygon being placed (for reference) */
  polygon?: Polygon;
}

/**
 * HolePosition interface extending ShiftVector with hole-specific properties
 *
 * Used when placing parts inside holes of other parts.
 * Extends ShiftVector with additional metadata about the hole placement.
 */
export interface HolePosition extends ShiftVector {
  /** Whether this placement is inside a hole */
  inHole: boolean;
  /** Index of the parent polygon containing the hole */
  parentIndex: number;
  /** Index of the hole within the parent's children array */
  holeIndex: number;
}

/**
 * Placement interface representing a single part placement on a sheet
 *
 * Contains the polygon data and its placement position/rotation.
 */
export interface Placement {
  /** The polygon being placed */
  polygon: Polygon;
  /** X coordinate of the placement */
  x: number;
  /** Y coordinate of the placement */
  y: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Source identifier of the part */
  source: number | string;
}

/**
 * SheetPlacements interface representing all placements on a single sheet
 *
 * Groups placements by sheet for the final nesting result.
 */
export interface SheetPlacements {
  /** Sheet identifier (number or string) */
  sheet: number | string;
  /** Numeric sheet ID for ordering */
  sheetid: number;
  /** Array of placements on this sheet */
  sheetplacements: Placement[];
}

/**
 * PlacementResult interface representing the complete nesting result
 *
 * This is the return type of placeParts() and is sent via IPC to the main process.
 * Must match exactly the shape expected by consumers (main.js, deepnest.js, etc.)
 */
export interface PlacementResult {
  /** Array of sheet placements, one per sheet used */
  placements: SheetPlacements[];
  /** Overall fitness value (lower is better) */
  fitness: number;
  /** Total area of placed parts */
  area: number;
  /** Total area of all sheets used */
  totalarea: number;
  /** Total length of merged edges (for plotter/laser optimization) */
  mergedLength: number;
  /** Material utilization percentage (0-100) */
  utilisation: number;
}
