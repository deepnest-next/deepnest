/**
 * Type definitions for DeepNest UI components
 * Extends core types from index.d.ts with UI-specific interfaces
 */

// Re-export core types from root index.d.ts
export type { DeepNestConfig, SheetPlacement, NestingResult } from "../../../index.d.ts";

// Import base types for extension
import type { DeepNestConfig, NestingResult } from "../../../index.d.ts";

/**
 * Extended configuration with UI-specific properties
 */
export interface UIConfig extends DeepNestConfig {
  /** OAuth access token for authenticated features */
  access_token?: string;
  /** OAuth ID token for user identification */
  id_token?: string;
  /** Enable SVG pre-processor for cleaning input files */
  useSvgPreProcessor: boolean;
  /** Extract part quantity from filename (e.g., part.3.svg = 3 copies) */
  useQuantityFromFileName: boolean;
  /** Include sheet boundary rectangles in exports */
  exportWithSheetBoundboarders: boolean;
  /** Add spacing between sheets in multi-sheet exports */
  exportWithSheetsSpace: boolean;
  /** Space value between sheets in SVG units (default: 10mm) */
  exportWithSheetsSpaceValue: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONVERSION_SERVER = "https://converter.deepnest.app/convert";

/**
 * Bounding box rectangle
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A point in a polygon with optional markers for processing
 */
export interface PolygonPoint {
  x: number;
  y: number;
  /** Marked for NFP generation or simplification */
  marked?: boolean;
  /** Point lies exactly on original polygon edge */
  exact?: boolean;
}

/**
 * A polygon represented as an array of points with optional children (holes)
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
export interface Part {
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
}

/**
 * SVG Pan/Zoom instance for import view
 */
export interface SvgPanZoomInstance {
  getPan(): { x: number; y: number };
  getZoom(): number;
  zoom(level: number): SvgPanZoomInstance;
  pan(point: { x: number; y: number }): SvgPanZoomInstance;
  zoomIn(): SvgPanZoomInstance;
  zoomOut(): SvgPanZoomInstance;
  resetZoom(): SvgPanZoomInstance;
  resetPan(): SvgPanZoomInstance;
}

/**
 * Represents an imported file in the workspace
 */
export interface ImportedFile {
  /** Original filename */
  filename: string;
  /** Root SVG element */
  svg: SVGSVGElement;
  /** True if currently selected in the imports list */
  selected?: boolean;
  /** Pan/zoom controller for the import preview */
  zoom?: SvgPanZoomInstance;
}

/**
 * Configuration object with synchronous get/set methods
 * Wraps the electron-settings style interface
 */
export interface ConfigObject extends UIConfig {
  /**
   * Get a configuration value or the entire config object
   * @param key Optional key to retrieve specific value
   * @returns The value for the key, or entire config if no key provided
   */
  getSync<K extends keyof UIConfig>(key?: K): K extends keyof UIConfig ? UIConfig[K] : UIConfig;

  /**
   * Set configuration values
   * @param keyOrObject Key to set, or object with multiple values
   * @param value Value to set (when keyOrObject is a string)
   */
  setSync<K extends keyof UIConfig>(keyOrObject: K | Partial<UIConfig>, value?: UIConfig[K]): void;

  /**
   * Reset all configuration to default values
   */
  resetToDefaultsSync(): void;
}

/**
 * Placement type options for nesting algorithm
 */
export type PlacementType = "gravity" | "box" | "convexhull";

/**
 * Unit options for measurements
 */
export type UnitType = "mm" | "inch";

/**
 * Nesting progress information from background worker
 */
export interface NestingProgress {
  /** Worker index */
  index: number;
  /** Progress value (0-1, negative means finished) */
  progress: number;
}

/**
 * Extended nesting result with selection state
 */
export interface SelectableNestingResult extends NestingResult {
  /** Whether this result is currently selected in the UI */
  selected: boolean;
  /** Utilisation percentage (0-100) */
  utilisation: number;
}

/**
 * DeepNest instance interface for window.DeepNest
 */
export interface DeepNestInstance {
  /** List of imported files */
  imports: ImportedFile[];
  /** List of all parts (including sheets) */
  parts: Part[];
  /** Nesting results */
  nests: SelectableNestingResult[];
  /** Whether nesting is currently running */
  working: boolean;

