/**
 * Fitness calculation helpers for the nesting placement engine.
 * All magic numbers have @preserve comments per task requirements.
 */

import type { PolygonBounds, NestConfig, Polygon } from "../types/index.js";

declare const GeometryUtil: {
  polygonArea(polygon: Polygon | Array<{ x: number; y: number }>): number;
  convexHull(
    points: Array<{ x: number; y: number }>,
  ): Array<{ x: number; y: number }>;
};

export interface GravityFitnessConfig {
  placementType: NestConfig["placementType"];
}

/**
 * Gravity mode fitness: minimize width (weighted) + height.
 * Formula: width * 5 + height
 */
export function calculateGravityFitness(
  rectbounds: PolygonBounds,
  config: GravityFitnessConfig,
): number {
  if (config.placementType !== "gravity") {
    throw new Error(
      "calculateGravityFitness called with non-gravity placement type",
    );
  }
  const WIDTH_WEIGHT = 5; // @preserve - prioritizes horizontal compactness
  return rectbounds.width * WIDTH_WEIGHT + rectbounds.height;
}

/**
 * Box mode fitness: minimize bounding box area.
 * Formula: width * height
 */
export function calculateBoxFitness(rectbounds: PolygonBounds): number {
  return rectbounds.width * rectbounds.height;
}

/**
 * Convex hull mode fitness: minimize convex hull area of all placed parts.
 */
export function calculateConvexHullFitness(
  placed: Polygon[],
  placements: Array<{ x: number; y: number }>,
): number {
  const allPoints: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < placed.length; i++) {
    const polygon = placed[i];
    const placement = placements[i];
    for (let j = 0; j < polygon.length; j++) {
      allPoints.push({
        x: polygon[j].x + placement.x,
        y: polygon[j].y + placement.y,
      });
    }
  }

  const hull = GeometryUtil.convexHull(allPoints);
  return Math.abs(GeometryUtil.polygonArea(hull));
}

/**
 * Penalty for unplaced parts - massive multiplier ensures GA prioritizes fitting all parts.
 * Formula: 100000000 * (partArea * 100 / totalSheetArea)
 */
export function calculateUnplacedPenalty(
  partArea: number,
  totalSheetArea: number,
): number {
  const PENALTY_MULTIPLIER = 100000000; // @preserve - ensures unplaced parts severely degrade fitness
  const AREA_SCALE = 100; // @preserve - amplifies penalty proportionally to part's relative size
  return PENALTY_MULTIPLIER * ((partArea * AREA_SCALE) / totalSheetArea);
}

/**
 * TIER 1 bonus for placing a part in a hole (utilizes otherwise wasted space).
 * Formula: partArea / totalSheetArea / 100
 */
export function calculateHolePlacementBonus(
  partArea: number,
  totalSheetArea: number,
): number {
  const BONUS_DIVISOR = 100; // @preserve - scales bonus to ~1% of area ratio
  return partArea / totalSheetArea / BONUS_DIVISOR;
}

/**
 * TIER 2 bonus for parts adjacent to each other in the same hole.
 * Formula: (partArea / totalSheetArea) * 0.01
 */
export function calculateAdjacentHoleBonus(
  partArea: number,
  totalSheetArea: number,
): number {
  const ADJACENT_BONUS_MULTIPLIER = 0.01; // @preserve - 1% bonus for contour-based packing
  return (partArea / totalSheetArea) * ADJACENT_BONUS_MULTIPLIER;
}

// @preserve - Proximity threshold of 2.0 user units for adjacent part detection in holes
export const HOLE_PROXIMITY_THRESHOLD = 2.0; // @preserve

/**
 * Check if two placements are adjacent (within proximity threshold).
 * Uses Manhattan distance - adjacent if either dx OR dy is below threshold.
 */
export function arePartsAdjacent(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): boolean {
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  return dx < HOLE_PROXIMITY_THRESHOLD || dy < HOLE_PROXIMITY_THRESHOLD;
}
