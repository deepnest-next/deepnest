/*!
 * Deepnest - Core Nesting Algorithm Module
 * Licensed under GPLv3
 *
 * @fileoverview
 * This module implements the core nesting algorithm for optimizing the placement
 * of 2D shapes (parts) onto sheets (bins) for CNC cutting, laser cutting, or plotting.
 *
 * ## Overview for Junior Developers
 *
 * **What is "Nesting"?**
 * Nesting is the process of arranging irregular 2D shapes on a sheet of material
 * to minimize waste. Think of it like a puzzle where you're trying to fit as many
 * pieces as possible onto a limited space.
 *
 * **Key Concepts:**
 * - **Part**: A 2D shape to be cut (e.g., a letter, a gear outline)
 * - **Sheet/Bin**: The material surface where parts are placed
 * - **Polygon**: Mathematical representation of a part as a series of {x, y} points
 * - **NFP (No-Fit Polygon)**: A computed boundary showing where a part can't be placed
 *   relative to another part without overlapping
 *
 * **How This Module Works:**
 * 1. SVG files are imported and converted to polygon representations
 * 2. Parts are simplified and offset (to account for cutting tool width/spacing)
 * 3. A Genetic Algorithm optimizes the order and rotation of parts
 * 4. Background workers compute placements in parallel
 * 5. Results are stored as "nests" - successful arrangements of parts on sheets
 *
 * **Main Class:**
 * - `DeepNest`: Main orchestrator handling import, processing, and nesting workflow
 *
 * **Related Modules:**
 * - `GeneticAlgorithm`: Optimization engine that evolves better part arrangements (./GeneticAlgorithm.js)
 *
 * **External Dependencies:**
 * - ClipperLib: Polygon boolean operations (union, offset, intersection)
 * - GeometryUtil: Helper functions for polygon math
 * - SvgParser: SVG to polygon conversion
 *
 * @module deepnest
 * @requires ../build/util/point.js
 * @requires ../build/util/HullPolygon.js
 * @requires ./GeneticAlgorithm.js
 * @requires @deepnest/svg-preprocessor
 */

import { Point } from "../build/util/point.js";
import { HullPolygon } from "../build/util/HullPolygon.js";
import { GeneticAlgorithm } from "./GeneticAlgorithm.js";

const { simplifyPolygon: simplifyPoly } = require("@deepnest/svg-preprocessor");

/**
 * Global configuration object for the nesting algorithm.
 * These values control how parts are processed, optimized, and placed.
 *
 * @typedef {Object} NestConfig
 * @property {number} clipperScale - Scale factor for ClipperLib integer math (10M = high precision)
 * @property {number} curveTolerance - Max deviation when converting curves to line segments (SVG units)
 * @property {number} spacing - Gap between parts after nesting (accounts for laser kerf/tool width)
 * @property {number} rotations - Number of rotation angles to try (4 = 0°, 90°, 180°, 270°)
 * @property {number} populationSize - Number of individuals in the genetic algorithm population
 * @property {number} mutationRate - Probability of mutation (1-50 range, higher = more variation)
 * @property {number} threads - Max parallel workers for NFP computation (capped at 8)
 * @property {string} placementType - Placement strategy: "gravity" (fall to bottom) or "box"
 * @property {boolean} mergeLines - Whether to merge overlapping cut lines for efficiency
 * @property {number} timeRatio - Balance between speed and quality (0-1)
 * @property {number} scale - Default SVG scale factor (72 = typical screen DPI)
 * @property {boolean} simplify - If true, use convex hull (faster but less accurate)
 * @property {number} overlapTolerance - Allowed overlap between parts (for floating point errors)
 */
var config = {
  clipperScale: 10000000, // ClipperLib uses integers; this gives ~7 decimal precision
  curveTolerance: 0.3, // How closely line segments must follow curves
  spacing: 0, // Part-to-part gap (set based on your cutting tool width)
  rotations: 4, // More rotations = better fit but slower computation
  populationSize: 10, // Larger population = more diversity but slower generations
  mutationRate: 10, // 10% chance of random changes per gene
  threads: 4, // Parallel workers (diminishing returns past 4-8)
  placementType: "gravity", // Parts "fall" to the bottom-left of the bin
  mergeLines: true, // Combine shared edges (saves cutting time)
  timeRatio: 0.5, // Balances exploration vs exploitation
  scale: 72, // Pixels per inch (standard screen resolution)
  simplify: false, // True = convex hull (fast); False = precise outline
  overlapTolerance: 0.0001, // Tiny overlap allowed for numerical stability
};

/**
 * Main nesting orchestrator class.
 *
 * DeepNest manages the entire nesting workflow:
 * 1. Import SVG files and extract parts
 * 2. Process polygons (simplify, offset for spacing)
 * 3. Run genetic algorithm to find optimal arrangements
 * 4. Coordinate background workers for parallel computation
 *
 * ## Lifecycle
 * ```
 * const nest = new DeepNest(eventEmitter);
 * nest.config({ spacing: 2, rotations: 8 });  // Configure
 * nest.importsvg('file.svg', ...);            // Load parts
 * nest.start(onProgress, onDisplay);          // Begin nesting
 * // ... wait for results in nest.nests array
 * nest.stop();                                // Halt computation
 * ```
 *
 * @class DeepNest
 */
export class DeepNest {
  /**
   * Creates a new DeepNest instance.
   *
   * @param {EventEmitter} eventEmitter - IPC event emitter for communicating with background workers.
   *   Must implement send() for outgoing messages and on() for incoming responses.
   *
   * @example
   * // In Electron main process
   * const nest = new DeepNest(ipcRenderer);
   */
  constructor(eventEmitter) {
    var svg = null;

    /**
     * Imported SVG files with their parsed DOM trees.
     * @type {Array<{filename: string, svg: SVGElement}>}
     */
    this.imports = [];

    /**
     * All extracted parts from imported SVGs.
     * Each part contains polygon data, metadata, and quantity.
     * @type {Array<{polygontree: Polygon, quantity: number, filename: string, sheet?: boolean, bounds: Object, area: number}>}
     */
    this.parts = [];

    /**
     * Temporary polygon tree used only during active nesting.
     * This is a processed copy of parts with offsets applied.
     * @type {Array<Polygon>}
     */
    this.partsTree = [];

    /**
     * Whether nesting is currently running.
     * @type {boolean}
     */
    this.working = false;

    /**
     * Active Genetic Algorithm instance (null when not nesting).
     * @type {GeneticAlgorithm|null}
     */
    this.GA = null;

    /**
     * Timer ID for the worker polling interval.
     * @type {number|null}
     */
    this.workerTimer = null;

    /**
     * Callback invoked when nesting progress updates.
     * @type {Function|null}
     */
    this.progressCallback = null;

    /**
     * Callback invoked when a new valid placement is found.
     * @type {Function|null}
     */
    this.displayCallback = null;

    /**
     * Successful nesting results, sorted by fitness (best first).
     * Each nest contains placement coordinates for all parts.
     * @type {Array<{fitness: number, placements: Array}>}
     */
    this.nests = [];

    /**
     * IPC event emitter for background worker communication.
     * @type {EventEmitter}
     */
    this.eventEmitter = eventEmitter;
  }

