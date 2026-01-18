/**
 * Parts View Component
 * Ractive-based parts list with selection, sorting, and deletion functionality.
 * Extracted from page.js (lines 421-714)
 */

import type {
  Part,
  ImportedFile,
  Bounds,
  DeepNestInstance,
  ConfigObject,
  SvgPanZoomInstance,
} from "../types/index.js";
import {
  getElement,
  getElements,
  createSvgElement,
  serializeSvg,
  removeFromParent,
  setAttributes,
} from "../utils/dom-utils.js";
import { throttle } from "../utils/ui-helpers.js";

/**
 * Ractive event object with original DOM event
 */
interface RactiveEvent {
  original: MouseEvent;
}

/**
 * Ractive instance interface for parts view
 * More specific than the general RactiveInstance to handle custom events
 */
interface PartsViewRactiveInstance {
  /** Update a specific keypath */
  update(keypath?: string): Promise<void>;
  /** Get a value from the data context */
  get<K extends keyof PartsViewData>(keypath: K): PartsViewData[K];
  /** Set a value in the data context */
  set<K extends keyof PartsViewData>(keypath: K, value: PartsViewData[K]): Promise<void>;
  /** Register an event handler with Ractive-specific event signature */
  on(
    eventName: string,
    handler: (event: RactiveEvent, ...args: unknown[]) => boolean | void
  ): void;
}

/**
 * Declare Ractive as a global variable available in the Electron context
 */
declare const Ractive: {
  DEBUG: boolean;
  extend(options: RactiveExtendOptions): RactiveComponentConstructor;
  new (options: RactiveOptions): PartsViewRactiveInstance;
};

/**
 * Declare svgPanZoom as a global function available in the Electron context
 */
declare function svgPanZoom(
  selector: string,
  options: SvgPanZoomOptions
): SvgPanZoomInstance;

/**
 * Options for Ractive.extend
 */
interface RactiveExtendOptions {
  template: string;
  computed?: Record<string, () => unknown>;
}

/**
 * Constructor returned by Ractive.extend
 */
type RactiveComponentConstructor = new () => unknown;

/**
 * Options for creating a Ractive instance
 */
interface RactiveOptions {
  el: string;
  template: string;
  data: PartsViewData;
  computed?: Record<string, () => unknown>;
  components?: Record<string, RactiveComponentConstructor>;
}

/**
 * Options for svgPanZoom initialization
 */
interface SvgPanZoomOptions {
  zoomEnabled: boolean;
  controlIconsEnabled: boolean;
  fit: boolean;
  center: boolean;
  maxZoom: number;
  minZoom: number;
}

/**
 * Ractive component data interface for parts list
 */
interface PartsViewData {
  parts: Part[];
  imports: ImportedFile[];
  getSelected: () => Part[];
  getSheets: () => Part[];
  serializeSvg: (svg: SVGElement) => string;
  partrenderer: (part: Part) => string;
}

/**
 * DOM element selectors used by the parts view component
 */
const SELECTORS = {
  /** Container for the parts list */
  HOME_CONTENT: "#homecontent",
  /** Template for the parts list */
  TEMPLATE_PART_LIST: "#template-part-list",
  /** Table headers for sorting */
  PARTS_TABLE_HEADERS: "#parts table thead th",
  /** Parts container */
  PARTS_CONTAINER: "#parts",
  /** Parts table */
  PARTS_TABLE: "#parts table",
} as const;

/**
 * CSS classes used by the parts view
 */
const CSS_CLASSES = {
  ACTIVE: "active",
  ASC: "asc",
  DESC: "desc",
} as const;

/**
 * Data attributes used for sorting
 */
const DATA_ATTRIBUTES = {
  SORT_FIELD: "data-sort-field",
} as const;

/**
 * Resize callback type
 */
export type ResizeCallback = (event?: { rect: { width: number } }) => void;

/**
 * Options for PartsView initialization
 */
export interface PartsViewOptions {
  /** DeepNest instance for accessing parts and imports */
  deepNest: DeepNestInstance;
  /** Configuration object */
  config: ConfigObject;
  /** Callback to resize the parts list */
  resizeCallback?: ResizeCallback;
}

/**
 * Parts View Service class
 * Manages the Ractive-based parts list with selection, sorting, and deletion
 */
export class PartsViewService {
  /** DeepNest instance */
  private deepNest: DeepNestInstance;

  /** Configuration object */
  private config: ConfigObject;

  /** Main Ractive instance for parts list */
  private ractive: PartsViewRactiveInstance | null = null;

