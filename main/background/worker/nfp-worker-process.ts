/**
 * NFP Worker Process - Self-contained function for parallel NFP calculation
 *
 * CRITICAL: This function is SERIALIZED and sent to web workers.
 * All helper functions MUST be inlined - no external imports allowed at runtime.
 */

// Declare runtime globals (loaded via p.require in worker)
declare const ClipperLib: any;
declare const GeometryUtil: any;

export interface NFPPair {
  A: Array<{ x: number; y: number }> | null;
  B: Array<{ x: number; y: number }> | null;
  Arotation: number;
  Brotation: number;
  Asource: number | string;
  Bsource: number | string;
  nfp?: Array<{ x: number; y: number }>;
}

export const process = function (pair: NFPPair): NFPPair {
  var A = rotatePolygon(pair.A!, pair.Arotation);
  var B = rotatePolygon(pair.B!, pair.Brotation);

  // @ts-expect-error Unused but kept for parity with original background.js
  var clipper = new ClipperLib.Clipper();

  var Ac = toClipperCoordinates(A);
  ClipperLib.JS.ScaleUpPath(Ac, 10000000); // Scale factor of 10^7 ensures integer precision for floating point coordinates while avoiding overflow
  var Bc = toClipperCoordinates(B);
  ClipperLib.JS.ScaleUpPath(Bc, 10000000); // Must use same scale factor for both polygons to maintain relative positioning
  // Negate polygon B coordinates to compute Minkowski difference (A - B) instead of sum (A + B)
  // Mathematical basis: NFP(A,B) = A ⊕ (-B) where ⊕ is Minkowski sum
  // The negation converts the sum operation into a difference, giving us the no-fit polygon
  for (let i = 0; i < Bc.length; i++) {
    Bc[i].X *= -1;
    Bc[i].Y *= -1;
  }
  // Compute Minkowski sum with negated B to get the NFP
  // The 'true' parameter indicates this is a closed polygon (not a path)
  var solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
  var clipperNfp: Array<{ x: number; y: number }> | undefined;

  var largestArea: number | null = null;
  for (let i = 0; i < solution.length; i++) {
    var n = toNestCoordinates(solution[i], 10000000); // Convert back using same scale factor to restore original coordinate precision
    var sarea = -GeometryUtil.polygonArea(n);
    if (largestArea === null || largestArea < sarea) {
      clipperNfp = n;
      largestArea = sarea;
    }
  }

  for (let i = 0; i < clipperNfp!.length; i++) {
    clipperNfp![i].x += B[0].x;
    clipperNfp![i].y += B[0].y;
  }

  pair.A = null;
  pair.B = null;
  pair.nfp = clipperNfp;
  return pair;

  function toClipperCoordinates(polygon: Array<{ x: number; y: number }>) {
    var clone = [];
    for (let i = 0; i < polygon.length; i++) {
      clone.push({
        X: polygon[i].x,
        Y: polygon[i].y,
      });
    }

    return clone;
  }

  function toNestCoordinates(
    polygon: Array<{ X: number; Y: number }>,
    scale: number,
  ) {
    var clone = [];
    for (let i = 0; i < polygon.length; i++) {
      clone.push({
        x: polygon[i].X / scale,
        y: polygon[i].Y / scale,
      });
    }

    return clone;
  }

  function rotatePolygon(
    polygon: Array<{ x: number; y: number }>,
    degrees: number,
  ) {
    var rotated = [];
    var angle = (degrees * Math.PI) / 180;
    for (let i = 0; i < polygon.length; i++) {
      var x = polygon[i].x;
      var y = polygon[i].y;
      var x1 = x * Math.cos(angle) - y * Math.sin(angle);
      var y1 = x * Math.sin(angle) + y * Math.cos(angle);

      rotated.push({ x: x1, y: y1 });
    }

    return rotated;
  }
};