  /**
   * Imports an SVG file and extracts all nestable parts.
   *
   * ## Workflow
   * 1. Parse SVG string into DOM tree via SvgParser
   * 2. Clean up paths (handle DXF conversion artifacts if flagged)
   * 3. Extract closed polygons as separate parts
   * 4. Store both original SVG reference and processed parts
   *
   * @param {string} filename - File name for part ID; also parsed for quantity (e.g., "gear.5.svg" → qty=5)
   * @param {string} dirpath - Directory path for resolving relative image/href references
   * @param {string} svgstring - Raw SVG markup string to parse
   * @param {number} scalingFactor - Absolute scale multiplier (e.g., 25.4 for mm→inch conversion)
   * @param {boolean} dxfFlag - If true, applies DXF-specific path cleanup (unclosed paths, etc.)
   * @returns {Array<Part>} Extracted parts with polygontree, bounds, quantity, and SVG elements
   */
  importsvg(filename, dirpath, svgstring, scalingFactor, dxfFlag) {
    // Parse the SVG string into a DOM tree. config.scale is the default DPI (72),
    // but scalingFactor provides an absolute override (useful for unit conversion)
    var svg = window.SvgParser.load(
      dirpath,
      svgstring,
      config.scale,
      scalingFactor,
    );

    // Clean up parsed SVG: close near-closed paths, remove degenerate elements.
    // DXF-converted SVGs often have quirks that need special handling.
    svg = window.SvgParser.cleanInput(dxfFlag);

    // Store the import for reference (allows re-export, debugging)
    if (filename) {
      this.imports.push({
        filename: filename,
        svg: svg,
      });
    }

    var parts = this.getParts(svg.children, filename);
    for (var i = 0; i < parts.length; i++) {
      this.parts.push(parts[i]);
    }

    return parts;
  }

  /**
   * DEBUG: Renders a polygon as an SVG polyline for visual inspection.
   * Useful for debugging NFP calculations or polygon simplification.
   *
   * @param {Array<{x: number, y: number}>} poly - Polygon vertices to render
   * @param {SVGElement} svg - Target SVG element to append the polyline to
   * @param {string} [highlight] - CSS class name for styling (e.g., "error", "debug")
   * @private
   */
  renderPolygon(poly, svg, highlight) {
    if (!poly || poly.length == 0) {
      return;
    }
    var polyline = window.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polyline",
    );

