import type { Polygon, NestConfig } from "../types/index.js";
import { toNestCoordinates } from "../geometry/coordinate-conversion.js";
import { getFrame } from "./frame-calculator.js";
import { getOuterNfp } from "./outer-nfp.js";
import { innerNfpToClipperCoordinates } from "./nfp-to-clipper.js";
import { BackgroundContext } from "../context/background-context.js";

declare const ClipperLib: {
  Paths: new () => any;
  Clipper: new () => any;
  PolyType: { ptClip: number; ptSubject: number };
  ClipType: { ctDifference: number };
  PolyFillType: { pftNonZero: number };
};

export function getInnerNfp(
  A: Polygon,
  B: Polygon,
  config: NestConfig,
): Polygon[] | null {
  if (
    typeof A.source !== "undefined" &&
    typeof B.source !== "undefined" &&
    typeof B.rotation !== "undefined"
  ) {
    const doc = BackgroundContext.getInstance()
      .getDb()
      .find(
        {
          A: A.source,
          B: B.source,
          Arotation: 0,
          Brotation: B.rotation,
          nfp: [] as any,
        },
        true,
      );

    if (doc) {
      return doc as any;
    }
  }

  const frame = getFrame(A);
  const nfp = getOuterNfp(frame, B, true) as Polygon | null;

  if (!nfp || !nfp.children || nfp.children.length === 0) {
    return null;
  }

  const holes: Polygon[] = [];
  if (A.children && A.children.length > 0) {
    for (let i = 0; i < A.children.length; i++) {
      const hnfp = getOuterNfp(A.children[i], B, false);
      if (hnfp) {
        holes.push(hnfp as Polygon);
      }
    }
  }

  if (holes.length === 0) {
    return nfp.children;
  }

  const clipperNfp = innerNfpToClipperCoordinates(nfp.children, config);
  const clipperHoles = innerNfpToClipperCoordinates(holes, config);

  const finalNfp = new ClipperLib.Paths();
  const clipper = new ClipperLib.Clipper();

  clipper.AddPaths(clipperHoles, ClipperLib.PolyType.ptClip, true);
  clipper.AddPaths(clipperNfp, ClipperLib.PolyType.ptSubject, true);

  if (
    !clipper.Execute(
      ClipperLib.ClipType.ctDifference,
      finalNfp,
      ClipperLib.PolyFillType.pftNonZero,
      ClipperLib.PolyFillType.pftNonZero,
    )
  ) {
    return nfp.children;
  }

  if (finalNfp.length === 0) {
    return null;
  }

  const f: Polygon[] = [];
  for (let i = 0; i < finalNfp.length; i++) {
    f.push(toNestCoordinates(finalNfp[i], config.clipperScale));
  }

  if (
    typeof A.source !== "undefined" &&
    typeof B.source !== "undefined" &&
    typeof B.rotation !== "undefined"
  ) {
    const doc = {
      A: A.source,
      B: B.source,
      Arotation: 0,
      Brotation: B.rotation,
      nfp: f as any,
    };
    BackgroundContext.getInstance().getDb().insert(doc, true);
  }

  return f;
}
