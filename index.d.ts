/**
 * Core type definitions for DeepNest
 *
 * These types define the fundamental data structures used throughout the application.
 * UI-specific extensions are defined in main/ui/types/index.ts
 */

/**
 * Placement type options for nesting algorithm
 * - gravity: Parts fall towards bottom-left corner
 * - box: Parts placed in bounding box formation
 * - convexhull: Parts placed within convex hull boundaries
 */
export type PlacementType = "gravity" | "box" | "convexhull";

/**
 * Unit options for measurements
 */
export type UnitType = "mm" | "inch";

/**
 * Core configuration for DeepNest nesting algorithm
 */
export type DeepNestConfig = {
  /** Measurement units (mm or inch) */
  units: UnitType;
  /** Scale factor for SVG coordinate conversion */
  scale: number;
  /** Spacing between nested parts in SVG units */
  spacing: number;
  /** Tolerance for curve approximation in polygonification */
  curveTolerance: number;
  /** Scale factor for Clipper.js integer operations */
  clipperScale: number;
  /** Number of rotation angles to try (e.g., 4 = 0, 90, 180, 270) */
  rotations: number;
  /** Number of worker threads for parallel computation */
  threads: number;
  /** Genetic algorithm population size */
  populationSize: number;
  /** Genetic algorithm mutation rate (0-1) */
  mutationRate: number;
  /** Placement algorithm type */
  placementType: PlacementType;
  /** Enable laser line merging optimization */
  mergeLines: boolean;
  /**
   * Ratio of material reduction to laser time optimization.
   * 0 = optimize material only, 1 = optimize laser time only
   */
  timeRatio: number;
  /** Enable polygon simplification */
  simplify: boolean;
  /** Scale factor for DXF import */
  dxfImportScale: number;
  /** Scale factor for DXF export */
  dxfExportScale: number;
  /** Tolerance for endpoint matching when closing paths */
  endpointTolerance: number;
  /** URL of the file conversion server for DXF/DWG support */
  conversionServer: string;
};

/**
 * Placement of a single part on a sheet
 */
export type SheetPlacement = {
  /** Source filename of the part */
  filename: string;
  /** Unique identifier for this placement */
  id: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Source part index in the parts array */
  source: number;
  /** X coordinate of placement */
  x: number;
  /** Y coordinate of placement */
  y: number;
};

/**
 * Complete nesting result containing all sheet placements
 */
export type NestingResult = {
  /** Total area used by placements */
  area: number;
  /** Fitness score for genetic algorithm (lower is better) */
  fitness: number;
  /** Result index in the nests array */
  index: number;
  /** Total length of merged laser lines (if merging enabled) */
  mergedLength: number;
  /** Whether this result is currently selected in UI */
  selected: boolean;
  /** Array of sheet placements */
  placements: {
    /** Sheet index */
    sheet: number;
    /** Sheet identifier */
    sheetid: number;
    /** Parts placed on this sheet */
    sheetplacements: SheetPlacement[];
  }[];
};

/**
 * Bounding box rectangle
 */
export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * A point in a polygon with optional processing markers
 */
export type PolygonPoint = {
  x: number;
  y: number;
  /** Marked for NFP generation or simplification */
  marked?: boolean;
  /** Point lies exactly on original polygon edge */
  exact?: boolean;
};

/**
 * A polygon represented as an array of points
 * Extended with tree structure properties for nested parts
 */
export interface Polygon extends Array<PolygonPoint> {
  /** Unique identifier for the polygon within the part tree */
  id?: number;
  /** Source index in the original SVG elements array */
  source?: number;
  /** Child polygons (holes or nested parts) */
  children?: Polygon[];
  /** Parent polygon reference */
  parent?: Polygon;
  /** Original filename this polygon came from */
  filename?: string;
}

/**
 * Represents a part in the nesting workspace
 */