    for (var i = 0; i < poly.length; i++) {
      var p = svg.createSVGPoint();
      p.x = poly[i].x;
      p.y = poly[i].y;
      polyline.points.appendItem(p);
    }
    if (highlight) {
      polyline.setAttribute("class", highlight);
    }
    svg.appendChild(polyline);
  }

  /**
   * DEBUG: Renders points as SVG circles for visual inspection.
   * Useful for debugging vertex positions or intersection points.
   *
   * @param {Array<{x: number, y: number}>} points - Points to render
   * @param {SVGElement} svg - Target SVG element to append circles to
   * @param {string} highlight - CSS class name for styling
   * @private
   */
  renderPoints(points, svg, highlight) {
    for (var i = 0; i < points.length; i++) {
      var circle = window.document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("r", "5");
      circle.setAttribute("cx", points[i].x);
      circle.setAttribute("cy", points[i].y);
      circle.setAttribute("class", highlight);

      svg.appendChild(circle);
    }
  }

  /**
   * Computes the convex hull of a polygon.
   *
   * The convex hull is the smallest convex shape that contains all points -
   * imagine stretching a rubber band around all vertices. Used when
   * config.simplify=true for faster (but less accurate) nesting.
   *
   * @param {Array<{x: number, y: number}>} polygon - Input polygon vertices
   * @returns {Array<{x: number, y: number}>|null} Convex hull vertices, or null if computation fails
   */
  getHull(polygon) {
    // Copy points to avoid mutating the original polygon
    var points = [];
    for (let i = 0; i < polygon.length; i++) {
      points.push({
        x: polygon[i].x,
        y: polygon[i].y,
      });
    }

    // Compute convex hull using Graham scan or similar algorithm
    var hullpoints = HullPolygon.hull(points);

    if (!hullpoints) {
      return null;
    }
    return hullpoints;
  }

  /**
   * Simplifies a polygon while preserving critical features for accurate nesting.
   *
   * ## Algorithm Overview (Ramer-Douglas-Peucker with selective offsetting)
   *
   * This is one of the most complex functions in the codebase. It balances:
   * - **Fewer vertices** = faster NFP computation
   * - **Shape accuracy** = parts still fit correctly after cutting
   *
   * ### Workflow:
   * 1. If config.simplify=true, just return convex hull (fast but loses concave details)
   * 2. Clean polygon (remove self-intersections, duplicate points)
   * 3. Apply RDP simplification (reduces vertices while keeping shape similar)
   * 4. Mark "important" long line segments that must be preserved exactly
   * 5. Offset the simplified polygon inward/outward
   * 6. Selectively un-offset vertices to ensure no exterior points exist
   * 7. Straighten near-vertical/horizontal lines (cleaner cuts)
   * 8. Union simplified + original to ensure we don't lose any area
   *
   * ### Why This Matters:
   * A simplified polygon with 50 vertices computes NFPs ~10x faster than one
   * with 500 vertices, but we can't oversimplify or parts won't fit.
   *
   * @param {Array<{x: number, y: number}>} polygon - Input polygon vertices
   * @param {boolean} inside - True if this is a hole (offset inward), false for outer contour
   * @returns {Array<{x: number, y: number}>} Simplified polygon with optional .children (holes)
   */
  simplifyPolygon(polygon, inside) {
    // Tolerance for RDP simplification - 4x the curve tolerance for good balance
    var tolerance = 4 * config.curveTolerance;

    // Long segments (> ~0.25 inch squared) get special treatment to preserve accuracy.
    // Standard RDP doesn't care about segment length, just perpendicular distance.
    var fixedTolerance =
      40 * config.curveTolerance * 40 * config.curveTolerance;
    var i, j, k;
    var self = this;

    // Fast path: if user wants maximum simplification, just use convex hull
    // This is MUCH faster but loses all concave features (holes in shapes, etc.)
    if (config.simplify) {
      var hull = this.getHull(polygon);
      if (hull) {
        return hull;
      } else {
        return polygon;
      }
    }

    // Step 1: Clean up the polygon (remove self-intersections, coincident points)
    var cleaned = this.cleanPolygon(polygon);
    if (cleaned && cleaned.length > 1) {
      polygon = cleaned;
    } else {
      return polygon;
    }

    // Convert closed polygon to open polyline for RDP (add first point at end)
    var copy = polygon.slice(0);
    copy.push(copy[0]);

    // Step 2: Mark long segments as "important" - these endpoints must be preserved.
    // RDP only cares about perpendicular distance, not segment length.
    // A 10-inch straight line might get reduced to just 2 points, losing precision.
    for (var i = 0; i < copy.length - 1; i++) {
      var p1 = copy[i];
      var p2 = copy[i + 1];
      var sqd = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
      if (sqd > fixedTolerance) {
        p1.marked = true;
        p2.marked = true;
      }
    }

    var simple = simplifyPoly(copy, tolerance, true);
    // now a polygon again
    simple.pop();

    // could be dirty again (self intersections and/or coincident points)
    simple = this.cleanPolygon(simple);

    // simplification process reduced poly to a line or point
    if (!simple) {
      simple = polygon;
    }

    var offsets = this.polygonOffset(simple, inside ? -tolerance : tolerance);

    var offset = null;
    var offsetArea = 0;
    var holes = [];
    for (i = 0; i < offsets.length; i++) {
      var area = GeometryUtil.polygonArea(offsets[i]);
      if (offset == null || area < offsetArea) {
        offset = offsets[i];
        offsetArea = area;
      }
      if (area > 0) {
        holes.push(offsets[i]);
      }
    }

    // mark any points that are exact
    for (var i = 0; i < simple.length; i++) {
      var seg = [simple[i], simple[i + 1 == simple.length ? 0 : i + 1]];
      var index1 = find(seg[0], polygon);
      var index2 = find(seg[1], polygon);

      if (
        index1 + 1 == index2 ||
        index2 + 1 == index1 ||
        (index1 == 0 && index2 == polygon.length - 1) ||
        (index2 == 0 && index1 == polygon.length - 1)
      ) {
        seg[0].exact = true;
        seg[1].exact = true;
      }
    }

    var numshells = 4;
    var shells = [];

    for (var j = 1; j < numshells; j++) {
      var delta = j * (tolerance / numshells);
      delta = inside ? -delta : delta;
      var shell = this.polygonOffset(simple, delta);
      if (shell.length > 0) {
        shell = shell[0];
      }
      shells[j] = shell;
    }

    if (!offset) {
      return polygon;
    }

    // selective reversal of offset
    for (var i = 0; i < offset.length; i++) {
      var o = offset[i];
      var target = getTarget(o, simple, 2 * tolerance);

      // reverse point offset and try to find exterior points
      var test = clone(offset);
      test[i] = { x: target.x, y: target.y };

      if (!exterior(test, polygon, inside)) {
        o.x = target.x;
        o.y = target.y;
      } else {
        // a shell is an intermediate offset between simple and offset
        for (var j = 1; j < numshells; j++) {
          if (shells[j]) {
            var shell = shells[j];
            var delta = j * (tolerance / numshells);
            target = getTarget(o, shell, 2 * delta);
            var test = clone(offset);
            test[i] = { x: target.x, y: target.y };
            if (!exterior(test, polygon, inside)) {
              o.x = target.x;
              o.y = target.y;
              break;
            }
          }
        }
      }
    }

    // straighten long lines
    // a rounded rectangle would still have issues at this point, as the long sides won't line up straight

    var straightened = false;

    for (var i = 0; i < offset.length; i++) {
      var p1 = offset[i];
      var p2 = offset[i + 1 == offset.length ? 0 : i + 1];

      var sqd = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);

      if (sqd < fixedTolerance) {
        continue;
      }
      for (var j = 0; j < simple.length; j++) {
        var s1 = simple[j];
        var s2 = simple[j + 1 == simple.length ? 0 : j + 1];

        var sqds =
          (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);

        if (sqds < fixedTolerance) {
          continue;
        }

        if (
          (GeometryUtil.almostEqual(s1.x, s2.x) ||
            GeometryUtil.almostEqual(s1.y, s2.y)) && // we only really care about vertical and horizontal lines
          GeometryUtil.withinDistance(p1, s1, 2 * tolerance) &&
          GeometryUtil.withinDistance(p2, s2, 2 * tolerance) &&
          (!GeometryUtil.withinDistance(p1, s1, config.curveTolerance / 1000) ||
            !GeometryUtil.withinDistance(p2, s2, config.curveTolerance / 1000))
        ) {
          p1.x = s1.x;
          p1.y = s1.y;
          p2.x = s2.x;
          p2.y = s2.y;
          straightened = true;
        }
      }
    }

    //if(straightened){
    var Ac = toClipperCoordinates(offset);
    ClipperLib.JS.ScaleUpPath(Ac, 10000000);
    var Bc = toClipperCoordinates(polygon);
    ClipperLib.JS.ScaleUpPath(Bc, 10000000);

    var combined = new ClipperLib.Paths();
    var clipper = new ClipperLib.Clipper();

    clipper.AddPath(Ac, ClipperLib.PolyType.ptSubject, true);
    clipper.AddPath(Bc, ClipperLib.PolyType.ptSubject, true);

    // the line straightening may have made the offset smaller than the simplified
    if (
      clipper.Execute(
        ClipperLib.ClipType.ctUnion,
        combined,
        ClipperLib.PolyFillType.pftNonZero,
        ClipperLib.PolyFillType.pftNonZero,
      )
    ) {
      var largestArea = null;
      for (var i = 0; i < combined.length; i++) {
        var n = toNestCoordinates(combined[i], 10000000);
        var sarea = -GeometryUtil.polygonArea(n);
        if (largestArea === null || largestArea < sarea) {
          offset = n;
          largestArea = sarea;
        }
      }
    }
    //}

    cleaned = this.cleanPolygon(offset);
    if (cleaned && cleaned.length > 1) {
      offset = cleaned;
    }

    // mark any points that are exact (for line merge detection)
    for (var i = 0; i < offset.length; i++) {
      var seg = [offset[i], offset[i + 1 == offset.length ? 0 : i + 1]];
      var index1 = find(seg[0], polygon);
      var index2 = find(seg[1], polygon);

      if (
        index1 + 1 == index2 ||
        index2 + 1 == index1 ||
        (index1 == 0 && index2 == polygon.length - 1) ||
        (index2 == 0 && index1 == polygon.length - 1)
      ) {
        seg[0].exact = true;
        seg[1].exact = true;
      }
    }

    if (!inside && holes && holes.length > 0) {
      offset.children = holes;
    }

    return offset;

    // ═══════════════════════════════════════════════════════════════════════════
    // INNER HELPER FUNCTIONS for simplifyPolygon
    // These are scoped inside simplifyPolygon to access closure variables
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Finds the best target point on the simplified polygon to snap an offset point to.
     * Prefers "exact" points (original vertices) over interpolated ones.
     * @inner
     */
    function getTarget(point, simple, tol) {
      var inrange = [];
      // Find all points on simplified polygon within tolerance distance
      for (var j = 0; j < simple.length; j++) {
        var s = simple[j];
        var d2 = (o.x - s.x) * (o.x - s.x) + (o.y - s.y) * (o.y - s.y);
        if (d2 < tol * tol) {
          inrange.push({ point: s, distance: d2 });
        }
      }

      var target;
      if (inrange.length > 0) {
        // Prefer exact points (original polygon vertices) over simplified ones
        var filtered = inrange.filter(function (p) {
          return p.point.exact;
        });

        inrange = filtered.length > 0 ? filtered : inrange;

        // Sort by distance and pick the closest
        inrange.sort(function (a, b) {
          return a.distance - b.distance;
        });

        target = inrange[0].point;
      } else {
        // No points in range - find the absolute closest point
        var mind = null;
        for (var j = 0; j < simple.length; j++) {
          var s = simple[j];
          var d2 = (o.x - s.x) * (o.x - s.x) + (o.y - s.y) * (o.y - s.y);
          if (mind === null || d2 < mind) {
            target = s;
            mind = d2;
          }
        }
      }

      return target;
    }

    /**
     * Checks if any vertices of the complex polygon fall outside the simple polygon.
     * Used to validate that simplification hasn't made the polygon smaller than original.
     * @inner
     */
    function exterior(simple, complex, inside) {
      for (var i = 0; i < complex.length; i++) {
        var v = complex[i];
        if (
          !inside &&
          !self.pointInPolygon(v, simple) &&
          find(v, simple) === null
        ) {
          return true;
        }
        if (
          inside &&
          self.pointInPolygon(v, simple) &&
          !find(v, simple) === null
        ) {
          return true;
        }
      }
      return false;
    }

    /**
     * Converts nest coordinates {x, y} to ClipperLib coordinates {X, Y}.
     * ClipperLib uses uppercase property names and integer math.
     * @inner
     */
    function toClipperCoordinates(polygon) {
      var clone = [];
      for (var i = 0; i < polygon.length; i++) {
        clone.push({
          X: polygon[i].x,
          Y: polygon[i].y,
        });
      }
      return clone;
    }

    /**
     * Converts ClipperLib coordinates {X, Y} back to nest coordinates {x, y}.
     * Divides by scale to undo the integer scaling.
     * @inner
     */
    function toNestCoordinates(polygon, scale) {
      var clone = [];
      for (var i = 0; i < polygon.length; i++) {
        clone.push({
          x: polygon[i].X / scale,
          y: polygon[i].Y / scale,
        });
      }
      return clone;
    }

    /**
     * Finds the index of a vertex in a polygon (fuzzy match within tolerance).
     * Returns null if not found.
     * @inner
     */
    function find(v, p) {
      for (var i = 0; i < p.length; i++) {
        if (
          GeometryUtil.withinDistance(v, p[i], config.curveTolerance / 1000)
        ) {
          return i;
        }
      }
      return null;
    }

    /**
     * Creates a shallow copy of a polygon (new array, same coordinate values).
     * @inner
     */
    function clone(p) {
      var newp = [];
      for (var i = 0; i < p.length; i++) {
        newp.push({
          x: p[i].x,
          y: p[i].y,
        });
      }
      return newp;
    }
  }

  /**
   * Gets or sets the nesting configuration.
   *
   * When called without arguments, returns the current config.
   * When called with an object, merges values into the config (with validation).
   *
   * @param {NestConfig} [c] - Configuration object to merge
   * @returns {NestConfig} Current configuration after any updates
   *
   * @example
   * // Get current config
   * const currentConfig = nest.config();
   *
   * // Update specific values
   * nest.config({ spacing: 2, rotations: 8, populationSize: 20 });
   */
  config(c) {
    // If no argument, return current config (getter mode)
    if (!c) {
      return config;
    }

    if (
      c.curveTolerance &&
      !GeometryUtil.almostEqual(parseFloat(c.curveTolerance), 0)
    ) {
      config.curveTolerance = parseFloat(c.curveTolerance);
    }

    if ("spacing" in c) {
      config.spacing = parseFloat(c.spacing);
    }

    if (c.rotations && parseInt(c.rotations) > 0) {
      config.rotations = parseInt(c.rotations);
    }

    if (c.populationSize && parseInt(c.populationSize) > 2) {
      config.populationSize = parseInt(c.populationSize);
    }

    if (c.mutationRate && parseInt(c.mutationRate) > 0) {
      config.mutationRate = parseInt(c.mutationRate);
    }

    if (c.threads && parseInt(c.threads) > 0) {
      // max 8 threads
      config.threads = Math.min(parseInt(c.threads), 8);
    }

    if (c.placementType) {
      config.placementType = String(c.placementType);
    }

    if (c.mergeLines === true || c.mergeLines === false) {
      config.mergeLines = !!c.mergeLines;
    }

    if (c.simplify === true || c.simplify === false) {
      config.simplify = !!c.simplify;
    }

    var n = Number(c.timeRatio);
    if (typeof n == "number" && !isNaN(n) && isFinite(n)) {
      config.timeRatio = n;
    }

    if (c.scale && parseFloat(c.scale) > 0) {
      config.scale = parseFloat(c.scale);
    }

    window.SvgParser.config({
      tolerance: config.curveTolerance,
      endpointTolerance: c.endpointTolerance,
    });

    //nfpCache = {};
    //binPolygon = null;
    this.GA = null;

    return config;
  }

  /**
   * Tests whether a point lies strictly inside a polygon.
   *
   * Uses ClipperLib's point-in-polygon test with coarse scaling (1000x instead
   * of clipperScale's 10M) to deliberately exclude points lying exactly ON
   * the polygon boundary. This prevents edge cases where parts share an edge.
   *
   * @param {{x: number, y: number}} point - Point to test
   * @param {Array<{x: number, y: number}>} polygon - Polygon vertices
   * @returns {boolean} True if point is strictly inside (not on boundary)
   */
  pointInPolygon(point, polygon) {
    // Scale at 1000x (not 10M) to be "fuzzy" about boundary points.
    // This ensures points ON the edge return false (not inside).
    var p = this.svgToClipper(polygon, 1000);
    var pt = new ClipperLib.IntPoint(1000 * point.x, 1000 * point.y);

    // ClipperLib returns: -1 = outside, 0 = on boundary, 1 = inside
    // We want strictly inside, so we check > 0
    return ClipperLib.Clipper.PointInPolygon(pt, p) > 0;
  }

  /*this.simplifyPolygon = function(polygon, concavehull){
    function clone(p){
      var newp = [];
      for(var i=0; i<p.length; i++){
        newp.push({
          x: p[i].x,
          y: p[i].y
          //fuck: p[i].fuck
        });
      }
      return newp;
    }
    if(concavehull){
      var hull = concavehull;
    }
    else{
      var hull = new ConvexHullGrahamScan();
      for(var i=0; i<polygon.length; i++){
        hull.addPoint(polygon[i].x, polygon[i].y);
      }

      hull = hull.getHull();
    }

    var hullarea = Math.abs(GeometryUtil.polygonArea(hull));

    var concave = [];
    var detail = [];

    // fill concave[] with convex points, ensuring same order as initial polygon
    for(i=0; i<polygon.length; i++){
      var p = polygon[i];
      var found = false;
      for(var j=0; j<hull.length; j++){
        var hp = hull[j];
        if(GeometryUtil.almostEqual(hp.x, p.x) && GeometryUtil.almostEqual(hp.y, p.y)){
          found = true;
          break;
        }
      }

      if(found){
        concave.push(p);
        //p.fuck = i+'yes';
      }
      else{
        detail.push(p);
        //p.fuck = i+'no';
      }
    }

    var cindex = -1;
    var simple = [];

    for(i=0; i<polygon.length; i++){
      var p = polygon[i];
      if(concave.indexOf(p) > -1){
        cindex = concave.indexOf(p);
        simple.push(p);
      }
      else{

        var test = clone(concave);
        test.splice(cindex < 0 ? 0 : cindex+1,0,p);

        var outside = false;
        for(var j=0; j<detail.length; j++){
          if(detail[j] == p){
            continue;
          }
          if(!this.pointInPolygon(detail[j], test)){
            //console.log(detail[j], test);
            outside = true;
            break;
          }
        }

        if(outside){
          continue;
        }

        var testarea =  Math.abs(GeometryUtil.polygonArea(test));
        //console.log(testarea, hullarea);
        if(testarea/hullarea < 0.98){
          simple.push(p);
        }
      }
    }

    return simple;
  }*/

  /**
   * Extracts nestable parts from SVG paths and organizes them into a tree structure.
   *
   * ## Why a Tree Structure?
   * Parts can have holes (like a donut shape), and holes can contain islands
   * (like a target symbol). The tree alternates: parts → holes → islands → ...
   * - Depth 0 (root): Outer part contours
   * - Depth 1: Holes in those parts
   * - Depth 2: Islands inside holes
   * - And so on...
   *
   * ## Workflow
   * 1. Filter to valid polygon elements (circle, rect, path, etc.)
   * 2. Skip open paths (can't be cut/filled)
   * 3. Convert SVG elements to polygon arrays
   * 4. Build parent-child relationships based on containment
   * 5. Associate non-polygon elements (images, lines) with containing parts
   *
   * @param {HTMLCollection|Array} paths - SVG child elements to process
   * @param {string} filename - Source filename (used for quantity parsing and sheet detection)
   * @returns {Array<Part>} Parts with polygontree, svgelements, bounds, quantity, etc.
   */
  getParts(paths, filename) {
    var j;
    var polygons = [];

    var numChildren = paths.length;
    for (var i = 0; i < numChildren; i++) {
      // Skip non-polygon elements (groups, text, etc.)
      if (window.SvgParser.polygonElements.indexOf(paths[i].tagName) < 0) {
        continue;
      }

      // Skip open paths - they can't be cut as closed shapes
      if (!window.SvgParser.isClosed(paths[i], 2 * config.curveTolerance)) {
        continue;
      }

      // Convert SVG element to polygon (array of {x, y} points)
      var poly = window.SvgParser.polygonify(paths[i]);
      poly = this.cleanPolygon(poly);

      // Validate: must have area > tolerance² (filters out degenerate shapes)
      if (
        poly &&
        poly.length > 2 &&
        Math.abs(GeometryUtil.polygonArea(poly)) >
          config.curveTolerance * config.curveTolerance
      ) {
        poly.source = i; // Remember which SVG element this came from
        polygons.push(poly);
      }
    }

    // Build hierarchical tree based on polygon containment
    toTree(polygons);

    /**
     * Recursively organizes polygons into a parent-child tree based on containment.
     * A polygon is a child of another if >50% of its sample points are inside.
     * @inner
     */
    function toTree(list, idstart) {
      // Local coordinate converter for containment testing
      function svgToClipper(polygon) {
        var clip = [];
        for (var i = 0; i < polygon.length; i++) {
          clip.push({ X: polygon[i].x, Y: polygon[i].y });
        }
        ClipperLib.JS.ScaleUpPath(clip, config.clipperScale);
        return clip;
      }

      // Tests if a point is inside a ClipperLib-format polygon
      function pointInClipperPolygon(point, polygon) {
        var pt = new ClipperLib.IntPoint(
          config.clipperScale * point.x,
          config.clipperScale * point.y,
        );
        return ClipperLib.Clipper.PointInPolygon(pt, polygon) > 0;
      }

      var parents = [];
      var id = idstart || 0;

      // Determine parent-child relationships by testing containment
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var ischild = false;

        for (var j = 0; j < list.length; j++) {
          if (j == i) continue;
          if (p.length < 2) continue;

          // Sample up to 10 points to test containment (faster than all points)
          var inside = 0;
          var fullinside = Math.min(10, p.length);
          var clipper_polygon = svgToClipper(list[j]);

          for (var k = 0; k < fullinside; k++) {
            if (pointInClipperPolygon(p[k], clipper_polygon) === true) {
              inside++;
            }
          }

          // If >50% of sample points are inside, this polygon is a child (hole or island)
          if (inside > 0.5 * fullinside) {
            if (!list[j].children) {
              list[j].children = [];
            }
            list[j].children.push(p);
            p.parent = list[j];
            ischild = true;
            break;
          }
        }

        if (!ischild) {
          parents.push(p);
        }
      }

      // Remove child polygons from the main list (they're now in .children)
      for (var i = 0; i < list.length; i++) {
        if (parents.indexOf(list[i]) < 0) {
          list.splice(i, 1);
          i--;
        }
      }

      // Assign unique IDs to parent polygons
      for (var i = 0; i < parents.length; i++) {
        parents[i].id = id;
        id++;
      }

      // Recursively process children (holes, islands, etc.)
      for (var i = 0; i < parents.length; i++) {
        if (parents[i].children) {
          id = toTree(parents[i].children, id);
        }
      }

      return id;
    }

    // construct part objects with metadata
    var parts = [];
    var svgelements = Array.prototype.slice.call(paths);
    var openelements = svgelements.slice(); // elements that are not a part of the poly tree but may still be a part of the part (images, lines, possibly text..)

    for (var i = 0; i < polygons.length; i++) {
      var part = {};
      part.polygontree = polygons[i];
      part.svgelements = [];

      var bounds = GeometryUtil.getPolygonBounds(part.polygontree);
      part.bounds = bounds;
      part.area = bounds.width * bounds.height;
      part.quantity = 1;
      part.filename = filename;

      if (part.filename === "BACKGROUND.svg") {
        part.sheet = true;
      }

      if (
        window.config.getSync("useQuantityFromFileName") &&
        part.filename &&
        part.filename !== null
      ) {
        const fileNameParts = part.filename.split(".");
        if (fileNameParts.length >= 3) {
          const fileNameQuantityPart = fileNameParts[fileNameParts.length - 2];
          const quantity = parseInt(fileNameQuantityPart, 10);
          if (!isNaN(quantity)) {
            part.quantity = quantity;
          }
        }
      }

      // load root element
      part.svgelements.push(svgelements[part.polygontree.source]);
      var index = openelements.indexOf(svgelements[part.polygontree.source]);
      if (index > -1) {
        openelements.splice(index, 1);
      }

      // load all elements that lie within the outer polygon
      for (var j = 0; j < svgelements.length; j++) {
        if (
          j != part.polygontree.source &&
          findElementById(j, part.polygontree)
        ) {
          part.svgelements.push(svgelements[j]);
          index = openelements.indexOf(svgelements[j]);
          if (index > -1) {
            openelements.splice(index, 1);
          }
        }
      }

      parts.push(part);
    }

    function findElementById(id, tree) {
      if (id == tree.source) {
        return true;
      }

      if (tree.children && tree.children.length > 0) {
        for (var i = 0; i < tree.children.length; i++) {
          if (findElementById(id, tree.children[i])) {
            return true;
          }
        }
      }

      return false;
    }

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      // the elements left are either erroneous or open
      // we want to include open segments that also lie within the part boundaries
      for (var j = 0; j < openelements.length; j++) {
        var el = openelements[j];
        if (el.tagName == "line") {
          var x1 = Number(el.getAttribute("x1"));
          var x2 = Number(el.getAttribute("x2"));
          var y1 = Number(el.getAttribute("y1"));
          var y2 = Number(el.getAttribute("y2"));
          var start = { x: x1, y: y1 };
          var end = { x: x2, y: y2 };
          var mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

          if (
            this.pointInPolygon(start, part.polygontree) === true ||
            this.pointInPolygon(end, part.polygontree) === true ||
            this.pointInPolygon(mid, part.polygontree) === true
          ) {
            part.svgelements.push(el);
            openelements.splice(j, 1);
            j--;
          }
        } else if (el.tagName == "image") {
          var x = Number(el.getAttribute("x"));
          var y = Number(el.getAttribute("y"));
          var width = Number(el.getAttribute("width"));
          var height = Number(el.getAttribute("height"));

          var mid = new Point(x + width / 2, y + height / 2);

          var transformString = el.getAttribute("transform");
          if (transformString) {
            var transform = window.SvgParser.transformParse(transformString);
            if (transform) {
              mid = transform.calc(mid);
            }
          }
          // just test midpoint for images
          if (this.pointInPolygon(mid, part.polygontree) === true) {
            part.svgelements.push(el);
            openelements.splice(j, 1);
            j--;
          }
        } else if (el.tagName == "path" || el.tagName == "polyline") {
          var k;
          if (el.tagName == "path") {
            var p = window.SvgParser.polygonifyPath(el);
          } else {
            var p = [];
            for (k = 0; k < el.points.length; k++) {
              p.push({
                x: el.points[k].x,
                y: el.points[k].y,
              });
            }
          }

          if (p.length < 2) {
            continue;
          }

          var found = false;
          var next = p[1];
          for (k = 0; k < p.length; k++) {
            if (this.pointInPolygon(p[k], part.polygontree) === true) {
              found = true;
              break;
            }

            if (k >= p.length - 1) {
              next = p[0];
            } else {
              next = p[k + 1];
            }

            // also test for midpoints in case of single line edge case
            var mid = {
              x: (p[k].x + next.x) / 2,
              y: (p[k].y + next.y) / 2,
            };
            if (this.pointInPolygon(mid, part.polygontree) === true) {
              found = true;
              break;
            }
          }
          if (found) {
            part.svgelements.push(el);
            openelements.splice(j, 1);
            j--;
          }
        } else {
          // something went wrong
          //console.log('part not processed: ',el);
        }
      }
    }

    for (j = 0; j < openelements.length; j++) {
      var el = openelements[j];
      if (
        el.tagName == "line" ||
        el.tagName == "polyline" ||
        el.tagName == "path"
      ) {
        el.setAttribute("class", "error");
      }
    }

    return parts;
  }

  /**
   * Deep clones a polygon tree, preserving the hierarchical structure.
   *
   * Creates new arrays with copied coordinate values but same structure.
   * Essential for passing data through IPC without mutating originals.
   *
   * @param {Array<{x: number, y: number, exact?: boolean}>} tree - Polygon with optional .children
   * @returns {Array} Cloned polygon tree with same structure
   */
  cloneTree(tree) {
    var newtree = [];
    tree.forEach(function (t) {
      newtree.push({ x: t.x, y: t.y, exact: t.exact });
    });

    // Recursively clone child polygons (holes, islands, etc.)
    var self = this;
    if (tree.children && tree.children.length > 0) {
      newtree.children = [];
      tree.children.forEach(function (c) {
        newtree.children.push(self.cloneTree(c));
      });
    }

    return newtree;
  }

  /**
   * Starts the nesting computation.
   *
   * This is the main entry point to begin optimizing part placements.
   * It sets up callbacks, prepares parts for IPC transfer, applies spacing
   * offsets, initializes the genetic algorithm, and starts background workers.
   *
   * ## Workflow
   * 1. Store callbacks for progress and display updates
   * 2. Clone parts (avoid mutating originals during computation)
   * 3. Apply spacing offset: sheets shrink, parts grow by spacing/2
   * 4. Start interval timer that polls launchWorkers()
   * 5. Listen for background-response events with placement results
   *
   * @param {Function} p - Progress callback (called during computation)
   * @param {Function} d - Display callback (called when new best placement found)
   */
  start(p, d) {
    this.progressCallback = p;
    this.displayCallback = d;

    var parts = [];

    // Clone parts for IPC transfer - only include data needed by workers
    // (avoids sending DOM elements and other non-serializable data)
    for (var i = 0; i < this.parts.length; i++) {
      parts.push({
        quantity: this.parts[i].quantity,
        sheet: this.parts[i].sheet,
        polygontree: this.cloneTree(this.parts[i].polygontree),
        filename: this.parts[i].filename,
      });
    }

    // Apply spacing offsets: sheets shrink INWARD, parts grow OUTWARD.
    // This creates the required gap between nested parts.
    // Total gap = spacing/2 (sheet) + spacing/2 (part) = spacing
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].sheet) {
        // Sheet: offset INWARD (negative) to create margin from edges
        offsetTree(
          parts[i].polygontree,
          -0.5 * config.spacing,
          this.polygonOffset.bind(this),
          this.simplifyPolygon.bind(this),
          true,
        );
      } else {
        offsetTree(
          parts[i].polygontree,
          0.5 * config.spacing,
          this.polygonOffset.bind(this),
          this.simplifyPolygon.bind(this),
        );
      }
    }

    // offset tree recursively
    function offsetTree(t, offset, offsetFunction, simpleFunction, inside) {
      var simple = t;
      if (simpleFunction) {
        simple = simpleFunction(t, !!inside);
      }

      var offsetpaths = [simple];
      if (offset > 0) {
        offsetpaths = offsetFunction(simple, offset);
      }

      if (offsetpaths.length > 0) {
        //var cleaned = cleanFunction(offsetpaths[0]);

        // replace array items in place
        Array.prototype.splice.apply(t, [0, t.length].concat(offsetpaths[0]));
      }

      if (simple.children && simple.children.length > 0) {
        if (!t.children) {
          t.children = [];
        }

        for (var i = 0; i < simple.children.length; i++) {
          t.children.push(simple.children[i]);
        }
      }

      if (t.children && t.children.length > 0) {
        for (var i = 0; i < t.children.length; i++) {
          offsetTree(
            t.children[i],
            -offset,
            offsetFunction,
            simpleFunction,
            !inside,
          );
        }
      }
    }

    var self = this;
    this.working = true;

    if (!this.workerTimer) {
      this.workerTimer = setInterval(function () {
        self.launchWorkers.call(
          self,
          parts,
          config,
          this.progressCallback,
          this.displayCallback,
        );
        //progressCallback(progress);
      }, 100);
    }

    this.eventEmitter.on("background-response", (event, payload) => {
      this.eventEmitter.send("setPlacements", payload);
      console.log("ipc response", payload);
      if (!this.GA) {
        // user might have quit while we're away
        return;
      }
      this.GA.population[payload.index].processing = false;
      this.GA.population[payload.index].fitness = payload.fitness;

      // render placement
      if (this.nests.length == 0 || this.nests[0].fitness > payload.fitness) {
        this.nests.unshift(payload);

        // Check if we should keep a long list (more than 100 results)
        const keepLongList = process.env.DEEPNEST_LONGLIST;

        if (keepLongList) {
          // Keep up to 100 results without sorting
          if (this.nests.length > 100) {
            this.nests.pop();
          }
        } else {
          // Original behavior - keep only top 10 by fitness
          if (this.nests.length > 10) {
            this.nests.pop();
          }
        }

        if (this.displayCallback) {
          this.displayCallback();
        }
      } else if (process.env.DEEPNEST_LONGLIST) {
        // With DEEPNEST_LONGLIST, we add the result to the list regardless of fitness
        // Just make sure it's not worse than the worst result we already have
        const worstFitness = Math.min(
          ...this.nests.map((item) => item.fitness),
        );
        if (this.nests.length < 100 || payload.fitness > worstFitness) {
          // Find where to insert this result to maintain insertion order
          this.nests.push(payload);

          // If we exceeded 100 results, remove the worst one
          if (this.nests.length > 100) {
            // Find the worst fitness
            let worstIndex = 0;
            let worstFitness = this.nests[0].fitness;

            for (let i = 1; i < this.nests.length; i++) {
              if (this.nests[i].fitness > worstFitness) {
                worstIndex = i;
                worstFitness = this.nests[i].fitness;
              }
            }

            // Remove the worst fitness item
            this.nests.splice(worstIndex, 1);
          }

          if (this.displayCallback) {
            this.displayCallback();
          }
        }
      }
    });
  }

  /**
   * Pads a number with leading zeros to a specified width.
   * @param {number} n - Number to pad
   * @param {number} width - Desired total width
   * @param {string} [z='0'] - Padding character
   * @returns {string} Zero-padded string
   * @private
   */
  padNumber(n, width, z) {
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  /**
   * Main worker coordination loop - dispatches parts to background workers.
   *
   * Called every 100ms by the workerTimer interval. This function:
   * 1. Initializes the Genetic Algorithm on first call (creates "adam" population)
   * 2. Checks if current GA generation is complete
   * 3. Advances to next generation if all individuals evaluated
   * 4. Dispatches pending individuals to background workers via IPC
   *
   * ## Genetic Algorithm Integration
   * The GA maintains a population of "individuals", where each individual
   * represents a specific ordering and rotation of parts. This function
   * sends individuals to background workers which compute their "fitness"
   * (how well the parts fit on sheets).
   *
   * ## First-Fit Decreasing Heuristic
   * Parts are initially sorted by area (largest first). This "first-fit
   * decreasing" strategy is a well-known bin packing heuristic that
   * produces good initial solutions.
   *
   * @param {Array<Part>} parts - Parts to nest (with quantity, polygontree, etc.)
   * @param {NestConfig} config - Nesting configuration
   * @param {Function} progressCallback - Progress update callback
   * @param {Function} displayCallback - Display update callback
   * @private
   */
  launchWorkers(parts, config, progressCallback, displayCallback) {
    // Fisher-Yates shuffle (not currently used but available)
    function shuffle(array) {
      var currentIndex = array.length,
        temporaryValue,
        randomIndex;
      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      return array;
    }

    var i, j;

    // Initialize GA on first call - create the initial population
    if (this.GA === null) {
      // "Adam" is the first individual - all parts in their original order
      var adam = [];
      var id = 0;

      // Expand parts by quantity (e.g., 3 copies of part A → 3 entries)
      for (var i = 0; i < parts.length; i++) {
        if (!parts[i].sheet) {
          for (var j = 0; j < parts[i].quantity; j++) {
            var poly = this.cloneTree(parts[i].polygontree);
            poly.id = id; // Unique instance ID (includes duplicates)
            poly.source = i; // Reference to original part definition
            poly.filename = parts[i].filename;

            adam.push(poly);
            id++;
          }
        }
      }

      // First-Fit Decreasing: sort largest parts first.
      // This heuristic places big items first, then fills gaps with smaller ones.
      adam.sort(function (a, b) {
        return (
          Math.abs(GeometryUtil.polygonArea(b)) -
          Math.abs(GeometryUtil.polygonArea(a))
        );
      });

      // Create the GA with Adam as the seed individual
      this.GA = new GeneticAlgorithm(adam, config);
    }

    // check if current generation is finished
    var finished = true;
    for (var i = 0; i < this.GA.population.length; i++) {
      if (!this.GA.population[i].fitness) {
        finished = false;
        break;
      }
    }

    if (finished) {
      console.log("new generation!");
      // all individuals have been evaluated, start next generation
      this.GA.generation();
    }

    var running = this.GA.population.filter(function (p) {
      return !!p.processing;
    }).length;

    var sheets = [];
    var sheetids = [];
    var sheetsources = [];
    var sheetchildren = [];
    var sid = 0;

    for (var i = 0; i < parts.length; i++) {
      if (parts[i].sheet) {
        var poly = parts[i].polygontree;
        for (var j = 0; j < parts[i].quantity; j++) {
          sheets.push(poly);
          sheetids.push(this.padNumber(sid, 4) + "-" + this.padNumber(j, 4));
          sheetsources.push(i);
          sheetchildren.push(poly.children);
        }
        sid++;
      }
    }

    for (var i = 0; i < this.GA.population.length; i++) {
      //if(running < config.threads && !GA.population[i].processing && !GA.population[i].fitness){
      // only one background window now...
      if (
        running < 1 &&
        !this.GA.population[i].processing &&
        !this.GA.population[i].fitness
      ) {
        this.GA.population[i].processing = true;

        // hash values on arrays don't make it across ipc, store them in an array and reassemble on the other side....
        var ids = [];
        var sources = [];
        var children = [];
        var filenames = [];

        for (var j = 0; j < this.GA.population[i].placement.length; j++) {
          var id = this.GA.population[i].placement[j].id;
          var source = this.GA.population[i].placement[j].source;
          var child = this.GA.population[i].placement[j].children;
          var filename = this.GA.population[i].placement[j].filename;
          ids[j] = id;
          sources[j] = source;
          children[j] = child;
          filenames[j] = filename;
        }

        this.eventEmitter.send("background-start", {
          index: i,
          sheets: sheets,
          sheetids: sheetids,
          sheetsources: sheetsources,
          sheetchildren: sheetchildren,
          individual: this.GA.population[i],
          config: config,
          ids: ids,
          sources: sources,
          children: children,
          filenames: filenames,
        });
        running++;
      }
    }
  }

  /**
   * Expands or contracts a polygon by a given offset distance.
   *
   * Uses ClipperLib's offset operation with miter joins. This is essential for:
   * - Adding spacing between parts (positive offset = grow)
   * - Creating margins from sheet edges (negative offset = shrink)
   *
   * Note: May return multiple polygons if offsetting creates new shapes
   * (e.g., a large inward offset might split a thin area into separate regions).
   *
   * @param {Array<{x: number, y: number}>} polygon - Input polygon vertices
   * @param {number} offset - Offset distance (positive = expand, negative = contract)
   * @returns {Array<Array<{x: number, y: number}>>} Array of resulting polygons
   */
  polygonOffset(polygon, offset) {
    if (!offset || offset == 0 || GeometryUtil.almostEqual(offset, 0)) {
      return polygon;
    }

    var p = this.svgToClipper(polygon);

    // Miter limit controls how far sharp corners can extend
    var miterLimit = 4;
    var co = new ClipperLib.ClipperOffset(
      miterLimit,
      config.curveTolerance * config.clipperScale,
    );
    co.AddPath(
      p,
      ClipperLib.JoinType.jtMiter, // Sharp corners (good for mechanical parts)
      ClipperLib.EndType.etClosedPolygon,
    );

    var newpaths = new ClipperLib.Paths();
    co.Execute(newpaths, offset * config.clipperScale);

    // Convert all resulting paths back to SVG coordinates
    var result = [];
    for (var i = 0; i < newpaths.length; i++) {
      result.push(this.clipperToSvg(newpaths[i]));
    }

    return result;
  }

  /**
   * Cleans up a polygon by removing self-intersections and degenerate features.
   *
   * ## What This Does
   * 1. Simplify: Remove self-intersections (figure-8 shapes become separate polygons)
   * 2. Select: Keep only the largest resulting polygon
   * 3. Clean: Remove coincident points and near-zero-length edges
   * 4. Dedupe: Remove duplicate start/end points
   *
   * @param {Array<{x: number, y: number}>} polygon - Input polygon (potentially dirty)
   * @returns {Array<{x: number, y: number}>|null} Cleaned polygon, or null if degenerate
   */
  cleanPolygon(polygon) {
    var p = this.svgToClipper(polygon);

    // SimplifyPolygon resolves self-intersections (may produce multiple polygons)
    var simple = ClipperLib.Clipper.SimplifyPolygon(
      p,
      ClipperLib.PolyFillType.pftNonZero,
    );

    if (!simple || simple.length == 0) {
      return null;
    }

    // Keep only the largest polygon (discard tiny fragments from self-intersection)
    var biggest = simple[0];
    var biggestarea = Math.abs(ClipperLib.Clipper.Area(biggest));
    for (var i = 1; i < simple.length; i++) {
      var area = Math.abs(ClipperLib.Clipper.Area(simple[i]));
      if (area > biggestarea) {
        biggest = simple[i];
        biggestarea = area;
      }
    }

    // Remove singularities (coincident points, near-zero edges)
    var clean = ClipperLib.Clipper.CleanPolygon(
      biggest,
      0.01 * config.curveTolerance * config.clipperScale,
    );

    if (!clean || clean.length == 0) {
      return null;
    }

    var cleaned = this.clipperToSvg(clean);

    // Remove duplicate first/last point (ClipperLib sometimes adds this)
    var start = cleaned[0];
    var end = cleaned[cleaned.length - 1];
    if (
      start == end ||
      (GeometryUtil.almostEqual(start.x, end.x) &&
        GeometryUtil.almostEqual(start.y, end.y))
    ) {
      cleaned.pop();
    }

    return cleaned;
  }

  /**
   * Converts nest coordinates {x, y} to ClipperLib format {X, Y} with integer scaling.
   *
   * ClipperLib uses integer arithmetic for precision. We scale by clipperScale (10M)
   * to maintain ~7 decimal places of precision.
   *
   * @param {Array<{x: number, y: number}>} polygon - Floating-point coordinates
   * @param {number} [scale] - Custom scale (defaults to config.clipperScale)
   * @returns {Array<{X: number, Y: number}>} Integer coordinates for ClipperLib
   */
  svgToClipper(polygon, scale) {
    var clip = [];
    for (var i = 0; i < polygon.length; i++) {
      clip.push({ X: polygon[i].x, Y: polygon[i].y });
    }

    ClipperLib.JS.ScaleUpPath(clip, scale || config.clipperScale);

    return clip;
  }

  /**
   * Converts ClipperLib format {X, Y} back to nest coordinates {x, y}.
   *
   * @param {Array<{X: number, Y: number}>} polygon - ClipperLib integer coordinates
   * @returns {Array<{x: number, y: number}>} Floating-point coordinates
   */
  clipperToSvg(polygon) {
    var normal = [];

    for (var i = 0; i < polygon.length; i++) {
      normal.push({
        x: polygon[i].X / config.clipperScale,
        y: polygon[i].Y / config.clipperScale,
      });
    }

    return normal;
  }

  /**
   * Applies a placement result to generate exportable SVG elements.
   *
   * Takes placement coordinates from the nesting algorithm and creates
   * SVG groups with appropriate transforms (translate + rotate) for each part.
   *
   * @param {Array<Array<{id: number, x: number, y: number, rotation: number}>>} placement - Placement data per sheet
   * @returns {Array<SVGElement>} Array of SVG elements, one per sheet
   */
  applyPlacement(placement) {
    var clone = [];
    for (var i = 0; i < parts.length; i++) {
      clone.push(parts[i].cloneNode(false));
    }

    var svglist = [];

    for (var i = 0; i < placement.length; i++) {
      var newsvg = svg.cloneNode(false);
      newsvg.setAttribute(
        "viewBox",
        "0 0 " + binBounds.width + " " + binBounds.height,
      );
      newsvg.setAttribute("width", binBounds.width + "px");
      newsvg.setAttribute("height", binBounds.height + "px");
      var binclone = bin.cloneNode(false);

      binclone.setAttribute("class", "bin");
      binclone.setAttribute(
        "transform",
        "translate(" + -binBounds.x + " " + -binBounds.y + ")",
      );
      newsvg.appendChild(binclone);

      for (var j = 0; j < placement[i].length; j++) {
        var p = placement[i][j];
        var part = tree[p.id];

        // the original path could have transforms and stuff on it, so apply our transforms on a group
        var partgroup = document.createElementNS(svg.namespaceURI, "g");
        partgroup.setAttribute(
          "transform",
          "translate(" + p.x + " " + p.y + ") rotate(" + p.rotation + ")",
        );
        partgroup.appendChild(clone[part.source]);

        if (part.children && part.children.length > 0) {
          var flattened = _flattenTree(part.children, true);
          for (var k = 0; k < flattened.length; k++) {
            var c = clone[flattened[k].source];
            if (flattened[k].hole) {
              c.setAttribute("class", "hole");
            }
            partgroup.appendChild(c);
          }
        }

        newsvg.appendChild(partgroup);
      }

      svglist.push(newsvg);
    }

    // flatten the given tree into a list
    function _flattenTree(t, hole) {
      var flat = [];
      for (var i = 0; i < t.length; i++) {
        flat.push(t[i]);
        t[i].hole = hole;
        if (t[i].children && t[i].children.length > 0) {
          flat = flat.concat(_flattenTree(t[i].children, !hole));
        }
      }

      return flat;
    }

    return svglist;
  }

  /**
   * Stops the nesting computation gracefully.
   *
   * Clears processing flags on all GA individuals and stops the worker timer.
   * Call this when the user clicks "Stop" or before closing the application.
   */
  stop() {
    this.working = false;
    if (this.GA && this.GA.population && this.GA.population.length > 0) {
      this.GA.population.forEach(function (i) {
        i.processing = false;
      });
    }
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
    }
  }

  /**
   * Resets the nester to initial state.
   *
   * Clears the GA, all stored nests, and callbacks. Call this before
   * starting a new nesting job to ensure clean state.
   */
  reset() {
    this.GA = null;
    while (this.nests.length > 0) {
      this.nests.pop();
    }
    this.progressCallback = null;
    this.displayCallback = null;
  }
}
