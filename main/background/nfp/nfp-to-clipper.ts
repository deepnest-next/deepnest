import type { Polygon, NestConfig } from "../types/index.js";
import {
  toClipperCoordinates,
  type ClipperPoint,
} from "../geometry/coordinate-conversion.js";

/**
 * Ambient declaration for GeometryUtil (loaded at runtime).
 * Used for polygon area calculations to determine orientation.
 */
declare const GeometryUtil: {
  polygonArea(polygon: Polygon): number;
};

/**
 * Ambient declaration for ClipperLib (loaded at runtime).
 * Used for scaling coordinates to Clipper's integer space.
 */
declare const ClipperLib: {
  JS: {
    ScaleUpPath(path: ClipperPoint[], scale: number): void;
  };
};

/**
 * Converts an NFP polygon (with optional children/holes) to Clipper coordinate format.
 *
 * The conversion process:
 * 1. Processes children (holes) first, reversing if needed based on area sign
 * 2. Scales each child polygon to Clipper coordinates
 * 3. Processes the outer polygon, reversing if needed
 * 4. Scales the outer polygon to Clipper coordinates
 *
 * Polygon orientation is determined by area sign:
 * - Positive area = counter-clockwise (outer boundary)
 * - Negative area = clockwise (hole)
 * ClipperLib uses orientation to distinguish holes from outer boundaries.
 *
 * @param {Polygon} nfp - NFP polygon with optional children array
 * @param {NestConfig} config - Configuration object containing clipperScale
 * @return {Array} Array of Clipper polygons (children first, then outer)
 */
export function nfpToClipperCoordinates(
  nfp: Polygon,
  config: NestConfig,
): ClipperPoint[][] {
  const clipperNfp: ClipperPoint[][] = [];

  // Process children (holes) first
  if (nfp.children && nfp.children.length > 0) {
    for (let j = 0; j < nfp.children.length; j++) {
      // Reverse if area is negative (clockwise) to ensure correct orientation
      if (GeometryUtil.polygonArea(nfp.children[j]) < 0) {
        nfp.children[j].reverse();
      }
      const childNfp = toClipperCoordinates(nfp.children[j]);
      ClipperLib.JS.ScaleUpPath(childNfp, config.clipperScale);
      clipperNfp.push(childNfp);
    }
  }

  // Process outer polygon
  // Reverse if area is positive (counter-clockwise) to ensure correct orientation
  if (GeometryUtil.polygonArea(nfp) > 0) {
    nfp.reverse();
  }

  const outerNfp = toClipperCoordinates(nfp);
  // clipper js defines holes based on orientation
  ClipperLib.JS.ScaleUpPath(outerNfp, config.clipperScale);
  clipperNfp.push(outerNfp);

  return clipperNfp;
}

/**
 * Converts an array of inner NFPs to Clipper coordinate format.
 *
 * Inner NFPs can be an array of multiple polygons (representing multiple valid regions),
 * while outer NFPs are always a single polygon. This function processes each inner NFP
 * and concatenates the results into a single flattened array.
 *
 * @param {Array} nfp - Array of inner NFP polygons (valid placement regions inside holes)
 * @param {NestConfig} config - Configuration object containing clipperScale
 * @return {Array} Flattened array of Clipper polygons
 */
export function innerNfpToClipperCoordinates(
  nfp: Polygon[],
  config: NestConfig,
): ClipperPoint[][] {
  const clipperNfp: ClipperPoint[][] = [];
  for (let i = 0; i < nfp.length; i++) {
    const clip = nfpToClipperCoordinates(nfp[i], config);
    clipperNfp.push(...clip);
  }
  return clipperNfp;
}
