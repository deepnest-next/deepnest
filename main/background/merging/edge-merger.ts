import type { Point, Polygon } from "../types/index.js";

// Ambient declaration for GeometryUtil
declare const GeometryUtil: {
  almostEqual(a: number, b: number, tolerance?: number): boolean;
};

/**
 * Result of merged edge calculation
 */
export interface MergedResult {
  /** Total length of all merged segments */
  totalLength: number;
  /** Array of merged segment coordinates [start, end] */
  segments: [Point, Point][];
}

/**
 * Calculates the total length of shared edges between polygon p and parts.
 *
 * This function finds collinear overlapping segments by rotating edges to align
 * them horizontally, then calculating overlap in 1D space. It recursively handles
 * children of parts (holes within parts).
 *
 * Algorithm:
 * 1. For each edge of p (A1→A2), if both points are exact
 * 2. For each part B, for each edge of B (B1→B2), if both points are exact
 * 3. Rotate to align A edge horizontally
 * 4. Check if B edge is collinear (y ≈ 0 after rotation)
 * 5. Calculate overlap length in rotated space
 * 6. Track merged segments
 *
 * @param parts - Array of polygons to check for shared edges
 * @param p - The polygon to check edges against
 * @param minlength - Minimum edge length to consider
 * @param tolerance - Tolerance for geometric comparisons
 * @returns Object containing total merged length and segment coordinates
 */
export function mergedLength(
  parts: Polygon[],
  p: Polygon,
  minlength: number,
  tolerance: number,
): MergedResult {
  const minLenght2 = minlength * minlength;
  let totalLength = 0;
  let segments: [Point, Point][] = [];

  for (let i = 0; i < p.length; i++) {
    const A1 = p[i];
    const A2 = i + 1 === p.length ? p[0] : p[i + 1];

    // Skip if either point is not exact
    if (!A1.exact || !A2.exact) {
      continue;
    }

    // Check if edge is long enough
    const Ax2 = (A2.x - A1.x) * (A2.x - A1.x);
    const Ay2 = (A2.y - A1.y) * (A2.y - A1.y);

    if (Ax2 + Ay2 < minLenght2) {
      continue;
    }

    // Calculate rotation angle to make A1→A2 horizontal
    const angle = Math.atan2(A2.y - A1.y, A2.x - A1.x);

    // Rotation matrices
    const c = Math.cos(-angle);
    const s = Math.sin(-angle);
    const c2 = Math.cos(angle);
    const s2 = Math.sin(angle);

    // Rotate A2 relative to A1
    const relA2 = { x: A2.x - A1.x, y: A2.y - A1.y };
    const rotA2x = relA2.x * c - relA2.y * s;

    // Check each part for overlapping edges
    for (let j = 0; j < parts.length; j++) {
      const B = parts[j];

      if (B.length > 1) {
        for (let k = 0; k < B.length; k++) {
          const B1 = B[k];
          const B2 = k + 1 === B.length ? B[0] : B[k + 1];

          // Skip if either point is not exact
          if (!B1.exact || !B2.exact) {
            continue;
          }

          // Check if edge is long enough
          const Bx2 = (B2.x - B1.x) * (B2.x - B1.x);
          const By2 = (B2.y - B1.y) * (B2.y - B1.y);

          if (Bx2 + By2 < minLenght2) {
            continue;
          }

          // B relative to A1 (our point of rotation)
          const relB1 = { x: B1.x - A1.x, y: B1.y - A1.y };
          const relB2 = { x: B2.x - A1.x, y: B2.y - A1.y };

          // Rotate such that A1 and A2 are horizontal
          const rotB1 = {
            x: relB1.x * c - relB1.y * s,
            y: relB1.x * s + relB1.y * c,
          };
          const rotB2 = {
            x: relB2.x * c - relB2.y * s,
            y: relB2.x * s + relB2.y * c,
          };

          // Check if B edge is collinear with A edge (both y values should be ~0)
          if (
            !GeometryUtil.almostEqual(rotB1.y, 0, tolerance) ||
            !GeometryUtil.almostEqual(rotB2.y, 0, tolerance)
          ) {
            continue;
          }

          // Calculate overlap in 1D (x-axis after rotation)
          const min1 = Math.min(0, rotA2x);
          const max1 = Math.max(0, rotA2x);

          const min2 = Math.min(rotB1.x, rotB2.x);
          const max2 = Math.max(rotB1.x, rotB2.x);

          // Not overlapping
          if (min2 >= max1 || max2 <= min1) {
            continue;
          }

          let len = 0;
          let relC1x = 0;
          let relC2x = 0;

          // A is B (edges are identical)
          if (
            GeometryUtil.almostEqual(min1, min2) &&
            GeometryUtil.almostEqual(max1, max2)
          ) {
            len = max1 - min1;
            relC1x = min1;
            relC2x = max1;
          }
          // A inside B
          else if (min1 > min2 && max1 < max2) {
            len = max1 - min1;
            relC1x = min1;
            relC2x = max1;
          }
          // B inside A
          else if (min2 > min1 && max2 < max1) {
            len = max2 - min2;
            relC1x = min2;
            relC2x = max2;
          }
          // Partial overlap
          else {
            len = Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
            relC1x = Math.min(max1, max2);
            relC2x = Math.max(min1, min2);
          }

          // Only add if overlap is long enough
          if (len * len > minLenght2) {
            totalLength += len;

            // Rotate back to original coordinate system
            const relC1 = { x: relC1x * c2, y: relC1x * s2 };
            const relC2 = { x: relC2x * c2, y: relC2x * s2 };

            // Translate back to absolute coordinates
            const C1 = { x: relC1.x + A1.x, y: relC1.y + A1.y };
            const C2 = { x: relC2.x + A1.x, y: relC2.y + A1.y };

            segments.push([C1, C2]);
          }
        }
      }

      // Recursively handle children (holes)
      if (B.children && B.children.length > 0) {
        const child = mergedLength(B.children, p, minlength, tolerance);
        totalLength += child.totalLength;
        segments = segments.concat(child.segments);
      }
    }
  }

  return { totalLength, segments };
}