  /**
   * Import an SVG file
   * @param filename Original filename
   * @param dirpath Directory path for resolving relative image paths
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
    progressCallback: ((progress: NestingProgress) => void) | null,
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
 * Ractive component data interface for parts list
 */
export interface PartsViewData {
  parts: Part[];
  imports: ImportedFile[];
  getSelected(): Part[];
  getSheets(): Part[];
  serializeSvg(svg: SVGElement): string;
  partrenderer(part: Part): string;
}

/**
 * Ractive component data interface for nest display
 */
export interface NestViewData {
  nests: SelectableNestingResult[];
  getSelected(): SelectableNestingResult[];
  getNestedPartSources(n: SelectableNestingResult): number[];
  getColorBySource(id: number): string;
  getPartsPlaced(): string;
  getUtilisation(): string;
  getTimeSaved(): string;
}

/**
 * Ractive instance interface (minimal typing for our use)
 */
export interface RactiveInstance<T = unknown> {
  /** Update a specific keypath */
  update(keypath?: string): Promise<void>;
  /** Get a value from the data context */
  get<K extends keyof T>(keypath: K): T[K];
  /** Set a value in the data context */
  set<K extends keyof T>(keypath: K, value: T[K]): Promise<void>;
  /** Register an event handler */
  on(eventName: string, handler: (event: Event, ...args: unknown[]) => void): void;
}

/**
 * Throttle options
 */
export interface ThrottleOptions {
  /** Fire on leading edge */
  leading?: boolean;
  /** Fire on trailing edge */
  trailing?: boolean;
}

/**
 * File filter for dialog.showOpenDialog
 */
export interface FileFilter {
  name: string;
  extensions: string[];
}

/**
 * Merged line segment for laser optimization display
 */
export interface MergedSegment {
  x: number;
  y: number;
}

/**
 * Sheet placement with merged segments for display
 */
export interface SheetPlacementWithMerged {
  filename: string;
  id: number;
  rotation: number;
  source: number;
  x: number;
  y: number;
  /** Pairs of points representing merged line segments */
  mergedSegments?: [MergedSegment, MergedSegment][];
}

/**
 * Preset configuration stored in presets file
 */
export interface PresetConfig {
  [presetName: string]: string; // JSON stringified UIConfig
}

/**
 * IPC channel names used by the application
 */
export const IPC_CHANNELS = {
  LOAD_PRESETS: "load-presets",
  SAVE_PRESET: "save-preset",
  DELETE_PRESET: "delete-preset",
  READ_CONFIG: "read-config",
  WRITE_CONFIG: "write-config",
  BACKGROUND_START: "background-start",
  BACKGROUND_STOP: "background-stop",
  BACKGROUND_PROGRESS: "background-progress",
  BACKGROUND_RESPONSE: "background-response",
  SET_PLACEMENTS: "setPlacements",
} as const;

/**
 * Type for IPC channel names
 */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * SvgParser interface for window.SvgParser
 */
export interface SvgParserInstance {
  load(dirpath: string | null, svgstring: string, scale: number, scalingFactor?: number | null): SVGSVGElement;
  cleanInput(dxfFlag?: boolean): SVGSVGElement;
  polygonElements: string[];
  isClosed(element: SVGElement, tolerance: number): boolean;
  polygonify(element: SVGElement): PolygonPoint[];
  polygonifyPath(element: SVGPathElement): PolygonPoint[];
  transformParse(transformString: string): { calc(point: PolygonPoint): PolygonPoint } | null;
  applyTransform(svg: SVGSVGElement): void;
  flatten(svg: SVGSVGElement): void;
  splitLines(svg: SVGSVGElement): void;
  mergeOverlap(svg: SVGSVGElement, tolerance: number): void;
  mergeLines(svg: SVGSVGElement): void;
  config(options: { tolerance: number; endpointTolerance?: number }): void;
}

/**
 * Extended Window interface types
 * Note: The base Window interface is augmented in index.d.ts
 * These interfaces provide more detailed typing for use within the UI modules
 */
export interface ExtendedWindow {
  config: ConfigObject;
  DeepNest: DeepNestInstance;
  nest: RactiveInstance<NestViewData>;
  SvgParser: SvgParserInstance;
  loginWindow: Window | null;
}
