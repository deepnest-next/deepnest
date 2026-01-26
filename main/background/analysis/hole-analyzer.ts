import type { Polygon, NestConfig } from "../types/index.js";

// Ambient declaration for GeometryUtil
declare const GeometryUtil: {
  polygonArea(polygon: any): number;
  getPolygonBounds(polygon: any): {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/**
 * Information about a hole in a sheet
 */
export interface HoleInfo {
  sheetIndex: number;
  holeIndex: number;
  area: number;
  width: number;
  height: number;
  isWide: boolean;
}

/**
 * Analysis result for all holes in sheets
 */
export interface SheetHoleAnalysis {
  holes: HoleInfo[];
  totalHoleArea: number;
  averageHoleArea: number;
  count: number;
}

/**
 * Bounding box and area information for a part
 */
export interface PartBounds {
  width: number;
  height: number;
  area: number;
}

/**
 * Information about a hole that a part can fit into
 */
export interface HoleMatch {
  partId: number | string;
  holeIndex: number;
  requiresRotation: boolean;
  fitRatio: number;
}

/**
 * Result of analyzing parts for hole placement
 */
export interface PartAnalysis {
  mainParts: Polygon[];
  holeCandidates: Polygon[];
}

/**
 * Analyzes all holes in sheets to gather statistics.
 *
 * @param sheets - Array of sheet polygons with potential children (holes)
 * @returns Analysis containing hole information and statistics
 */
export function analyzeSheetHoles(sheets: Polygon[]): SheetHoleAnalysis {
  const allHoles: HoleInfo[] = [];
  let totalHoleArea = 0;

  // Analyze each sheet
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    if (sheet.children && sheet.children.length > 0) {
      for (let j = 0; j < sheet.children.length; j++) {
        const hole = sheet.children[j];
        const holeArea = Math.abs(GeometryUtil.polygonArea(hole));
        const holeBounds = GeometryUtil.getPolygonBounds(hole);

        const holeInfo: HoleInfo = {
          sheetIndex: i,
          holeIndex: j,
          area: holeArea,
          width: holeBounds.width,
          height: holeBounds.height,
          isWide: holeBounds.width > holeBounds.height,
        };

        allHoles.push(holeInfo);
        totalHoleArea += holeArea;
      }
    }
  }

  // Calculate statistics about holes
  const averageHoleArea =
    allHoles.length > 0 ? totalHoleArea / allHoles.length : 0;

  return {
    holes: allHoles,
    totalHoleArea: totalHoleArea,
    averageHoleArea: averageHoleArea,
    count: allHoles.length,
  };
}

/**
 * Analyzes all parts to identify those with holes and those that could fit in holes.
 *
 * @param parts - Array of part polygons to analyze
 * @param averageHoleArea - Average hole area from sheet analysis (used for filtering)
 * @param config - Configuration object with holeAreaThreshold
 * @return Analysis result containing:
 *   - mainParts: Parts that have holes or are too large for hole placement
 *   - holeCandidates: Small parts that could potentially fit inside holes
 *
 * This function performs two-pass analysis:
 *
 * FIRST PASS - Identify parts with holes:
 * - Scans each part for children (holes)
 * - Records hole dimensions, area, and aspect ratio
 * - Calculates bounding box and area for all parts
 *
 * SECOND PASS - Identify hole placement candidates:
 * - For each part, checks if it could fit inside holes of other parts
 * - Tests both normal and rotated orientations (90° rotation)
 * - Uses conservative tolerances (98% width/height, 95% area) to ensure valid fits
 * - Tracks orientation matching (wide-to-wide, tall-to-tall) for quality scoring
 *
 * Parts are categorized as:
 * - Main parts: Have holes themselves, or are larger than the hole area threshold
 * - Hole candidates: Small enough to potentially fit in holes of main parts
 *
 * This separation allows the placement algorithm to prioritize placing main parts first,
 * then attempt to fill their holes with smaller parts for maximum efficiency.
 */
export function analyzeParts(
  parts: Polygon[],
  averageHoleArea: number,
  config: NestConfig,
): PartAnalysis {
  const mainParts: Polygon[] = [];
  const holeCandidates: Polygon[] = [];
  const partsWithHoles: Polygon[] = [];

  // First pass: identify parts with holes
  for (let i = 0; i < parts.length; i++) {
    const children = parts[i].children;
    if (children && children.length > 0) {
      const partHoles: any[] = [];
      for (let j = 0; j < children.length; j++) {
        const hole = children[j];
        const holeArea = Math.abs(GeometryUtil.polygonArea(hole));
        const holeBounds = GeometryUtil.getPolygonBounds(hole);

        partHoles.push({
          holeIndex: j,
          area: holeArea,
          width: holeBounds.width,
          height: holeBounds.height,
          isWide: holeBounds.width > holeBounds.height,
        });
      }

      if (partHoles.length > 0) {
        (parts[i] as any).analyzedHoles = partHoles;
        partsWithHoles.push(parts[i]);
      }
    }

    // Calculate and store the part's dimensions for later use
    const partBounds = GeometryUtil.getPolygonBounds(parts[i]);
    (parts[i] as any).bounds = {
      width: partBounds.width,
      height: partBounds.height,
      area: Math.abs(GeometryUtil.polygonArea(parts[i])),
    };
  }

  // console.log(`Found ${partsWithHoles.length} parts with holes`);

  // Second pass: check which parts fit into other parts' holes
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partMatches: HoleMatch[] = [];

    // Check if this part fits into holes of other parts
    for (let j = 0; j < partsWithHoles.length; j++) {
      const partWithHoles = partsWithHoles[j];
      if (part.id === partWithHoles.id) continue; // Skip self

      for (let k = 0; k < (partWithHoles as any).analyzedHoles.length; k++) {
        const hole = (partWithHoles as any).analyzedHoles[k];

        // Check if part fits in this hole (with or without rotation)
        // @preserve 0.98 - Dimension tolerance of 98% ensures part fits with clearance for NFP precision
        // @preserve 0.95 - Area tolerance of 95% prevents attempting to fit parts that are too large
        // More conservative area threshold accounts for part shape vs. bounding box differences
        const fitsNormally =
          (part as any).bounds.width < hole.width * 0.98 &&
          (part as any).bounds.height < hole.height * 0.98 &&
          (part as any).bounds.area < hole.area * 0.95;

        const fitsRotated =
          (part as any).bounds.height < hole.width * 0.98 &&
          (part as any).bounds.width < hole.height * 0.98 &&
          (part as any).bounds.area < hole.area * 0.95;

        if (fitsNormally || fitsRotated) {
          partMatches.push({
            partId: partWithHoles.id!,
            holeIndex: k,
            requiresRotation: !fitsNormally && fitsRotated,
            fitRatio: (part as any).bounds.area / hole.area,
          });
        }
      }
    }

    // Determine if part is a hole candidate
    // @preserve 0.7 - Consider parts smaller than threshold OR smaller than 70% of average hole area
    // The 70% factor ensures parts significantly smaller than typical holes are prioritized for hole placement
    // This adaptive threshold works even when holeAreaThreshold isn't perfectly tuned for the job
    const isSmallEnough =
      (config.holeAreaThreshold !== undefined &&
        (part as any).bounds.area < config.holeAreaThreshold) ||
      (part as any).bounds.area < averageHoleArea * 0.7;

    if (partMatches.length > 0 || isSmallEnough) {
      (part as any).holeMatches = partMatches;
      (part as any).isHoleFitCandidate = true;
      holeCandidates.push(part);
    } else {
      mainParts.push(part);
    }
  }

  // Prioritize order of main parts - parts with holes that others fit into go first
  mainParts.sort((a, b) => {
    const aHasMatches = holeCandidates.some(
      (p) =>
        (p as any).holeMatches &&
        (p as any).holeMatches.some(
          (match: HoleMatch) => match.partId === a.id,
        ),
    );

    const bHasMatches = holeCandidates.some(
      (p) =>
        (p as any).holeMatches &&
        (p as any).holeMatches.some(
          (match: HoleMatch) => match.partId === b.id,
        ),
    );

    // First priority: parts with holes that other parts fit into
    if (aHasMatches && !bHasMatches) return -1;
    if (!aHasMatches && bHasMatches) return 1;

    // Second priority: larger parts first
    return (b as any).bounds.area - (a as any).bounds.area;
  });

  // For hole candidates, prioritize parts that fit into holes of parts in mainParts
  holeCandidates.sort((a, b) => {
    const aFitsInMainPart =
      (a as any).holeMatches &&
      (a as any).holeMatches.some((match: HoleMatch) =>
        mainParts.some((mp) => mp.id === match.partId),
      );

    const bFitsInMainPart =
      (b as any).holeMatches &&
      (b as any).holeMatches.some((match: HoleMatch) =>
        mainParts.some((mp) => mp.id === match.partId),
      );

    // Priority to parts that fit in holes of main parts
    if (aFitsInMainPart && !bFitsInMainPart) return -1;
    if (!aFitsInMainPart && bFitsInMainPart) return 1;

    // Then by number of matches
    const aMatchCount = (a as any).holeMatches
      ? (a as any).holeMatches.length
      : 0;
    const bMatchCount = (b as any).holeMatches
      ? (b as any).holeMatches.length
      : 0;
    if (aMatchCount !== bMatchCount) return bMatchCount - aMatchCount;

    // Then by size (smaller first for hole candidates)
    return (a as any).bounds.area - (b as any).bounds.area;
  });

  return { mainParts, holeCandidates };
}
