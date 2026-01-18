/**
 * Sheet Dialog Component
 * Handles the add sheet dialog for creating rectangular sheets.
 * Extracted from page.js (lines 928-982)
 */

import type {
  DeepNestInstance,
  ConfigObject,
  RactiveInstance,
  PartsViewData,
} from "../types/index.js";
import {
  getElement,
  createSvgElement,
  setAttributes,
  addClass,
  removeClass,
} from "../utils/dom-utils.js";

/**
 * DOM element selectors used by the sheet dialog component
 */
const SELECTORS = {
  /** Add sheet button that opens the dialog */
  ADD_SHEET_BTN: "#addsheet",
  /** Cancel button to close the dialog */
  CANCEL_SHEET_BTN: "#cancelsheet",
  /** Confirm button to create the sheet */
  CONFIRM_SHEET_BTN: "#confirmsheet",
  /** Sheet dialog container (parts tools area) */
  PARTS_TOOLS: "#partstools",
  /** Sheet width input field */
  SHEET_WIDTH_INPUT: "#sheetwidth",
  /** Sheet height input field */
  SHEET_HEIGHT_INPUT: "#sheetheight",
} as const;

/**
 * CSS classes used by the sheet dialog
 */
const CSS_CLASSES = {
  /** Active state for showing the dialog */
  ACTIVE: "active",
  /** Error state for invalid input */
  ERROR: "error",
  /** Class for sheet SVG elements */
  SHEET: "sheet",
} as const;

/**
 * Conversion factor from inches to millimeters
 */
const INCHES_TO_MM = 25.4;

/**
 * Callback type for resize function
 * Called after a sheet is added to resize UI elements
 */
export type ResizeCallback = () => void;

/**
 * Callback type for updating the parts list
 */
export type UpdatePartsCallback = () => void;

/**
 * Options for SheetDialog initialization
 */
export interface SheetDialogOptions {
  /** DeepNest instance for importing the sheet */
  deepNest: DeepNestInstance;
  /** Configuration object for units and scale */
  config: ConfigObject;
  /** Ractive instance for updating the parts list */
  ractive?: RactiveInstance<PartsViewData>;
  /** Callback to resize UI elements after adding a sheet */
  resizeCallback?: ResizeCallback;
  /** Callback to update parts list (alternative to ractive) */
  updatePartsCallback?: UpdatePartsCallback;
}

/**
 * Sheet Dialog Service class
 * Manages the add sheet dialog for creating rectangular sheets (bins)
 */
export class SheetDialogService {
  /** DeepNest instance */
  private deepNest: DeepNestInstance;

  /** Configuration object */
  private config: ConfigObject;

  /** Ractive instance for parts list */
  private ractive: RactiveInstance<PartsViewData> | null = null;

  /** Callback to resize UI elements */
  private resizeCallback: ResizeCallback | null = null;

  /** Callback to update parts list */
  private updatePartsCallback: UpdatePartsCallback | null = null;

  /** Flag to track if service has been initialized */
  private initialized = false;

  /**
   * Create a new SheetDialogService instance
   * @param options - Configuration options
   */
  constructor(options: SheetDialogOptions) {
    this.deepNest = options.deepNest;
    this.config = options.config;

    if (options.ractive) {
      this.ractive = options.ractive;
    }
    if (options.resizeCallback) {
      this.resizeCallback = options.resizeCallback;
    }
    if (options.updatePartsCallback) {
      this.updatePartsCallback = options.updatePartsCallback;
    }
  }

  /**
   * Set the Ractive instance for updating parts list
   * @param ractive - The Ractive instance
   */
  setRactive(ractive: RactiveInstance<PartsViewData>): void {
    this.ractive = ractive;
  }

  /**
   * Set the resize callback function
   * @param callback - Function to call when resize is needed
   */
  setResizeCallback(callback: ResizeCallback): void {
    this.resizeCallback = callback;
  }

