export {
  calculateGravityFitness,
  calculateBoxFitness,
  calculateConvexHullFitness,
  calculateUnplacedPenalty,
  calculateHolePlacementBonus,
  calculateAdjacentHoleBonus,
  arePartsAdjacent,
  HOLE_PROXIMITY_THRESHOLD,
} from "./fitness-helpers.js";
export type { GravityFitnessConfig } from "./fitness-helpers.js";
export { placeParts } from "./placement-engine.js";