  /** Dimension label Ractive component */
  private labelComponent: RactiveComponentConstructor | null = null;

  /** Tracks if mouse button is currently down */
  private mouseDown = 0;

  /** Throttled update function */
  private throttledUpdate: (() => void) | null = null;

  /** Resize callback */
  private resizeCallback: ResizeCallback | null = null;

  /** Flag to track if service has been initialized */
  private initialized = false;

  /**
   * Create a new PartsViewService instance
   * @param options - Configuration options
   */
  constructor(options: PartsViewOptions) {
    this.deepNest = options.deepNest;
    this.config = options.config;
    if (options.resizeCallback) {
      this.resizeCallback = options.resizeCallback;
    }
  }

  /**
   * Set the resize callback function
   * @param callback - Function to call when resize is needed
   */
  setResizeCallback(callback: ResizeCallback): void {
    this.resizeCallback = callback;
  }

  /**
   * Create the dimension label Ractive component
   * This component displays part dimensions in the current unit system
   */
  private createLabelComponent(): RactiveComponentConstructor {
    const config = this.config;

    return Ractive.extend({
      template: "{{label}}",
      computed: {
        label: function (this: {
          get: (key: string) => Bounds | string;
        }): string {
          const bounds = this.get("bounds") as Bounds;
          const width = bounds.width;
          const height = bounds.height;
          const units = config.getSync("units");
          const conversion = config.getSync("scale");

          // trigger computed dependency chain
          this.get("getUnits");

          if (units === "mm") {
            return (
              ((25.4 * width) / conversion).toFixed(1) +
              "mm x " +
              ((25.4 * height) / conversion).toFixed(1) +
              "mm"
            );
          } else {
            return (
              (width / conversion).toFixed(1) +
              "in x " +
              (height / conversion).toFixed(1) +
              "in"
            );
          }
        },
      },
    });
  }

  /**
   * Toggle selection state of a part
   * @param part - The part to toggle
   */
  private togglePart(part: Part): void {
    if (part.selected) {
      part.selected = false;
      for (let i = 0; i < part.svgelements.length; i++) {
        part.svgelements[i].removeAttribute("class");
      }
    } else {
      part.selected = true;
      for (let i = 0; i < part.svgelements.length; i++) {
        part.svgelements[i].setAttribute("class", CSS_CLASSES.ACTIVE);
      }
    }
  }

  /**
   * Apply SVG pan/zoom library to the currently visible import
   */
  applyZoom(): void {
    if (this.deepNest.imports.length === 0) {
      return;
    }

    for (let i = 0; i < this.deepNest.imports.length; i++) {
      const importItem = this.deepNest.imports[i];
      if (importItem.selected) {
        // Store current pan/zoom state if exists
        let pan: { x: number; y: number } | false = false;
        let zoom: number | false = false;

        if (importItem.zoom) {
          pan = importItem.zoom.getPan();
          zoom = importItem.zoom.getZoom();
        }

        // Initialize svgPanZoom
        importItem.zoom = svgPanZoom("#import-" + i + " svg", {
          zoomEnabled: true,
          controlIconsEnabled: false,
          fit: true,
          center: true,
          maxZoom: 500,
          minZoom: 0.01,
        });

        // Restore previous state
        if (zoom !== false) {
          importItem.zoom.zoom(zoom);
        }
        if (pan !== false) {
          importItem.zoom.pan(pan);
        }

        // Set up zoom control buttons
        this.setupZoomControls(i);
      }
    }
  }