  /**
   * Set the update parts callback function
   * @param callback - Function to call to update parts list
   */
  setUpdatePartsCallback(callback: UpdatePartsCallback): void {
    this.updatePartsCallback = callback;
  }

  /**
   * Open the add sheet dialog
   * Shows the parts tools area with the sheet input form
   */
  openDialog(): void {
    const partsTools = getElement<HTMLElement>(SELECTORS.PARTS_TOOLS);
    if (partsTools) {
      addClass(partsTools, CSS_CLASSES.ACTIVE);
    }
  }

  /**
   * Close the add sheet dialog
   * Hides the parts tools area
   */
  closeDialog(): void {
    const partsTools = getElement<HTMLElement>(SELECTORS.PARTS_TOOLS);
    if (partsTools) {
      removeClass(partsTools, CSS_CLASSES.ACTIVE);
    }
  }

  /**
   * Get the conversion factor based on current units and scale
   * @returns The conversion factor to apply to input dimensions
   */
  private getConversionFactor(): number {
    const units = this.config.getSync("units");
    let conversion = this.config.getSync("scale");

    // Scale is stored in units/inch, so convert for mm
    if (units === "mm") {
      conversion /= INCHES_TO_MM;
    }

    return conversion;
  }

  /**
   * Validate a dimension input
   * @param input - The input element to validate
   * @returns True if valid, false otherwise
   */
  private validateInput(input: HTMLInputElement): boolean {
    const value = Number(input.value);
    if (value <= 0 || isNaN(value)) {
      addClass(input, CSS_CLASSES.ERROR);
      return false;
    }
    removeClass(input, CSS_CLASSES.ERROR);
    return true;
  }

  /**
   * Clear the input fields and remove error states
   */
  private clearInputs(): void {
    const widthInput = getElement<HTMLInputElement>(SELECTORS.SHEET_WIDTH_INPUT);
    const heightInput = getElement<HTMLInputElement>(SELECTORS.SHEET_HEIGHT_INPUT);

    if (widthInput) {
      removeClass(widthInput, CSS_CLASSES.ERROR);
      widthInput.value = "";
    }
    if (heightInput) {
      removeClass(heightInput, CSS_CLASSES.ERROR);
      heightInput.value = "";
    }
  }

  /**
   * Create a rectangular sheet SVG
   * @param width - Sheet width in SVG units
   * @param height - Sheet height in SVG units
   * @returns Serialized SVG string
   */
  private createSheetSvg(width: number, height: number): string {
    const svg = createSvgElement("svg");
    const rect = createSvgElement("rect");

    setAttributes(rect, {
      x: "0",
      y: "0",
      width: String(width),
      height: String(height),
      class: CSS_CLASSES.SHEET,
    });

    svg.appendChild(rect);

    return new XMLSerializer().serializeToString(svg);
  }

  /**
   * Add a new sheet with the specified dimensions
   * @param width - Sheet width in user units (mm or inches)
   * @param height - Sheet height in user units (mm or inches)
   * @returns True if the sheet was added successfully
   */
  addSheet(width: number, height: number): boolean {
    if (width <= 0 || height <= 0) {
      return false;
    }

    const conversion = this.getConversionFactor();
    const svgWidth = width * conversion;
    const svgHeight = height * conversion;

    const svgString = this.createSheetSvg(svgWidth, svgHeight);

    // Import the SVG as a sheet
    const parts = this.deepNest.importsvg(null, null, svgString);
    if (parts.length > 0) {
      const sheet = parts[0];
      sheet.sheet = true;
    }

    return true;
  }