export type Part = {
  /** Polygon tree representation for nesting calculations */
  polygontree: Polygon;
  /** Original SVG elements for rendering */
  svgelements: SVGElement[];
  /** Bounding box of the part */
  bounds: Bounds;
  /** Area of bounding box (width * height) */
  area: number;
  /** Number of copies to nest */
  quantity: number;
  /** Source filename or null for programmatically created parts */
  filename: string | null;
  /** True if this part is a sheet (bin) rather than a piece to nest */
  sheet?: boolean;
  /** True if currently selected in the UI */
  selected?: boolean;
};

/**
 * Configuration object interface for window.config
 * Provides synchronous get/set methods for configuration values
 */
export interface ConfigObject {
  /**
   * Get configuration value(s)
   * @param key Optional key to get specific value; if omitted, returns full config
   */
  getSync<K extends keyof DeepNestConfig>(key?: K): K extends keyof DeepNestConfig ? DeepNestConfig[K] : DeepNestConfig;

  /**
   * Set configuration value(s)
   * @param keyOrObject Key to set, or object with multiple values
   * @param value Value to set (when keyOrObject is a string)
   */
  setSync<K extends keyof DeepNestConfig>(keyOrObject: K | Partial<DeepNestConfig>, value?: DeepNestConfig[K]): void;

  /**
   * Reset all configuration to default values
   */
  resetToDefaultsSync(): void;
}

/**
 * DeepNest instance interface for window.DeepNest
 * Core nesting engine API
 */
export interface DeepNestInstance {
  /** List of all parts (including sheets) */
  parts: Part[];
  /** Nesting results */
  nests: NestingResult[];
  /** Whether nesting is currently running */
  working: boolean;

  /**
   * Import an SVG file
   * @param filename Original filename
   * @param dirpath Directory path for resolving relative paths
   * @param svgstring SVG content as string
   * @param scalingFactor Optional scaling factor
   * @param dxfFlag Whether this is a converted DXF file
   * @returns Array of parts extracted from the SVG
   */
  importsvg(
    filename: string | null,
    dirpath: string | null,
    svgstring: string,
    scalingFactor?: number | null,
    dxfFlag?: boolean
  ): Part[];

  /**
   * Get or set configuration
   * @param config Optional config to set
   * @returns Current configuration
   */
  config(config?: Partial<DeepNestConfig>): DeepNestConfig;

  /**
   * Start the nesting process
   * @param progressCallback Called on progress updates
   * @param displayCallback Called when new placement is ready
   */
  start(
    progressCallback: ((progress: { index: number; progress: number }) => void) | null,
    displayCallback: (() => void) | null
  ): void;

  /**
   * Stop the nesting process
   */
  stop(): void;

  /**
   * Reset nesting state
   */
  reset(): void;
}

/**
 * Minimal Ractive instance interface for window.nest
 */
export interface RactiveInstance {
  /** Update the view */
  update(keypath?: string): Promise<void>;
}

/**
 * SvgParser instance interface for window.SvgParser
 */
export interface SvgParserInstance {
  /** Load and parse SVG content */
  load(dirpath: string | null, svgstring: string, scale: number, scalingFactor?: number | null): SVGSVGElement;
  /** Clean input SVG for nesting */
  cleanInput(dxfFlag?: boolean): SVGSVGElement;
  /** Supported polygon element types */
  polygonElements: string[];
  /** Check if an element forms a closed path */
  isClosed(element: SVGElement, tolerance: number): boolean;
  /** Convert element to polygon points */
  polygonify(element: SVGElement): PolygonPoint[];
  /** Configure parser options */
  config(options: { tolerance: number; endpointTolerance?: number }): void;
}

declare global {
  interface Window {
    /**
     * Configuration service with electron-settings style interface
     * Provides getSync/setSync methods for configuration management
     */
    config: ConfigObject;

    /**
     * DeepNest core nesting engine instance
     * Manages parts, sheets, and nesting operations
     */
    DeepNest: DeepNestInstance;

    /**
     * Ractive instance for nest result display
     * Used for UI updates after nesting operations
     */
    nest: RactiveInstance;

    /**
     * SVG parser utility for importing and processing SVG files
     */
    SvgParser: SvgParserInstance;

    /**
     * Reference to OAuth login popup window (if open)
     */
    loginWindow: Window | null;
  }
}
