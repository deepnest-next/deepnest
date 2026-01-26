/**
 * Outer NFP (No-Fit Polygon) calculation module
 *
 * Computes the outer NFP between two polygons, representing all positions
 * where polygon B can be placed such that it touches but does not intersect
 * polygon A. Uses either the native addon for complex polygons with holes,
 * or ClipperLib's Minkowski sum for simple polygons.
 */

import type { Polygon, Point } from "../types/index.js";
import type { ClipperPoint } from "../geometry/coordinate-conversion.js";
import {
  toClipperCoordinates,
  toNestCoordinates,
} from "../geometry/coordinate-conversion.js";
import { BackgroundContext } from "../context/background-context.js";

// Ambient declarations for runtime globals
declare const GeometryUtil: { polygonArea(polygon: Point[]): number };
declare const ClipperLib: {
  JS: { ScaleUpPath(path: ClipperPoint[], scale: number): void };
  Clipper: {
    MinkowskiSum(
      a: ClipperPoint[],
      b: ClipperPoint[],
      isClosed: boolean,
    ): ClipperPoint[][];
  };
};

/**
 * Calculate the outer NFP between two polygons
 *
 * @param A - First polygon (container/stationary polygon)
 * @param B - Second polygon (part to orbit around A)
 * @param inside - Whether to compute inner NFP (B inside A) instead of outer NFP
 * @returns The computed NFP polygon, or null if computation fails
 *
 * Algorithm:
 * 1. Check cache first for previously computed NFP
 * 2. If not cached and (inside mode OR A has children):
 *    - Use native addon for complex NFP calculation
 * 3. Otherwise:
 *    - Use ClipperLib Minkowski sum for simple NFP
 *    - Scale coordinates by 10^7 for integer precision
 *    - Negate B coordinates to compute Minkowski difference (A - B)
 *    - Select largest area polygon from solution
 *    - Offset result by B[0] position
 * 4. Cache result if not in inside mode
 */
export function getOuterNfp(
  A: Polygon,
  B: Polygon,
  inside: boolean,
): Point[] | null {
  const context = BackgroundContext.getInstance();
  const db = context.getDb();
  const addon = context.getAddon();

  let nfp: Point[][] | undefined;

  // Try the cache if the calculation will take a long time
  if (
    A.source &&
    B.source &&
    A.rotation !== undefined &&
    B.rotation !== undefined
  ) {
    const doc = db.find({
      A: A.source,
      B: B.source,
      Arotation: A.rotation,
      Brotation: B.rotation,
      nfp: [] as any,
    });

    if (doc) {
      return doc as any as Point[];
    }
  }

  // Not found in cache
  if (inside || (A.children && A.children.length > 0)) {
    // Use addon for complex polygons with holes or inner NFP
    if (!A.children) {
      A.children = [];
    }
    if (!B.children) {
      B.children = [];
    }

    const addonResult = (addon as any).calculateNFP({ A: A, B: B });
    nfp = addonResult as Point[][];
  } else {
    // Use ClipperLib for simple polygons
    const Ac = toClipperCoordinates(A);
    ClipperLib.JS.ScaleUpPath(Ac, 10000000); // Scale factor of 10^7 for integer precision without overflow

    const Bc = toClipperCoordinates(B);
    ClipperLib.JS.ScaleUpPath(Bc, 10000000); // Must match scale factor of A for consistent positioning

    for (let i = 0; i < Bc.length; i++) {
      // Negate coordinates to compute Minkowski difference (A - B) instead of sum (A + B)
      // This gives us the NFP (no-fit polygon) representing all positions where B would overlap A
      Bc[i].X *= -1;
      Bc[i].Y *= -1;
    }

    const solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);

    let clipperNfp: Point[] | undefined;
    let largestArea: number | null = null;

    for (let i = 0; i < solution.length; i++) {
      const n = toNestCoordinates(solution[i], 10000000); // Convert back using same scale factor
      const sarea = -GeometryUtil.polygonArea(n);
      if (largestArea === null || largestArea < sarea) {
        clipperNfp = n;
        largestArea = sarea;
      }
    }

    if (!clipperNfp) {
      return null;
    }

    // Offset result by B[0] position
    for (let i = 0; i < clipperNfp.length; i++) {
      clipperNfp[i].x += B[0].x;
      clipperNfp[i].y += B[0].y;
    }

    nfp = [clipperNfp];
  }

  if (!nfp || nfp.length === 0) {
    return null;
  }

  const result = nfp.pop();

  if (!result || result.length === 0) {
    return null;
  }

  // Cache the result if not in inside mode and source identifiers exist
  if (
    !inside &&
    typeof A.source !== "undefined" &&
    typeof B.source !== "undefined" &&
    typeof A.rotation !== "undefined" &&
    typeof B.rotation !== "undefined"
  ) {
    const cacheDoc = {
      A: A.source,
      B: B.source,
      Arotation: A.rotation,
      Brotation: B.rotation,
      nfp: result as any,
    };
    db.insert(cacheDoc);
  }

  return result;
}