  /**
   * Handle the confirm button click
   * Validates inputs, creates the sheet, and updates the UI
   * @returns False to prevent default behavior, undefined otherwise
   */
  handleConfirm(): boolean | undefined {
    const widthInput = getElement<HTMLInputElement>(SELECTORS.SHEET_WIDTH_INPUT);
    const heightInput = getElement<HTMLInputElement>(SELECTORS.SHEET_HEIGHT_INPUT);

    if (!widthInput || !heightInput) {
      return false;
    }

    // Validate width
    if (!this.validateInput(widthInput)) {
      return false;
    }

    // Validate height
    if (!this.validateInput(heightInput)) {
      return false;
    }

    const width = Number(widthInput.value);
    const height = Number(heightInput.value);

    // Add the sheet
    const success = this.addSheet(width, height);

    if (success) {
      // Clear inputs and close dialog
      this.clearInputs();
      this.closeDialog();

      // Update the parts list
      if (this.ractive) {
        this.ractive.update("parts");
      }
      if (this.updatePartsCallback) {
        this.updatePartsCallback();
      }

      // Resize if needed
      if (this.resizeCallback) {
        this.resizeCallback();
      }
    }

    return false;
  }

  /**
   * Bind event handlers to dialog buttons
   * Call this after the DOM is ready
   */
  bindEventHandlers(): void {
    if (this.initialized) {
      return;
    }

    // Add sheet button - opens dialog
    const addSheetBtn = getElement<HTMLElement>(SELECTORS.ADD_SHEET_BTN);
    if (addSheetBtn) {
      addSheetBtn.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        this.openDialog();
      });
    }

    // Cancel button - closes dialog
    const cancelBtn = getElement<HTMLElement>(SELECTORS.CANCEL_SHEET_BTN);
    if (cancelBtn) {
      cancelBtn.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        this.closeDialog();
      });
    }

    // Confirm button - creates sheet
    const confirmBtn = getElement<HTMLElement>(SELECTORS.CONFIRM_SHEET_BTN);
    if (confirmBtn) {
      confirmBtn.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        this.handleConfirm();
      });
    }

    this.initialized = true;
  }

  /**
   * Initialize the sheet dialog service
   * Sets up event handlers for dialog buttons
   */
  initialize(): void {
    this.bindEventHandlers();
  }

  /**
   * Check if the dialog is currently open
   * @returns True if the dialog is open
   */
  isOpen(): boolean {
    const partsTools = getElement<HTMLElement>(SELECTORS.PARTS_TOOLS);
    return partsTools?.classList.contains(CSS_CLASSES.ACTIVE) ?? false;
  }

  /**
   * Create and return a new SheetDialogService instance
   * @param options - Configuration options
   * @returns New SheetDialogService instance
   */
  static create(options: SheetDialogOptions): SheetDialogService {
    return new SheetDialogService(options);
  }
}

/**
 * Factory function to create a sheet dialog service
 * @param options - Configuration options
 * @returns New SheetDialogService instance
 */
export function createSheetDialogService(
  options: SheetDialogOptions
): SheetDialogService {
  return SheetDialogService.create(options);
}

/**
 * Initialize sheet dialog with a simple functional API
 * For use cases where a full service instance is not needed
 *
 * @param deepNest - DeepNest instance
 * @param config - Configuration object
 * @param ractive - Optional Ractive instance for parts list
 * @param resizeCallback - Optional resize callback
 * @returns The initialized SheetDialogService instance
 *
 * @example
 * // Simple initialization
 * const sheetDialog = initializeSheetDialog(
 *   window.DeepNest,
 *   window.config,
 *   ractive,
 *   () => resize()
 * );
 *
 * // Later, open the dialog programmatically
 * sheetDialog.openDialog();
 *
 * // Or add a sheet directly
 * sheetDialog.addSheet(300, 200); // 300x200 in current units
 */
export function initializeSheetDialog(
  deepNest: DeepNestInstance,
  config: ConfigObject,
  ractive?: RactiveInstance<PartsViewData>,
  resizeCallback?: ResizeCallback
): SheetDialogService {
  const service = new SheetDialogService({
    deepNest,
    config,
    ractive,
    resizeCallback,
  });
  service.initialize();
  return service;
}
