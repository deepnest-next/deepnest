/**
 * Centralized constants for DeepNest application
 * This file provides shared constants to ensure consistency across the codebase
 */

/**
 * Geometric calculation tolerance for floating-point comparisons
 */
const GEOMETRIC_TOLERANCE = Math.pow(10, -9);

/**
 * Angle conversion constants
 */
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Mathematical constants
 */
const TWO_PI = 2 * Math.PI;

/**
 * Default values for geometric operations
 */
const DEFAULT_CIRCLE_SEGMENTS = 32;

/**
 * Configuration constants
 */
const DEFAULT_CLIPPER_SCALE = 10000000;

// Export constants for use in other files
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS environment
  module.exports = {
    GEOMETRIC_TOLERANCE,
    DEG_TO_RAD,
    RAD_TO_DEG,
    TWO_PI,
    DEFAULT_CIRCLE_SEGMENTS,
    DEFAULT_CLIPPER_SCALE
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to window object
  window.DEEPNEST_CONSTANTS = {
    GEOMETRIC_TOLERANCE,
    DEG_TO_RAD,
    RAD_TO_DEG,
    TWO_PI,
    DEFAULT_CIRCLE_SEGMENTS,
    DEFAULT_CLIPPER_SCALE
  };
}