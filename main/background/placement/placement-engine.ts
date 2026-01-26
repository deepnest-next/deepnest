/**
 * Placement Engine - Core nesting algorithm for placing parts on sheets
 *
 * Migrated from main/background.js placeParts() function (lines 997-2488)
 */

// @ts-nocheck - Migrated from JavaScript, preserving original structure
// TODO: Add proper TypeScript types incrementally

import type { Polygon, NestConfig, PlacementResult } from "../types/index.js";
import { rotatePolygon, shiftPolygon, getHull } from "../geometry/index.js";
import { toClipperCoordinates, toNestCoordinates } from "../geometry/index.js";
import { getOuterNfp, getInnerNfp } from "../nfp/index.js";
import {
  nfpToClipperCoordinates,
  innerNfpToClipperCoordinates,
} from "../nfp/index.js";
import { analyzeSheetHoles, analyzeParts } from "../analysis/index.js";
import { mergedLength } from "../merging/index.js";

declare const GeometryUtil: any;
declare const ClipperLib: any;
declare const ipcRenderer: { send: (channel: string, data: any) => void };

export function placeParts(
  sheets: Polygon[],
  parts: Polygon[],
  config: NestConfig,
  nestindex: number,
): PlacementResult | null {
  if (!sheets) {
    return null;
  }

  var i, j, k, m, n, part;

  var totalnum = parts.length;
  var totalsheetarea = 0;

  // total length of merged lines
  var totalMerged = 0;

  // rotate paths by given rotation
  var rotated = [];
  for (let i = 0; i < parts.length; i++) {
    var r = rotatePolygon(parts[i], parts[i].rotation);
    r.rotation = parts[i].rotation;
    r.source = parts[i].source;
    r.id = parts[i].id;
    r.filename = parts[i].filename;

    rotated.push(r);
  }

  parts = rotated;

  // Set default holeAreaThreshold if not defined
  if (!config.holeAreaThreshold) {
    // Default threshold of 1000 square units determines which parts are small enough to consider for hole placement
    // Parts smaller than this threshold will be prioritized for placement inside holes of larger parts
    // This value balances hole utilization vs. computation time - smaller values = more aggressive hole packing
    config.holeAreaThreshold = 1000;
  }

  // Pre-analyze holes in all sheets
  const sheetHoleAnalysis = analyzeSheetHoles(sheets);

  // Analyze all parts to identify those with holes and potential fits
  const { mainParts, holeCandidates } = analyzeParts(
    parts,
    sheetHoleAnalysis.averageHoleArea,
    config,
  );

  // console.log(`Analyzed parts: ${mainParts.length} main parts, ${holeCandidates.length} hole candidates`);

  var allplacements = [];
  // ============================================================================
  // FITNESS SCORING SYSTEM - OVERVIEW
  // ============================================================================
  // Fitness is the primary metric used by the genetic algorithm to evaluate
  // and compare different nesting solutions. The algorithm seeks to minimize
  // fitness (LOWER FITNESS IS BETTER).
  //
  // WHAT FITNESS REPRESENTS:
  // - A numerical score representing the "cost" or "inefficiency" of a nesting solution
  // - Combines multiple factors: sheet usage, bounding box size, material waste, etc.
  // - Enables the genetic algorithm to compare different part arrangements objectively
  //
  // FITNESS COMPONENTS (all additive):
  // 1. SHEET AREA PENALTY: Each new sheet adds its area to fitness
  //    - Incentivizes using fewer sheets (minimizes material cost)
  //    - Opening a new sheet is expensive in terms of fitness
  //
  // 2. PLACEMENT QUALITY: Based on selected strategy (gravity/box/convexhull)
  //    - Gravity: Penalizes width (5x weight) more than height
  //    - Box: Penalizes bounding box area (width × height)
  //    - Convex hull: Penalizes area of convex hull around all parts
  //
  // 3. UNPLACED PART PENALTIES: Massive penalties for parts that don't fit
  //    - Multiplier of 100,000,000 ensures unplaced parts dominate fitness
  //    - Scaled by part area to penalize larger unplaced parts more heavily
  //
  // 4. HOLE PLACEMENT BONUSES: Rewards for placing parts inside holes (negative fitness)
  //    - Base reward: part_area / total_sheet_area / 100
  //    - Adjacent parts in same hole: additional 1% bonus
  //    - Encourages efficient use of cutout spaces
  //
  // 5. EDGE MERGING SAVINGS: Reduces fitness when edges can be merged (if enabled)
  //    - Subtracts merged_length × time_ratio from fitness
  //    - Rewards placements that reduce cutting time
  //
  // HOW FITNESS GUIDES OPTIMIZATION:
  // - The genetic algorithm generates populations of solutions (different rotations/positions)
  // - Each solution is evaluated by placing all parts and calculating total fitness
  // - Solutions with lower fitness are more likely to be selected for breeding
  // - Over many generations, fitness decreases as solutions improve
  // - Final result is the solution with the lowest fitness found
  // ============================================================================
  var fitness = 0;

  // Now continue with the original placeParts logic, but use our sorted parts

  // Combine main parts and hole candidates back into a single array
  // mainParts first since we want to place them first
  parts = [...mainParts, ...holeCandidates];

  // Continue with the original placeParts logic
  // var binarea = Math.abs(GeometryUtil.polygonArea(self.binPolygon));
  var key, nfp;
  var part;

  while (parts.length > 0) {
    var placed = [];
    var placements = [];

    // open a new sheet
    var sheet = sheets.shift();
    var sheetarea = Math.abs(GeometryUtil.polygonArea(sheet));
    totalsheetarea += sheetarea;

    // ============================================================================
    // FITNESS PENALTY: NEW SHEET OPENED
    // ============================================================================
    // Add the sheet's area to the fitness score whenever a new sheet is opened.
    // This creates a strong incentive to minimize the number of sheets used.
    //
    // WHY THIS PENALTY EXISTS:
    // - Opening additional sheets increases material cost (more sheets = more money)
    // - Each new sheet adds setup time and waste (scrap from unused portions)
    // - Encourages the algorithm to pack parts tightly into fewer sheets
    //
    // HOW IT AFFECTS OPTIMIZATION:
    // - Solutions that use 1 sheet will have much lower fitness than those using 2+ sheets
    // - The algorithm will strongly prefer tight packing on one sheet over loose packing on multiple
    // - This penalty is proportional to sheet size, so larger sheets have larger penalties
    //   (making it more expensive to open big sheets unnecessarily)
    //
    // EXAMPLE:
    // - Sheet A (1000x1000) adds 1,000,000 to fitness when opened
    // - If parts could fit on one sheet, opening a second adds another 1,000,000
    // - This massive penalty ensures the algorithm exhausts packing options on existing
    //   sheets before opening new ones
    // ============================================================================
    fitness += sheetarea;

    var clipCache = [];
    //console.log('new sheet');
    for (let i = 0; i < parts.length; i++) {
      // console.time('placement');
      part = parts[i];

      // inner NFP
      var sheetNfp = null;
      // try all possible rotations until it fits
      // (only do this for the first part of each sheet, to ensure that all parts that can be placed are, even if we have to to open a lot of sheets)
      for (let j = 0; j < config.rotations; j++) {
        sheetNfp = getInnerNfp(sheet, part, config);

        if (sheetNfp) {
          break;
        }

        // Rotate by equal angle steps (360° / number of allowed rotations) to try all configured orientations
        // This ensures even distribution of rotation attempts across the full circle
        var r = rotatePolygon(part, 360 / config.rotations);
        r.rotation = part.rotation + 360 / config.rotations;
        r.source = part.source;
        r.id = part.id;
        r.filename = part.filename;

        // rotation is not in-place
        part = r;
        parts[i] = r;

        // Normalize rotation to 0-360° range using modulo to prevent overflow
        if (part.rotation > 360) {
          part.rotation = part.rotation % 360;
        }
      }
      // part unplaceable, skip
      if (!sheetNfp || sheetNfp.length == 0) {
        continue;
      }

      var position = null;

      if (placed.length == 0) {
        // first placement, put it on the top left corner
        for (let j = 0; j < sheetNfp.length; j++) {
          for (let k = 0; k < sheetNfp[j].length; k++) {
            if (
              position === null ||
              sheetNfp[j][k].x - part[0].x < position.x ||
              (GeometryUtil.almostEqual(
                sheetNfp[j][k].x - part[0].x,
                position.x,
              ) &&
                sheetNfp[j][k].y - part[0].y < position.y)
            ) {
              position = {
                x: sheetNfp[j][k].x - part[0].x,
                y: sheetNfp[j][k].y - part[0].y,
                id: part.id,
                rotation: part.rotation,
                source: part.source,
                filename: part.filename,
              };
            }
          }
        }
        if (position === null) {
          // console.log(sheetNfp);
        }
        placements.push(position);
        placed.push(part);

        continue;
      }

      // ============================================================================
      // HOLE-FITTING STRATEGY
      // ============================================================================
      // This section implements an advanced material utilization optimization by
      // attempting to place smaller parts inside holes (cutouts) of already-placed
      // larger parts. This maximizes sheet usage by filling otherwise wasted space.
      //
      // OVERALL STRATEGY:
      // 1. Scan all previously placed parts to identify those with holes (children)
      // 2. For each hole, check if current part is small enough to fit inside
      // 3. Try multiple rotations (0°, 90°, 180°, 270°) to find optimal orientation
      // 4. Compute inner NFP (No-Fit Polygon) for valid hole placements
      // 5. Track all candidate positions and select best one during placement phase
      //
      // PART-TO-HOLE MATCHING:
      // - Parts are matched to holes based on area comparison (hole must be 10% larger)
      // - Inner NFP calculation determines exact valid placement positions within hole
      // - Orientation matching (wide-to-wide, tall-to-tall) is tracked as a quality metric
      // - Fill ratio (part area / hole area) helps prioritize efficient space usage
      //
      // ROTATION IMPORTANCE:
      // - Different rotations can mean the difference between fitting or not fitting
      // - A rectangular part may only fit in a rectangular hole at specific angles
      // - Orientation matching (aligning wide parts with wide holes) improves packing density
      // - All 4 cardinal rotations (90° increments) are tested to maximize fit success rate
      // - The rotation with best orientation match is selected when multiple rotations work
      //
      // The resulting hole positions compete with regular sheet positions during the
      // placement selection phase, allowing the algorithm to choose the globally optimal
      // placement location for each part.
      // ============================================================================

      // Check for holes in already placed parts where this part might fit
      var holePositions = [];
      try {
        // Track the best rotation for each hole
        const holeOptimalRotations = new Map(); // Map of "parentIndex_holeIndex" -> best rotation

        for (let j = 0; j < placed.length; j++) {
          if (placed[j].children && placed[j].children.length > 0) {
            for (let k = 0; k < placed[j].children.length; k++) {
              // Check if the hole is large enough for the part
              var childHole = placed[j].children[k];
              var childArea = Math.abs(GeometryUtil.polygonArea(childHole));
              var partArea = Math.abs(GeometryUtil.polygonArea(part));

              // Only consider holes that are larger than the part
              // Require hole to be 10% (1.1x) larger than part to ensure valid placement with clearance
              // This buffer accounts for NFP calculation precision and prevents tight fits that may cause overlap
              if (childArea > partArea * 1.1) {
                try {
                  var holePoly = [];
                  // Create proper array structure for the hole polygon
                  for (let p = 0; p < childHole.length; p++) {
                    holePoly.push({
                      x: childHole[p].x,
                      y: childHole[p].y,
                      exact: childHole[p].exact || false,
                    });
                  }

                  // Add polygon metadata
                  holePoly.source = placed[j].source + "_hole_" + k;
                  holePoly.rotation = 0;
                  holePoly.children = [];

                  // Get dimensions of the hole and part to match orientations
                  const holeBounds = GeometryUtil.getPolygonBounds(holePoly);
                  const partBounds = GeometryUtil.getPolygonBounds(part);

                  // Determine if the hole is wider than it is tall
                  const holeIsWide = holeBounds.width > holeBounds.height;
                  const partIsWide = partBounds.width > partBounds.height;

                  // Try part with current rotation
                  let bestRotationNfp = null;
                  let bestRotation = part.rotation;
                  let bestFitFill = 0;
                  let rotationPlacements = [];

                  // Try original rotation
                  var holeNfp = getInnerNfp(holePoly, part, config);
                  if (holeNfp && holeNfp.length > 0) {
                    bestRotationNfp = holeNfp;
                    bestFitFill = partArea / childArea;

                    for (let m = 0; m < holeNfp.length; m++) {
                      for (let n = 0; n < holeNfp[m].length; n++) {
                        rotationPlacements.push({
                          x: holeNfp[m][n].x - part[0].x + placements[j].x,
                          y: holeNfp[m][n].y - part[0].y + placements[j].y,
                          rotation: part.rotation,
                          orientationMatched: holeIsWide === partIsWide,
                          fillRatio: bestFitFill,
                        });
                      }
                    }
                  }

                  // Try up to 4 different rotations (0°, 90°, 180°, 270°) to find the best fit for this hole
                  // These 90° increments cover all orthogonal orientations, maximizing chances of finding optimal fit
                  // while keeping computational cost reasonable (checking all 4 cardinal orientations)
                  const rotationsToTry = [90, 180, 270];
                  for (let rot of rotationsToTry) {
                    let newRotation = (part.rotation + rot) % 360;
                    const rotatedPart = rotatePolygon(part, newRotation);
                    rotatedPart.rotation = newRotation;
                    rotatedPart.source = part.source;
                    rotatedPart.id = part.id;
                    rotatedPart.filename = part.filename;

                    const rotatedBounds =
                      GeometryUtil.getPolygonBounds(rotatedPart);
                    const rotatedIsWide =
                      rotatedBounds.width > rotatedBounds.height;
                    const rotatedNfp = getInnerNfp(
                      holePoly,
                      rotatedPart,
                      config,
                    );

                    if (rotatedNfp && rotatedNfp.length > 0) {
                      // Calculate fill ratio for this rotation
                      const rotatedFill = partArea / childArea;

                      // If this rotation has better orientation match or is the first valid one
                      if (
                        (holeIsWide === rotatedIsWide &&
                          (bestRotationNfp === null ||
                            !(holeIsWide === partIsWide))) ||
                        bestRotationNfp === null
                      ) {
                        bestRotationNfp = rotatedNfp;
                        bestRotation = newRotation;
                        bestFitFill = rotatedFill;

                        // Clear previous placements for worse rotations
                        rotationPlacements = [];

                        for (let m = 0; m < rotatedNfp.length; m++) {
                          for (let n = 0; n < rotatedNfp[m].length; n++) {
                            rotationPlacements.push({
                              x:
                                rotatedNfp[m][n].x -
                                rotatedPart[0].x +
                                placements[j].x,
                              y:
                                rotatedNfp[m][n].y -
                                rotatedPart[0].y +
                                placements[j].y,
                              rotation: newRotation,
                              orientationMatched: holeIsWide === rotatedIsWide,
                              fillRatio: bestFitFill,
                            });
                          }
                        }
                      }
                    }
                  }

                  // If we found valid placements, add them to the hole positions
                  if (rotationPlacements.length > 0) {
                    const holeKey = `${j}_${k}`;
                    holeOptimalRotations.set(holeKey, bestRotation);

                    // Add all placements with complete data
                    for (let placement of rotationPlacements) {
                      holePositions.push({
                        x: placement.x,
                        y: placement.y,
                        id: part.id,
                        rotation: placement.rotation,
                        source: part.source,
                        filename: part.filename,
                        inHole: true,
                        parentIndex: j,
                        holeIndex: k,
                        orientationMatched: placement.orientationMatched,
                        rotated: placement.rotation !== part.rotation,
                        fillRatio: placement.fillRatio,
                      });
                    }
                  }
                } catch (e) {
                  // console.log('Error processing hole:', e);
                  // Continue with next hole
                }
              }
            }
          }
        }
      } catch (e) {
        // console.log('Error in hole detection:', e);
        // Continue with normal placement, ignoring holes
      }

      // Fix hole creation by ensuring proper polygon structure
      var validHolePositions = [];
      if (holePositions && holePositions.length > 0) {
        // Filter hole positions to only include valid ones
        for (let j = 0; j < holePositions.length; j++) {
          try {
            // Get parent and hole info
            var parentIdx = holePositions[j].parentIndex;
            var holeIdx = holePositions[j].holeIndex;
            if (
              parentIdx >= 0 &&
              parentIdx < placed.length &&
              placed[parentIdx].children &&
              holeIdx >= 0 &&
              holeIdx < placed[parentIdx].children.length
            ) {
              validHolePositions.push(holePositions[j]);
            }
          } catch (e) {
            // console.log('Error validating hole position:', e);
          }
        }
        holePositions = validHolePositions;
        // console.log(`Found ${holePositions.length} valid hole positions for part ${part.source}`);
      }

      var clipperSheetNfp = innerNfpToClipperCoordinates(sheetNfp, config);
      var clipper = new ClipperLib.Clipper();
      var combinedNfp = new ClipperLib.Paths();
      var error = false;

      // check if stored in clip cache
      var clipkey = "s:" + part.source + "r:" + part.rotation;
      var startindex = 0;
      if (clipCache[clipkey]) {
        var prevNfp = clipCache[clipkey].nfp;
        clipper.AddPaths(prevNfp, ClipperLib.PolyType.ptSubject, true);
        startindex = clipCache[clipkey].index;
      }

      for (let j = startindex; j < placed.length; j++) {
        nfp = getOuterNfp(placed[j], part);
        // minkowski difference failed. very rare but could happen
        if (!nfp) {
          error = true;
          break;
        }
        // shift to placed location
        for (let m = 0; m < nfp.length; m++) {
          nfp[m].x += placements[j].x;
          nfp[m].y += placements[j].y;
        }

        if (nfp.children && nfp.children.length > 0) {
          for (let n = 0; n < nfp.children.length; n++) {
            for (let o = 0; o < nfp.children[n].length; o++) {
              nfp.children[n][o].x += placements[j].x;
              nfp.children[n][o].y += placements[j].y;
            }
          }
        }

        var clipperNfp = nfpToClipperCoordinates(nfp, config);
        clipper.AddPaths(clipperNfp, ClipperLib.PolyType.ptSubject, true);
      }

      if (
        error ||
        !clipper.Execute(
          ClipperLib.ClipType.ctUnion,
          combinedNfp,
          ClipperLib.PolyFillType.pftNonZero,
          ClipperLib.PolyFillType.pftNonZero,
        )
      ) {
        // console.log('clipper error', error);
        continue;
      }

      clipCache[clipkey] = {
        nfp: combinedNfp,
        index: placed.length - 1,
      };
      // console.log('save cache', placed.length - 1);

      // difference with sheet polygon
      var finalNfp = new ClipperLib.Paths();
      clipper = new ClipperLib.Clipper();
      clipper.AddPaths(combinedNfp, ClipperLib.PolyType.ptClip, true);
      clipper.AddPaths(clipperSheetNfp, ClipperLib.PolyType.ptSubject, true);

      if (
        !clipper.Execute(
          ClipperLib.ClipType.ctDifference,
          finalNfp,
          ClipperLib.PolyFillType.pftEvenOdd,
          ClipperLib.PolyFillType.pftNonZero,
        )
      ) {
        continue;
      }

      if (!finalNfp || finalNfp.length == 0) {
        continue;
      }

      var f = [];
      for (let j = 0; j < finalNfp.length; j++) {
        // back to normal scale
        f.push(toNestCoordinates(finalNfp[j], config.clipperScale));
      }
      finalNfp = f;

      // choose placement that results in the smallest bounding box/hull etc
      // todo: generalize gravity direction
      var minwidth = null;
      var minarea = null;
      var minx = null;
      var miny = null;
      var nf, area, shiftvector;
      var allpoints = [];
      for (let m = 0; m < placed.length; m++) {
        for (let n = 0; n < placed[m].length; n++) {
          allpoints.push({
            x: placed[m][n].x + placements[m].x,
            y: placed[m][n].y + placements[m].y,
          });
        }
      }

      // ============================================================================
      // PLACEMENT STRATEGY SELECTION
      // ============================================================================
      // The nesting algorithm supports three different placement strategies, each
      // optimizing for different packing objectives. The strategy determines how
      // the "fitness" of each candidate position is evaluated.
      //
      // STRATEGY 1: GRAVITY PLACEMENT
      // - Objective: Pack parts tightly from left to right (compress width)
      // - Fitness metric: Bounding box width × 5 + height
      // - Behavior: Parts tend to stack vertically, minimizing horizontal spread
      // - Best for: Long, narrow sheets where width is the critical dimension
      // - Trade-offs: May result in taller arrangements, but with minimal width
      //
      // STRATEGY 2: BOX PLACEMENT
      // - Objective: Minimize the overall bounding box area
      // - Fitness metric: Bounding box width × height (area)
      // - Behavior: Balances both width and height reduction equally
      // - Best for: Square or rectangular sheets where both dimensions matter
      // - Trade-offs: More balanced packing, but no directional preference
      //
      // STRATEGY 3: CONVEX HULL PLACEMENT
      // - Objective: Minimize the area of the convex hull around all placed parts
      // - Fitness metric: Area of the convex hull polygon
      // - Behavior: Creates compact, roughly circular arrangements
      // - Best for: Irregular sheet shapes or when perimeter length matters
      // - Trade-offs: Most computationally expensive, but best material utilization
      //   for complex geometries
      //
      // HOW STRATEGY AFFECTS PLACEMENT:
      // For each candidate position in the valid placement region (computed from NFPs),
      // we calculate the fitness score using the selected strategy. The position with
      // the best (lowest) fitness score is chosen. Different strategies will often
      // select different positions for the same part, leading to dramatically different
      // final nesting layouts.
      // ============================================================================

      var allbounds;
      var partbounds;
      var hull = null;
      if (config.placementType == "gravity" || config.placementType == "box") {
        // For gravity and box strategies, compute bounding boxes for fitness evaluation
        allbounds = GeometryUtil.getPolygonBounds(allpoints);

        var partpoints = [];
        for (let m = 0; m < part.length; m++) {
          partpoints.push({ x: part[m].x, y: part[m].y });
        }
        partbounds = GeometryUtil.getPolygonBounds(partpoints);
      } else if (config.placementType == "convexhull" && allpoints.length > 0) {
        // For convex hull strategy, pre-compute hull of already-placed parts
        // This hull will be used to evaluate how each candidate position affects overall compactness
        hull = getHull(allpoints);
      }

      // Process regular sheet positions
      for (let j = 0; j < finalNfp.length; j++) {
        nf = finalNfp[j];
        for (let k = 0; k < nf.length; k++) {
          shiftvector = {
            x: nf[k].x - part[0].x,
            y: nf[k].y - part[0].y,
            id: part.id,
            source: part.source,
            rotation: part.rotation,
            filename: part.filename,
            inHole: false,
          };

          if (
            config.placementType == "gravity" ||
            config.placementType == "box"
          ) {
            var rectbounds = GeometryUtil.getPolygonBounds([
              // allbounds points
              { x: allbounds.x, y: allbounds.y },
              { x: allbounds.x + allbounds.width, y: allbounds.y },
              {
                x: allbounds.x + allbounds.width,
                y: allbounds.y + allbounds.height,
              },
              { x: allbounds.x, y: allbounds.y + allbounds.height },
              // part points
              {
                x: partbounds.x + shiftvector.x,
                y: partbounds.y + shiftvector.y,
              },
              {
                x: partbounds.x + partbounds.width + shiftvector.x,
                y: partbounds.y + shiftvector.y,
              },
              {
                x: partbounds.x + partbounds.width + shiftvector.x,
                y: partbounds.y + partbounds.height + shiftvector.y,
              },
              {
                x: partbounds.x + shiftvector.x,
                y: partbounds.y + partbounds.height + shiftvector.y,
              },
            ]);

            // ============================================================================
            // FITNESS CALCULATION: GRAVITY VS BOX PLACEMENT STRATEGIES
            // ============================================================================
            // Different placement strategies use different fitness metrics to evaluate positions.
            // The chosen strategy dramatically affects the final nesting layout.
            //
            // GRAVITY PLACEMENT (width × 5 + height):
            // - Weight factor of 5x for width prioritizes horizontal compression
            // - Creates taller, narrower arrangements (parts stack vertically)
            // - Best for: Long sheets where minimizing width is critical
            // - Example: If two positions have same height but different widths,
            //   the narrower position will have much better (lower) fitness
            //   Position A (width=100, height=50): fitness = 100×5 + 50 = 550
            //   Position B (width=80, height=50): fitness = 80×5 + 50 = 450 (better)
            //
            // BOX PLACEMENT (width × height):
            // - Minimizes bounding box area (standard area calculation)
            // - Balances both width and height reduction equally
            // - Best for: Square/rectangular sheets where both dimensions matter
            // - Example: Positions are compared by total area
            //   Position A (width=100, height=50): fitness = 5,000
            //   Position B (width=80, height=60): fitness = 4,800 (better, despite taller)
            //
            // WHY DIFFERENT STRATEGIES MATTER:
            // - Gravity is directional - it biases placement to one side (left-to-right)
            // - Box is balanced - it seeks overall compactness
            // - The 5x multiplier in gravity mode means width reduction is 5x more valuable
            //   than height reduction, causing parts to cluster horizontally
            // ============================================================================
            if (config.placementType == "gravity") {
              area = rectbounds.width * 5 + rectbounds.height;
            } else {
              area = rectbounds.width * rectbounds.height;
            }
          } else if (config.placementType == "convexhull") {
            // ============================================================================
            // FITNESS CALCULATION: CONVEX HULL PLACEMENT STRATEGY
            // ============================================================================
            // The convex hull strategy evaluates fitness based on the area of the convex
            // hull polygon that encompasses all placed parts. This creates the most
            // compact, space-efficient arrangements.
            //
            // WHAT IS A CONVEX HULL?
            // - The smallest convex polygon that contains all placed parts
            // - Like stretching a rubber band around all parts - it snaps to the outline
            // - Represents the minimal boundary that encloses the entire arrangement
            //
            // HOW FITNESS IS CALCULATED:
            // 1. Compute the convex hull of all previously placed parts
            // 2. For each candidate position, temporarily add the new part's points
            // 3. Recalculate the convex hull including the new part
            // 4. Use the hull's area as the fitness score (lower area = better)
            //
            // WHY THIS STRATEGY IS EFFECTIVE:
            // - Minimizes perimeter and wasted space around parts
            // - Creates roughly circular/compact arrangements (no directional bias)
            // - Best material utilization for irregular sheet shapes
            // - Encourages parts to nestle into concave spaces (filling the hull)
            //
            // EXAMPLE:
            // - Current hull area: 10,000 square units
            // - Position A adds part extending outward: new hull area = 12,000 (fitness = 12,000)
            // - Position B tucks part into existing concave space: new hull area = 10,500 (fitness = 10,500, better)
            // - Position B wins because it expands the hull less, keeping the arrangement compact
            //
            // TRADE-OFFS:
            // - Most computationally expensive (hull calculation for every candidate position)
            // - But produces best material utilization for complex geometries
            // - No directional preference (unlike gravity), so good for all sheet orientations
            // ============================================================================

            // Create points for the part at this candidate position
            var partPoints = [];
            for (let m = 0; m < part.length; m++) {
              partPoints.push({
                x: part[m].x + shiftvector.x,
                y: part[m].y + shiftvector.y,
              });
            }

            var combinedHull = null;
            // If this is the first part, the hull is just the part itself
            if (allpoints.length === 0) {
              combinedHull = getHull(partPoints);
            } else {
              // Merge the points of the part with the points of the hull
              // and recalculate the combined hull (more efficient than using all points)
              var hullPoints = hull.concat(partPoints);
              combinedHull = getHull(hullPoints);
            }

            if (!combinedHull) {
              // console.warn("Failed to calculate convex hull");
              continue;
            }

            // Calculate area of the convex hull as fitness metric
            // Lower hull area = more compact arrangement = better fitness
            area = Math.abs(GeometryUtil.polygonArea(combinedHull));
            // Store for later use
            shiftvector.hull = combinedHull;
          }

          if (config.mergeLines) {
            // ============================================================================
            // FITNESS BONUS: EDGE MERGING OPTIMIZATION
            // ============================================================================
            // When edges of adjacent parts align, they can be cut in a single pass,
            // reducing cutting time and tool wear. This bonus rewards such alignments.
            //
            // WHAT IS EDGE MERGING?
            // - When two parts are positioned such that their edges overlap or are collinear
            // - The CNC cutter can follow the shared edge once instead of twice
            // - Reduces total cutting distance and machine time
            //
            // HOW THE BONUS IS CALCULATED:
            // 1. Identify edges that overlap between the candidate part and placed parts
            // 2. Calculate the total length of mergeable edges
            // 3. Multiply by timeRatio (converts length to time savings)
            // 4. Subtract from fitness (reduces cost, making this position more attractive)
            //
            // EXAMPLE:
            // - Base fitness for position: 5,000
            // - Merged edge length: 100 units
            // - Time ratio: 1.0 (1 unit of length = 1 unit of time)
            // - Adjusted fitness: 5,000 - (100 × 1.0) = 4,900 (better by 100)
            //
            // WHY SMALL EDGES ARE FILTERED (0.5 inch minimum):
            // - Tiny edge alignments don't meaningfully reduce cutting time
            // - Prevents over-optimization on insignificant features
            // - Focuses the algorithm on substantial edge alignments
            //
            // WHY TOLERANCE MATTERS (10% of curve tolerance):
            // - Edges must be nearly collinear to merge (not just close)
            // - Tighter tolerance = more precise alignment required = fewer false positives
            // - 10% provides a balance between detecting real alignments and avoiding errors
            //
            // IMPACT ON PLACEMENT:
            // - Positions with good edge alignments get better (lower) fitness scores
            // - Algorithm naturally gravitates toward rectangular/grid-like arrangements
            // - This bonus can override other placement preferences when merging is significant
            // ============================================================================

            // Shift the part to its candidate position and check for mergeable edges
            var shiftedpart = shiftPolygon(part, shiftvector);
            var shiftedplaced = [];

            for (let m = 0; m < placed.length; m++) {
              shiftedplaced.push(shiftPolygon(placed[m], placements[m]));
            }

            // don't check small lines, cut off at about 1/2 in
            // Minimum line length of 0.5 inches (0.5 * scale) filters out insignificant edge alignments
            // This prevents over-optimization on tiny features that don't meaningfully reduce cut time
            var minlength = 0.5 * config.scale;
            // Tolerance of 10% (0.1x) of curveTolerance determines how closely lines must align to be considered merged
            // Tighter tolerance = more precise alignment required, looser = more merges but less accurate
            var merged = mergedLength(
              shiftedplaced,
              shiftedpart,
              minlength,
              0.1 * config.curveTolerance,
            );
            // Subtract savings from fitness (lower fitness is better, so subtraction is a bonus)
            area -= merged.totalLength * config.timeRatio;
          }

          // Check for better placement
          if (
            minarea === null ||
            (config.placementType == "gravity" &&
              (rectbounds.width < minwidth ||
                (GeometryUtil.almostEqual(rectbounds.width, minwidth) &&
                  area < minarea))) ||
            (config.placementType != "gravity" && area < minarea) ||
            (GeometryUtil.almostEqual(minarea, area) && shiftvector.x < minx)
          ) {
            // ============================================================================
            // OVERLAP CHECKING - CRITICAL VALIDATION STEP
            // ============================================================================
            // Even though we calculate valid placement positions using NFP subtraction,
            // we must still perform explicit overlap checking. Here's why:
            //
            // WHY OVERLAP CHECKING IS NECESSARY:
            //
            // 1. FLOATING POINT PRECISION ERRORS
            //    - NFP calculations involve complex geometric operations (Minkowski sums,
            //      polygon unions, differences) that accumulate floating point errors
            //    - Small numerical errors can cause NFP boundaries to be slightly inaccurate
            //    - A position that appears valid in the NFP might actually cause overlap
            //
            // 2. CLIPPER LIBRARY SCALING ARTIFACTS
            //    - We scale coordinates by 10^7 for integer precision, then scale back
            //    - This scaling/unscaling process can introduce rounding discrepancies
            //    - Positions on or very near the NFP boundary are particularly susceptible
            //
            // 3. MULTIPLE NFP INTERSECTION COMPLEXITY
            //    - When placing part N, we union NFPs from parts 1..N-1 together
            //    - The union operation can create tiny gaps or overlaps at intersection points
            //    - These artifacts might suggest positions are valid when they aren't
            //
            // 4. HOLE PLACEMENT SPECIAL CASES
            //    - Parts placed in holes require additional validation
            //    - Must verify part is fully contained within hole AND doesn't overlap other parts
            //    - NFP alone doesn't capture the "fully contained" constraint
            //
            // HOW OVERLAP CHECKING WORKS:
            // - Convert candidate position to absolute coordinates (shift part)
            // - Use Clipper intersection operation on actual part geometries
            // - If intersection result is non-empty, parts overlap (invalid position)
            // - This is a definitive geometric test that catches any NFP calculation errors
            //
            // PERFORMANCE CONSIDERATION:
            // While overlap checking adds computational cost, it's essential for correctness.
            // The cost is acceptable because:
            // - We only check promising positions (those with good fitness scores)
            // - Clipper intersection is highly optimized
            // - Catching overlaps here prevents invalid nesting results
            // ============================================================================

            var isOverlapping = false;
            // Create a shifted version of the part to test
            var testShifted = shiftPolygon(part, shiftvector);
            // Convert to clipper format for intersection test
            var clipperPart = toClipperCoordinates(testShifted);
            ClipperLib.JS.ScaleUpPath(clipperPart, config.clipperScale);

            // Check against all placed parts for potential overlap
            for (let m = 0; m < placed.length; m++) {
              // Convert the placed part to clipper format
              var clipperPlaced = toClipperCoordinates(
                shiftPolygon(placed[m], placements[m]),
              );
              ClipperLib.JS.ScaleUpPath(clipperPlaced, config.clipperScale);

              // Perform geometric intersection test
              // This definitively determines if the two polygons overlap
              var clipSolution = new ClipperLib.Paths();
              var clipper = new ClipperLib.Clipper();
              clipper.AddPath(clipperPart, ClipperLib.PolyType.ptSubject, true);
              clipper.AddPath(clipperPlaced, ClipperLib.PolyType.ptClip, true);

              // Execute the intersection operation
              // If intersection exists (clipSolution not empty), parts overlap
              if (
                clipper.Execute(
                  ClipperLib.ClipType.ctIntersection,
                  clipSolution,
                  ClipperLib.PolyFillType.pftNonZero,
                  ClipperLib.PolyFillType.pftNonZero,
                )
              ) {
                // If there's any overlap (intersection result not empty), reject this position
                if (clipSolution.length > 0) {
                  isOverlapping = true;
                  break;
                }
              }
            }
            // Only accept this position if there's no overlap
            if (!isOverlapping) {
              minarea = area;
              if (
                config.placementType == "gravity" ||
                config.placementType == "box"
              ) {
                minwidth = rectbounds.width;
              }
              position = shiftvector;
              minx = shiftvector.x;
              miny = shiftvector.y;
              if (config.mergeLines) {
                position.mergedLength = merged.totalLength;
                position.mergedSegments = merged.segments;
              }
            }
          }
        }
      }

      // Now process potential hole positions using the same placement strategies
      try {
        if (holePositions && holePositions.length > 0) {
          // Count how many parts are already in each hole to encourage distribution
          const holeUtilization = new Map(); // Map of "parentIndex_holeIndex" -> count
          const holeAreaUtilization = new Map(); // Map of "parentIndex_holeIndex" -> used area percentage

          // Track which holes are being used
          for (let m = 0; m < placements.length; m++) {
            if (placements[m].inHole) {
              const holeKey = `${placements[m].parentIndex}_${placements[m].holeIndex}`;
              holeUtilization.set(
                holeKey,
                (holeUtilization.get(holeKey) || 0) + 1,
              );

              // Calculate area used in each hole
              if (placed[m]) {
                const partArea = Math.abs(GeometryUtil.polygonArea(placed[m]));
                holeAreaUtilization.set(
                  holeKey,
                  (holeAreaUtilization.get(holeKey) || 0) + partArea,
                );
              }
            }
          }

          // Sort hole positions to prioritize:
          // 1. Unused holes first (to ensure we use all holes)
          // 2. Then holes with fewer parts
          // 3. Then orientation-matched placements
          holePositions.sort((a, b) => {
            const aKey = `${a.parentIndex}_${a.holeIndex}`;
            const bKey = `${b.parentIndex}_${b.holeIndex}`;

            const aCount = holeUtilization.get(aKey) || 0;
            const bCount = holeUtilization.get(bKey) || 0;

            // First priority: unused holes get top priority
            if (aCount === 0 && bCount > 0) return -1;
            if (bCount === 0 && aCount > 0) return 1;

            // Second priority: holes with fewer parts
            if (aCount < bCount) return -1;
            if (bCount < aCount) return 1;

            // Third priority: orientation match
            if (a.orientationMatched && !b.orientationMatched) return -1;
            if (!a.orientationMatched && b.orientationMatched) return 1;

            // Fourth priority: better hole fit (higher fill ratio)
            if (a.fillRatio && b.fillRatio) {
              if (a.fillRatio > b.fillRatio) return -1;
              if (b.fillRatio > a.fillRatio) return 1;
            }

            return 0;
          });

          // console.log(`Sorted hole positions. Prioritizing distribution across ${holeUtilization.size} used holes out of ${new Set(holePositions.map(h => `${h.parentIndex}_${h.holeIndex}`)).size} total holes`);

          for (let j = 0; j < holePositions.length; j++) {
            let holeShift = holePositions[j];

            // For debugging the hole's orientation
            const holeKey = `${holeShift.parentIndex}_${holeShift.holeIndex}`;
            const partsInThisHole = holeUtilization.get(holeKey) || 0;

            if (
              config.placementType == "gravity" ||
              config.placementType == "box"
            ) {
              var rectbounds = GeometryUtil.getPolygonBounds([
                // allbounds points
                { x: allbounds.x, y: allbounds.y },
                { x: allbounds.x + allbounds.width, y: allbounds.y },
                {
                  x: allbounds.x + allbounds.width,
                  y: allbounds.y + allbounds.height,
                },
                { x: allbounds.x, y: allbounds.y + allbounds.height },
                // part points
                {
                  x: partbounds.x + holeShift.x,
                  y: partbounds.y + holeShift.y,
                },
                {
                  x: partbounds.x + partbounds.width + holeShift.x,
                  y: partbounds.y + holeShift.y,
                },
                {
                  x: partbounds.x + partbounds.width + holeShift.x,
                  y: partbounds.y + partbounds.height + holeShift.y,
                },
                {
                  x: partbounds.x + holeShift.x,
                  y: partbounds.y + partbounds.height + holeShift.y,
                },
              ]);

              // weigh width more, to help compress in direction of gravity
              if (config.placementType == "gravity") {
                area = rectbounds.width * 5 + rectbounds.height;
              } else {
                area = rectbounds.width * rectbounds.height;
              }

              // Apply small bonus for orientation match, but no significant scaling factor
              // Multiplier of 0.99 gives 1% fitness improvement for matching hole/part orientation (wide-to-wide, tall-to-tall)
              // Small bonus ensures orientation is a tiebreaker rather than dominant factor in placement decisions
              if (holeShift.orientationMatched) {
                area *= 0.99;
              }

              // ============================================================================
              // FITNESS BONUS: UNUSED HOLE PRIORITY
              // ============================================================================
              // Apply a small fitness bonus (1% improvement) when placing a part in an
              // empty hole that hasn't been used yet. This encourages distributing parts
              // across multiple holes rather than overfilling some while leaving others empty.
              //
              // WHY THIS BONUS EXISTS:
              // - Ensures all available holes are utilized (maximizes space efficiency)
              // - Prevents the algorithm from packing too many parts into one hole
              // - Distributes parts evenly for better balance and material utilization
              //
              // HOW IT WORKS:
              // - Multiplier of 0.99 reduces fitness by 1% (lower is better)
              // - Only applied to holes with zero parts already placed (partsInThisHole === 0)
              // - Acts as a tiebreaker when comparing holes with similar fitness scores
              //
              // EXAMPLE:
              // - Hole A (empty): area = 1000, bonus applied → fitness = 1000 × 0.99 = 990
              // - Hole B (has 2 parts): area = 1000, no bonus → fitness = 1000
              // - Algorithm prefers Hole A, ensuring even distribution across holes
              //
              // IMPACT:
              // - Small enough not to override other placement criteria (orientation, fill ratio)
              // - Large enough to break ties and encourage hole distribution
              // - Results in more balanced material usage across the sheet
              // ============================================================================
              if (partsInThisHole === 0) {
                area *= 0.99;
                // console.log(`Small priority bonus for unused hole ${holeKey}`);
              }
            } else if (config.placementType == "convexhull") {
              // For hole placements with convex hull, use the actual area without arbitrary factor
              area = Math.abs(GeometryUtil.polygonArea(hull || []));
              holeShift.hull = hull;

              // Apply tiny orientation matching bonus
              // 1% improvement (0.99x multiplier) for matching orientations in convex hull mode
              // Consistent with gravity/box mode to maintain similar placement behavior across algorithms
              if (holeShift.orientationMatched) {
                area *= 0.99;
              }
            }

            if (config.mergeLines) {
              // if lines can be merged, subtract savings from area calculation
              var shiftedpart = shiftPolygon(part, holeShift);
              var shiftedplaced = [];

              for (let m = 0; m < placed.length; m++) {
                shiftedplaced.push(shiftPolygon(placed[m], placements[m]));
              }

              // don't check small lines, cut off at about 1/2 in
              var minlength = 0.5 * config.scale;
              var merged = mergedLength(
                shiftedplaced,
                shiftedpart,
                minlength,
                0.1 * config.curveTolerance,
              );
              area -= merged.totalLength * config.timeRatio;
            }

            // Check if this hole position is better than our current best position
            if (
              minarea === null ||
              (config.placementType == "gravity" && area < minarea) ||
              (config.placementType != "gravity" && area < minarea) ||
              (GeometryUtil.almostEqual(minarea, area) && holeShift.inHole)
            ) {
              // For hole positions, we need to verify it's entirely within the parent's hole
              // This is a special case where overlap is allowed, but only inside a hole
              var isValidHolePlacement = true;
              var intersectionArea = 0;
              try {
                // Get the parent part and its specific hole where we're trying to place the current part
                var parentPart = placed[holeShift.parentIndex];
                var hole = parentPart.children[holeShift.holeIndex];
                // Shift the hole based on parent's placement
                var shiftedHole = shiftPolygon(
                  hole,
                  placements[holeShift.parentIndex],
                );
                // Create a shifted version of the current part based on proposed position
                var shiftedPart = shiftPolygon(part, holeShift);

                // Check if the part is contained within this hole using a different approach
                // We'll do this by reversing the hole (making it a polygon) and checking if
                // the part is fully inside it
                var reversedHole = [];
                for (let h = shiftedHole.length - 1; h >= 0; h--) {
                  reversedHole.push(shiftedHole[h]);
                }

                // Convert both to clipper format
                var clipperHole = toClipperCoordinates(reversedHole);
                var clipperPart = toClipperCoordinates(shiftedPart);
                ClipperLib.JS.ScaleUpPath(clipperHole, config.clipperScale);
                ClipperLib.JS.ScaleUpPath(clipperPart, config.clipperScale);

                // Use INTERSECTION instead of DIFFERENCE
                // If part is entirely contained in hole, intersection should equal the part
                var clipSolution = new ClipperLib.Paths();
                var clipper = new ClipperLib.Clipper();
                clipper.AddPath(
                  clipperPart,
                  ClipperLib.PolyType.ptSubject,
                  true,
                );
                clipper.AddPath(clipperHole, ClipperLib.PolyType.ptClip, true);

                if (
                  clipper.Execute(
                    ClipperLib.ClipType.ctIntersection,
                    clipSolution,
                    ClipperLib.PolyFillType.pftEvenOdd,
                    ClipperLib.PolyFillType.pftEvenOdd,
                  )
                ) {
                  // If the intersection has different area than the part itself
                  // then the part is not fully contained in the hole
                  var intersectionArea = 0;
                  for (let p = 0; p < clipSolution.length; p++) {
                    intersectionArea += Math.abs(
                      ClipperLib.Clipper.Area(clipSolution[p]),
                    );
                  }

                  var partArea = Math.abs(ClipperLib.Clipper.Area(clipperPart));
                  // 1% tolerance (0.01x part area) allows for small floating point errors in intersection calculation
                  // If intersection area differs from part area by more than 1%, part is not fully contained in hole
                  if (Math.abs(intersectionArea - partArea) > partArea * 0.01) {
                    isValidHolePlacement = false;
                    // console.log(`Part not fully contained in hole: ${part.source}`);
                  }
                } else {
                  isValidHolePlacement = false;
                }

                // Also check if this part overlaps with any other placed parts
                // (it should only overlap with its parent's hole)
                if (isValidHolePlacement) {
                  // Bonus: Check if this part is placed on another part's contour within the same hole
                  // This incentivizes the algorithm to place parts efficiently inside holes
                  let contourScore = 0;
                  // Find other parts already placed in this hole
                  for (let m = 0; m < placed.length; m++) {
                    if (
                      placements[m].inHole &&
                      placements[m].parentIndex === holeShift.parentIndex &&
                      placements[m].holeIndex === holeShift.holeIndex
                    ) {
                      // Found another part in the same hole, check proximity/contour usage
                      const p2 = placements[m];

                      // Calculate Manhattan distance between parts
                      const dx = Math.abs(holeShift.x - p2.x);
                      const dy = Math.abs(holeShift.y - p2.y);

                      // If parts are close to each other (touching or nearly touching)
                      // Proximity threshold of 2.0 user units determines when parts are considered adjacent
                      // This value is chosen to detect parts sharing edges/contours while allowing small gaps from NFP precision
                      const proximityThreshold = 2.0;
                      if (dx < proximityThreshold || dy < proximityThreshold) {
                        // This placement uses contour of another part - give it a bonus
                        // Score of 5.0 incentivizes placing parts adjacent to each other within holes
                        // Higher values encourage tighter packing, lower values allow more spread
                        contourScore += 5.0;
                        // console.log(`Found contour alignment in hole between ${part.source} and ${placed[m].source}`);
                      }
                    }
                  }

                  // Treat holes exactly like mini-sheets for better space utilization
                  // This approach will ensure efficient hole packing like we do with sheets
                  if (isValidHolePlacement) {
                    // Prioritize placing larger parts in holes first
                    // Apply a stronger bias for larger parts relative to hole size
                    const holeArea = Math.abs(
                      GeometryUtil.polygonArea(shiftedHole),
                    );
                    const partArea = Math.abs(
                      GeometryUtil.polygonArea(shiftedPart),
                    );

                    // Calculate how much of the hole this part fills (0-1)
                    const fillRatio = partArea / holeArea;

                    // // Apply stronger benefit for parts that utilize more of the hole space
                    // // but ensure we don't overly bias very large parts
                    // if (fillRatio > 0.6) {
                    // 	// Very large parts (60%+ of hole) get maximum benefit
                    // 	area *= 0.4; // 60% reduction
                    // 	// console.log(`Large part ${part.source} fills ${Math.round(fillRatio*100)}% of hole - applying maximum packing bonus`);
                    // } else if (fillRatio > 0.3) {
                    // 	// Medium parts (30-60% of hole) get significant benefit
                    // 	area *= 0.5; // 50% reduction
                    // 	// console.log(`Medium part ${part.source} fills ${Math.round(fillRatio*100)}% of hole - applying major packing bonus`);
                    // } else if (fillRatio > 0.1) {
                    // 	// Smaller parts (10-30% of hole) get moderate benefit
                    // 	area *= 0.6; // 40% reduction
                    // 	// console.log(`Small part ${part.source} fills ${Math.round(fillRatio*100)}% of hole - applying standard packing bonus`);
                    // }
                    // Now apply standard sheet-like placement optimization for parts already in the hole
                    const partsInSameHole = [];
                    for (let m = 0; m < placed.length; m++) {
                      if (
                        placements[m].inHole &&
                        placements[m].parentIndex === holeShift.parentIndex &&
                        placements[m].holeIndex === holeShift.holeIndex
                      ) {
                        partsInSameHole.push({
                          part: placed[m],
                          placement: placements[m],
                        });
                      }
                    }

                    // Apply the same edge alignment logic we use for sheet placement
                    if (partsInSameHole.length > 0) {
                      const shiftedPart = shiftPolygon(part, holeShift);
                      const bbox1 = GeometryUtil.getPolygonBounds(shiftedPart);

                      // Track best alignment metrics to prioritize clean edge alignments
                      let bestAlignment = 0;
                      let alignmentCount = 0;

                      // Examine each part already placed in this hole
                      for (let m = 0; m < partsInSameHole.length; m++) {
                        const otherPart = shiftPolygon(
                          partsInSameHole[m].part,
                          partsInSameHole[m].placement,
                        );
                        const bbox2 = GeometryUtil.getPolygonBounds(otherPart);

                        // Edge alignment detection with tighter threshold for precision
                        // Threshold of 2.0 units defines maximum distance between edges to consider them aligned
                        // Balances between detecting true alignments vs. false positives from floating point errors
                        const edgeThreshold = 2.0;

                        // Check all four edge alignments
                        const leftAligned =
                          Math.abs(bbox1.x - (bbox2.x + bbox2.width)) <
                          edgeThreshold;
                        const rightAligned =
                          Math.abs(bbox1.x + bbox1.width - bbox2.x) <
                          edgeThreshold;
                        const topAligned =
                          Math.abs(bbox1.y - (bbox2.y + bbox2.height)) <
                          edgeThreshold;
                        const bottomAligned =
                          Math.abs(bbox1.y + bbox1.height - bbox2.y) <
                          edgeThreshold;

                        if (
                          leftAligned ||
                          rightAligned ||
                          topAligned ||
                          bottomAligned
                        ) {
                          // Score based on alignment length (better packing)
                          let alignmentLength = 0;

                          if (leftAligned || rightAligned) {
                            // Calculate vertical overlap
                            const overlapStart = Math.max(bbox1.y, bbox2.y);
                            const overlapEnd = Math.min(
                              bbox1.y + bbox1.height,
                              bbox2.y + bbox2.height,
                            );
                            alignmentLength = Math.max(
                              0,
                              overlapEnd - overlapStart,
                            );
                          } else {
                            // Calculate horizontal overlap
                            const overlapStart = Math.max(bbox1.x, bbox2.x);
                            const overlapEnd = Math.min(
                              bbox1.x + bbox1.width,
                              bbox2.x + bbox2.width,
                            );
                            alignmentLength = Math.max(
                              0,
                              overlapEnd - overlapStart,
                            );
                          }

                          if (alignmentLength > bestAlignment) {
                            bestAlignment = alignmentLength;
                          }
                          alignmentCount++;
                        }
                      }
                      // ============================================================================
                      // FITNESS BONUS: EDGE ALIGNMENT WITHIN HOLES
                      // ============================================================================
                      // When parts inside a hole align their edges with other parts in the same hole,
                      // they create cleaner, more efficient layouts. This bonus rewards such alignments.
                      //
                      // WHY EDGE ALIGNMENT MATTERS:
                      // - Aligned edges create rectangular/grid-like patterns within holes
                      // - Reduces wasted space between parts (tighter packing)
                      // - Can enable edge merging for faster cutting (if mergeLines is enabled)
                      // - Makes visual inspection and quality control easier
                      //
                      // HOW THE BONUS IS CALCULATED:
                      // - Base multiplier: 0.9 (10% improvement for any alignment)
                      // - Subtract alignment_length / 100 (longer alignments get bigger bonuses)
                      // - Subtract 5% per additional alignment (multiple alignments are better)
                      // - Minimum multiplier: 0.7 (capped at 30% fitness improvement)
                      //
                      // FORMULA:
                      //   qualityMultiplier = max(0.7, 0.9 - alignment_length/100 - count×0.05)
                      //   fitness = base_fitness × qualityMultiplier
                      //
                      // EXAMPLE:
                      // - Base fitness for hole position: 1000
                      // - Best alignment length: 50 units
                      // - Number of alignments: 2
                      // - Multiplier = max(0.7, 0.9 - 50/100 - 2×0.05) = max(0.7, 0.9 - 0.5 - 0.1) = 0.3 → capped at 0.7
                      // - Final fitness = 1000 × 0.7 = 700 (30% improvement)
                      //
                      // WHY CAP AT 0.7 (30% MAX IMPROVEMENT):
                      // - Prevents edge alignment from completely dominating placement decisions
                      // - Ensures other factors (hole containment, fill ratio) remain important
                      // - Balances the competing goals of alignment vs. compactness
                      //
                      // IMPACT:
                      // - Parts naturally form rectangular patterns within holes
                      // - Mimics efficient sheet-level packing strategies at the hole level
                      // - Creates "nested nesting" - organized arrangements inside cutout spaces
                      // ============================================================================
                      if (bestAlignment > 0) {
                        // Calculate a multiplier based on alignment quality ranging from 0.7 (best) to 0.9 (minimal)
                        // Better alignments get lower multipliers (better fitness scores)
                        // Base of 0.9 reduced by alignment length/100 and 5% (0.05) per additional alignment
                        // Capped at 0.7 minimum (30% fitness improvement) to prevent excessive weight
                        const qualityMultiplier = Math.max(
                          0.7,
                          0.9 - bestAlignment / 100 - alignmentCount * 0.05,
                        );
                        area *= qualityMultiplier;
                        // console.log(`Applied sheet-like alignment strategy in hole with quality ${(1-qualityMultiplier)*100}%`);
                      }
                    }
                  }

                  // Normal overlap check with other parts (excluding the parent)
                  for (let m = 0; m < placed.length; m++) {
                    // Skip check against parent part, as we've already verified hole containment
                    if (m === holeShift.parentIndex) continue;

                    var clipperPlaced = toClipperCoordinates(
                      shiftPolygon(placed[m], placements[m]),
                    );
                    ClipperLib.JS.ScaleUpPath(
                      clipperPlaced,
                      config.clipperScale,
                    );

                    clipSolution = new ClipperLib.Paths();
                    clipper = new ClipperLib.Clipper();
                    clipper.AddPath(
                      clipperPart,
                      ClipperLib.PolyType.ptSubject,
                      true,
                    );
                    clipper.AddPath(
                      clipperPlaced,
                      ClipperLib.PolyType.ptClip,
                      true,
                    );

                    if (
                      clipper.Execute(
                        ClipperLib.ClipType.ctIntersection,
                        clipSolution,
                        ClipperLib.PolyFillType.pftNonZero,
                        ClipperLib.PolyFillType.pftNonZero,
                      )
                    ) {
                      if (clipSolution.length > 0) {
                        isValidHolePlacement = false;
                        // console.log(`Part overlaps with other part: ${part.source} with ${placed[m].source}`);
                        break;
                      }
                    }
                  }
                }
                if (isValidHolePlacement) {
                  // console.log(`Valid hole placement found for part ${part.source} in hole of ${parentPart.source}`);
                }
              } catch (e) {
                // console.log('Error in hole containment check:', e);
                isValidHolePlacement = false;
              }

              // Only accept this position if placement is valid
              if (isValidHolePlacement) {
                minarea = area;
                if (
                  config.placementType == "gravity" ||
                  config.placementType == "box"
                ) {
                  minwidth = rectbounds.width;
                }
                position = holeShift;
                minx = holeShift.x;
                miny = holeShift.y;

                if (config.mergeLines) {
                  position.mergedLength = merged.totalLength;
                  position.mergedSegments = merged.segments;
                }
              }
            }
          }
        }
      } catch (e) {
        // console.log('Error processing hole positions:', e);
      }

      // Continue with best non-hole position if available
      if (position) {
        // Debug placement with less verbose logging
        if (position.inHole) {
          // console.log(`Placed part ${position.source} in hole of part ${placed[position.parentIndex].source}`);
          // Adjust the part placement specifically for hole placement
          // This prevents the part from being considered as overlapping with its parent
          var parentPart = placed[position.parentIndex];
          // console.log(`Hole placement - Parent: ${parentPart.source}, Child: ${part.source}`);

          // Mark the relationship to prevent overlap checks between them in future placements
          position.parentId = parentPart.id;
        }
        placed.push(part);
        placements.push(position);
        if (position.mergedLength) {
          totalMerged += position.mergedLength;
        }
      } else {
        // Just log part source without additional details
        // console.log(`No placement for part ${part.source}`);
      }

      // send placement progress signal
      var placednum = placed.length;
      for (let j = 0; j < allplacements.length; j++) {
        placednum += allplacements[j].sheetplacements.length;
      }
      //console.log(placednum, totalnum);
      // Progress calculation: 0.5 base (NFP phase complete) + 0.5 scaled by placement completion
      // Ensures progress bar smoothly transitions from 50% (after NFP) to 100% (all parts placed)
      ipcRenderer.send("background-progress", {
        index: nestindex,
        progress: 0.5 + 0.5 * (placednum / totalnum),
      });
      // console.timeEnd('placement');
    }

    // ============================================================================
    // FITNESS ACCUMULATION: PER-SHEET PLACEMENT QUALITY
    // ============================================================================
    // After placing all parts that fit on this sheet, we add the placement quality
    // metrics to the overall fitness. This rewards efficient use of sheet space.
    //
    // WHAT IS BEING ADDED:
    // 1. (minwidth / sheetarea): Normalized width metric for gravity mode
    //    - minwidth is the final bounding box width achieved
    //    - Dividing by sheet area normalizes across different sheet sizes
    //    - Lower ratio = tighter packing = better fitness
    //
    // 2. minarea: The best (lowest) area/fitness found during placement
    //    - For gravity mode: this is the weighted width + height
    //    - For box mode: this is the bounding box area
    //    - For convexhull mode: this is the convex hull area
    //
    // WHY THIS MATTERS:
    // - Rewards solutions that pack parts tightly on each sheet
    // - Normalizing by sheet area allows fair comparison across different sheet sizes
    // - Adding minarea ensures the placement strategy (gravity/box/hull) is respected
    //
    // EXAMPLE (Gravity mode):
    // - Sheet area: 1,000,000 square units
    // - Final bounding box: width=800, height=600
    // - minwidth = 800, minarea = (800×5 + 600) = 4,600
    // - Fitness added: (800 / 1,000,000) + 4,600 = 0.0008 + 4,600 ≈ 4,600
    //
    // The normalized width component (0.0008) is tiny compared to minarea, but it
    // provides a tiebreaker when comparing solutions with similar minarea values.
    // ============================================================================
    fitness += minwidth / sheetarea + minarea;

    for (let i = 0; i < placed.length; i++) {
      var index = parts.indexOf(placed[i]);
      if (index >= 0) {
        parts.splice(index, 1);
      }
    }

    if (placements && placements.length > 0) {
      allplacements.push({
        sheet: sheet.source,
        sheetid: sheet.id,
        sheetplacements: placements,
      });
    } else {
      break; // something went wrong
    }

    if (sheets.length == 0) {
      break;
    }
  }

  // there were parts that couldn't be placed
  // scale this value high - we really want to get all the parts in, even at the cost of opening new sheets
  console.log("UNPLACED PARTS", parts.length, "of", totalnum);
  for (let i = 0; i < parts.length; i++) {
    // console.log(`Fitness before unplaced penalty: ${fitness}`);
    // Massive penalty multiplier of 100,000,000 ensures unplaced parts severely degrade fitness
    // This strongly incentivizes the genetic algorithm to find solutions where all parts fit
    // Penalty scaled by part area relative to sheet area to penalize wasted material proportionally
    const penalty =
      100000000 *
      ((Math.abs(GeometryUtil.polygonArea(parts[i])) * 100) / totalsheetarea);
    // console.log(`Penalty for unplaced part ${parts[i].source}: ${penalty}`);
    fitness += penalty;
    // console.log(`Fitness after unplaced penalty: ${fitness}`);
  }

  // ============================================================================
  // FITNESS BONUS: HOLE PLACEMENT REWARDS
  // ============================================================================
  // Parts placed inside holes (cutout areas within other parts) receive fitness
  // bonuses because they utilize otherwise wasted space. This two-pass system
  // rewards both hole usage and efficient packing within holes.
  //
  // WHY HOLE PLACEMENT IS VALUABLE:
  // - Holes represent empty space that would otherwise be discarded
  // - Placing parts in holes uses material that's already "paid for"
  // - Reduces the number of sheets needed by filling negative space
  // - Can significantly improve overall material utilization
  //
  // TWO-TIER BONUS STRUCTURE:
  //
  // TIER 1 - BASE HOLE PLACEMENT BONUS:
  //   Formula: -1 × (part_area / total_sheet_area / 100)
  //   - Negative value reduces fitness (improvement)
  //   - Proportional to part area (larger parts = bigger bonus)
  //   - Normalized by total sheet area for fair comparison
  //   - Division by 100 scales bonus to ~1% of area ratio
  //   - Example: 100 sq.unit part in 100,000 sq.unit total area
  //     Bonus = -(100 / 100,000 / 100) = -0.00001
  //
  // TIER 2 - ADJACENT PART BONUS (within same hole):
  //   Formula: -1 × (part_area / total_sheet_area) × 0.01
  //   - Applied when parts are adjacent (within 2.0 units) in the same hole
  //   - Encourages tight packing and contour-based placement within holes
  //   - Additional 1% bonus on top of base hole bonus
  //   - Incentivizes "nested nesting" - parts arranged efficiently inside holes
  //
  // HOW THIS AFFECTS OPTIMIZATION:
  // - Solutions that place parts in holes get lower (better) fitness
  // - Multiple parts in the same hole get even better fitness if they're adjacent
  // - Algorithm learns to prioritize hole placement opportunities
  // - Balances between hole placement and regular sheet placement based on fitness
  //
  // EXAMPLE SCENARIO:
  // - Total sheet area: 1,000,000 square units
  // - Part A (area 1,000) placed in hole: fitness -= 0.00001 (base bonus)
  // - Part B (area 1,000) placed adjacent to Part A in same hole:
  //   fitness -= 0.00001 (base) + 0.0002 (adjacent) = 0.00021 total bonus
  // - Over many parts, these small bonuses accumulate to favor hole-utilizing solutions
  // ============================================================================

  // Enhance fitness calculation to encourage more efficient hole usage
  // This rewards more efficient use of material by placing parts in holes
  for (let i = 0; i < allplacements.length; i++) {
    const placements = allplacements[i].sheetplacements;
    // First pass: identify all parts placed in holes and award base bonus
    const partsInHoles = [];
    for (let j = 0; j < placements.length; j++) {
      if (placements[j].inHole === true) {
        // Find the corresponding part to calculate its area
        const partIndex = j;
        if (partIndex >= 0) {
          // Add this part to our tracked list of parts in holes
          partsInHoles.push({
            index: j,
            parentIndex: placements[j].parentIndex,
            holeIndex: placements[j].holeIndex,
            area: Math.abs(GeometryUtil.polygonArea(placed[partIndex])) * 2,
          });
          // Base reward for any part placed in a hole (TIER 1 BONUS)
          // Subtracting from fitness improves the score (lower is better)
          // console.log(`Part ${placed[partIndex].source} placed in hole of part ${placed[placements[j].parentIndex].source}`);
          // console.log(`Part area: ${Math.abs(GeometryUtil.polygonArea(placed[partIndex]))}, Hole area: ${Math.abs(GeometryUtil.polygonArea(placed[placements[j].parentIndex]))}`);
          fitness -=
            Math.abs(GeometryUtil.polygonArea(placed[partIndex])) /
            totalsheetarea /
            100;
        }
      }
    }
    // Second pass: apply additional fitness rewards for parts placed on contours of other parts within holes
    // This incentivizes the algorithm to stack parts efficiently within holes (TIER 2 BONUS)
    for (let j = 0; j < partsInHoles.length; j++) {
      const part = partsInHoles[j];
      for (let k = 0; k < partsInHoles.length; k++) {
        if (
          j !== k &&
          part.parentIndex === partsInHoles[k].parentIndex &&
          part.holeIndex === partsInHoles[k].holeIndex
        ) {
          // Calculate distances between parts to see if they're using each other's contours
          const p1 = placements[part.index];
          const p2 = placements[partsInHoles[k].index];

          // Calculate Manhattan distance between parts (simple proximity check)
          const dx = Math.abs(p1.x - p2.x);
          const dy = Math.abs(p1.y - p2.y);

          // If parts are close to each other (touching or nearly touching)
          // Proximity threshold of 2.0 user units determines when parts are adjacent within a hole
          // Same value as used during placement ensures consistency in detection
          const proximityThreshold = 2.0;
          if (dx < proximityThreshold || dy < proximityThreshold) {
            // Award extra fitness for parts efficiently placed near each other in the same hole
            // Fitness bonus of 1% (0.01x) of part-to-sheet area ratio encourages contour-based packing
            // This rewards configurations where parts nest tightly within holes
            fitness -= (part.area / totalsheetarea) * 0.01;
          }
        }
      }
    }
  }

  // send finish progress signal
  ipcRenderer.send("background-progress", { index: nestindex, progress: -1 });

  console.log("WATCH", allplacements);

  const utilisation = totalsheetarea > 0 ? (area / totalsheetarea) * 100 : 0;
  console.log(`Utilisation of the sheet(s): ${utilisation.toFixed(2)}%`);

  return {
    placements: allplacements,
    fitness: fitness,
    area: sheetarea,
    totalarea: totalsheetarea,
    mergedLength: totalMerged,
    utilisation: utilisation,
  };
}