  /**
   * Set up zoom control button event listeners for an import
   * @param importIndex - Index of the import
   */
  private setupZoomControls(importIndex: number): void {
    const deepNest = this.deepNest;

    const zoomInBtn = getElement<HTMLElement>(
      `#import-${importIndex} .zoomin`
    );
    const zoomOutBtn = getElement<HTMLElement>(
      `#import-${importIndex} .zoomout`
    );
    const zoomResetBtn = getElement<HTMLElement>(
      `#import-${importIndex} .zoomreset`
    );

    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        const selectedImport = deepNest.imports.find((e) => e.selected);
        if (selectedImport?.zoom) {
          selectedImport.zoom.zoomIn();
        }
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        const selectedImport = deepNest.imports.find((e) => e.selected);
        if (selectedImport?.zoom) {
          selectedImport.zoom.zoomOut();
        }
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        const selectedImport = deepNest.imports.find((e) => e.selected);
        if (selectedImport?.zoom) {
          selectedImport.zoom.resetZoom().resetPan();
        }
      });
    }
  }

  /**
   * Delete all selected parts
   */
  deleteParts(): void {
    for (let i = 0; i < this.deepNest.parts.length; i++) {
      if (this.deepNest.parts[i].selected) {
        // Remove SVG elements from DOM
        for (let j = 0; j < this.deepNest.parts[i].svgelements.length; j++) {
          const node = this.deepNest.parts[i].svgelements[j];
          removeFromParent(node);
        }
        // Remove from parts array
        this.deepNest.parts.splice(i, 1);
        i--;
      }
    }

    // Update UI
    this.update();
    this.updateImports();

    if (this.deepNest.imports.length > 0) {
      this.applyZoom();
    }

    if (this.resizeCallback) {
      this.resizeCallback();
    }
  }

  /**
   * Attach sorting functionality to table headers
   */
  attachSort(): void {
    const headers = getElements<HTMLTableCellElement>(
      SELECTORS.PARTS_TABLE_HEADERS
    );

    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const sortField = header.getAttribute(
          DATA_ATTRIBUTES.SORT_FIELD
        ) as keyof Part | null;

        if (!sortField) {
          return;
        }

        const reverse = header.className === CSS_CLASSES.ASC;

        // Sort parts
        this.deepNest.parts.sort((a, b) => {
          const av = a[sortField];
          const bv = b[sortField];

          if (av === undefined || av === null || bv === undefined || bv === null) {
            return 0;
          }

          if (av < bv) {
            return reverse ? 1 : -1;
          }
          if (av > bv) {
            return reverse ? -1 : 1;
          }
          return 0;
        });

        // Update header classes
        headers.forEach((h) => {
          h.className = "";
        });

        header.className = reverse ? CSS_CLASSES.DESC : CSS_CLASSES.ASC;

        // Update UI
        this.update();
      });
    });
  }

  /**
   * Update the parts data in Ractive
   */
  update(): void {
    if (this.ractive) {
      this.ractive.update("parts");
    }
  }

  /**
   * Update the imports data in Ractive
   */
  updateImports(): void {
    if (this.ractive) {
      this.ractive.update("imports");
    }
  }

  /**
   * Update units-related computed properties
   */
  updateUnits(): void {
    if (this.ractive) {
      this.ractive.update("getUnits");
    }
  }

  /**
   * Initialize the Ractive instance for parts list
   */
  private initializeRactive(): void {
    // Disable Ractive debug mode
    Ractive.DEBUG = false;

    // Create label component
    this.labelComponent = this.createLabelComponent();

    const deepNest = this.deepNest;
    const config = this.config;

    // Create main Ractive instance
    this.ractive = new Ractive({
      el: SELECTORS.HOME_CONTENT,
      template: SELECTORS.TEMPLATE_PART_LIST,
      data: {
        parts: deepNest.parts,
        imports: deepNest.imports,
        getSelected: function (this: { get: (key: string) => Part[] }): Part[] {
          const parts = this.get("parts");
          return parts.filter((p) => p.selected);
        },
        getSheets: function (this: { get: (key: string) => Part[] }): Part[] {
          const parts = this.get("parts");
          return parts.filter((p) => p.sheet);
        },
        serializeSvg: function (svg: SVGElement): string {
          return serializeSvg(svg);
        },
        partrenderer: function (part: Part): string {
          const svg = createSvgElement("svg");
          setAttributes(svg, {
            width: part.bounds.width + 10 + "px",
            height: part.bounds.height + 10 + "px",
            viewBox:
              part.bounds.x -
              5 +
              " " +
              (part.bounds.y - 5) +
              " " +
              (part.bounds.width + 10) +
              " " +
              (part.bounds.height + 10),
          });

          part.svgelements.forEach((e) => {
            svg.appendChild(e.cloneNode(false));
          });

          return serializeSvg(svg);
        },
      },
      computed: {
        getUnits: function (): string {
          const units = config.getSync("units");
          return units === "mm" ? "mm" : "in";
        },
      },
      components: { dimensionLabel: this.labelComponent },
    });
  }

  /**
   * Set up mouse tracking for drag selection
   */
  private setupMouseTracking(): void {
    document.body.onmousedown = () => {
      this.mouseDown = 1;
    };
    document.body.onmouseup = () => {
      this.mouseDown = 0;
    };
  }

  /**
   * Create throttled update function
   */
  private createThrottledUpdate(): void {
    const updateFn = () => {
      this.updateImports();
      this.applyZoom();
    };

    this.throttledUpdate = throttle(updateFn, 500);
  }

  /**
   * Bind Ractive event handlers
   */
  private bindRactiveEvents(): void {
    if (!this.ractive) {
      return;
    }

    const ractive = this.ractive;
    const deepNest = this.deepNest;
    const self = this;

    // Handle part selection on click/mouseover
    ractive.on("selecthandler", function (e: RactiveEvent, ...args: unknown[]): boolean | void {
      const part = args[0] as Part;
      // Don't handle if clicking on an input
      if ((e.original.target as HTMLElement).nodeName === "INPUT") {
        return true;
      }

      if (self.mouseDown > 0 || e.original.type === "mousedown") {
        self.togglePart(part);
        ractive.update("parts");
        if (self.throttledUpdate) {
          self.throttledUpdate();
        }
      }
      return;
    });

    // Handle select all toggle
    ractive.on("selectall", function (_e: RactiveEvent) {
      const selectedCount = deepNest.parts.filter((p) => p.selected).length;
      const toggleOn = selectedCount < deepNest.parts.length;

      deepNest.parts.forEach((p) => {
        if (p.selected !== toggleOn) {
          self.togglePart(p);
        }
        p.selected = toggleOn;
      });

      ractive.update("parts");
      ractive.update("imports");

      if (deepNest.imports.length > 0) {
        self.applyZoom();
      }
    });

    // Handle import tab selection
    ractive.on("importselecthandler", function (_e: RactiveEvent, ...args: unknown[]): boolean | void {
      const im = args[0] as ImportedFile;
      if (im.selected) {
        return false;
      }

      deepNest.imports.forEach((i) => {
        i.selected = false;
      });

      im.selected = true;
      ractive.update("imports");
      self.applyZoom();
      return;
    });

    // Handle import deletion
    ractive.on("importdelete", function (_e: RactiveEvent, ...args: unknown[]) {
      const im = args[0] as ImportedFile;
      let index = deepNest.imports.indexOf(im);
      deepNest.imports.splice(index, 1);

      if (deepNest.imports.length > 0) {
        if (!deepNest.imports[index]) {
          index = 0;
        }
        deepNest.imports[index].selected = true;
      }

      ractive.update("imports");

      if (deepNest.imports.length > 0) {
        self.applyZoom();
      }
    });

    // Handle delete button/event
    ractive.on("delete", function (_e: RactiveEvent) {
      self.deleteParts();
    });
  }

  /**
   * Set up keyboard event listener for delete key
   */
  private setupKeyboardEvents(): void {
    document.body.addEventListener("keydown", (e) => {
      // Delete key (8 = backspace, 46 = delete)
      if (e.keyCode === 8 || e.keyCode === 46) {
        this.deleteParts();
      }
    });
  }

  /**
   * Initialize the parts view service
   * Sets up Ractive, event handlers, and keyboard shortcuts
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initializeRactive();
    this.setupMouseTracking();
    this.createThrottledUpdate();
    this.bindRactiveEvents();
    this.setupKeyboardEvents();

    this.initialized = true;
  }

  /**
   * Get the Ractive instance
   * @returns The Ractive instance or null if not initialized
   */
  getRactive(): PartsViewRactiveInstance | null {
    return this.ractive;
  }

  /**
   * Refresh the entire view (parts and imports)
   */
  refresh(): void {
    this.update();
    this.updateImports();
    this.attachSort();
    this.applyZoom();

    if (this.resizeCallback) {
      this.resizeCallback();
    }
  }

  /**
   * Create and return a new PartsViewService instance
   * @param options - Configuration options
   * @returns New PartsViewService instance
   */
  static create(options: PartsViewOptions): PartsViewService {
    return new PartsViewService(options);
  }
}

/**
 * Factory function to create a parts view service
 * @param options - Configuration options
 * @returns New PartsViewService instance
 */
export function createPartsViewService(
  options: PartsViewOptions
): PartsViewService {
  return PartsViewService.create(options);
}

/**
 * Initialize parts view with a simple functional API
 * For use cases where a full service instance is not needed
 *
 * @param deepNest - DeepNest instance
 * @param config - Configuration object
 * @param resizeCallback - Optional resize callback
 * @returns The initialized PartsViewService instance
 *
 * @example
 * // Simple initialization
 * const partsView = initializePartsView(window.DeepNest, window.config, resize);
 *
 * // Later, update parts
 * partsView.update();
 */
export function initializePartsView(
  deepNest: DeepNestInstance,
  config: ConfigObject,
  resizeCallback?: ResizeCallback
): PartsViewService {
  const service = new PartsViewService({ deepNest, config, resizeCallback });
  service.initialize();
  return service;
}
