/**
 * Export Service
 * Handles SVG/DXF/JSON export functionality for nesting results
 * Manages file save dialogs, format conversion, and file writing
 */

import type {
  UIConfig,
  DeepNestInstance,
  SelectableNestingResult,
  Part,
  SvgParserInstance,
} from "../types/index.js";
import { DEFAULT_CONVERSION_SERVER } from "../types/index.js";
import { message } from "../utils/ui-helpers.js";

/**
 * File filter options for the save dialog
 */
interface FileFilter {
  name: string;
  extensions: string[];
}

/**
 * Save dialog options
 */
interface SaveDialogOptions {
  title: string;
  filters: FileFilter[];
}

/**
 * Dialog interface for Electron's dialog module
 */
interface ElectronDialog {
  showSaveDialogSync(options: SaveDialogOptions): string | undefined;
}

/**
 * Remote interface for Electron's remote module
 */
interface ElectronRemote {
  getGlobal(name: string): string | undefined;
}

/**
 * File system interface for Node.js fs module
 */
interface FileSystem {
  writeFileSync(path: string, data: string): void;
}

/**
 * Axios-like HTTP client interface
 */
interface HttpClient {
  post(
    url: string,
    data: Buffer,
    options: { headers: Record<string, string>; responseType: string }
  ): Promise<{ data: string }>;
}

/**
 * FormData-like interface for file upload
 */
interface FormDataLike {
  append(
    name: string,
    value: Buffer | string,
    options?: { filename?: string; contentType?: string }
  ): void;
  getBuffer(): Buffer;
  getHeaders(): Record<string, string>;
}

/**
 * FormData constructor interface
 */
interface FormDataConstructor {
  new (): FormDataLike;
}

/**
 * Config getter interface
 */
interface ConfigGetter {
  getSync<K extends keyof UIConfig>(key?: K): K extends keyof UIConfig ? UIConfig[K] : UIConfig;
}

/**
 * Placement within a sheet (matches index.d.ts SheetPlacement)
 */
interface PartPlacement {
  id: number;
  filename: string;
  source: number;
  x: number;
  y: number;
  rotation: number;
}

/**
 * Sheet with placements (matches NestingResult.placements structure)
 */
interface SheetGroup {
  sheet: number;
  sheetid: number;
  sheetplacements: PartPlacement[];
}

/**
 * Export button element interface
 */
interface ExportButtonElement extends HTMLElement {
  className: string;
}

/**
 * Export options for SVG generation
 */
export interface ExportOptions {
  /** Whether this export is for DXF conversion (affects scaling) */
  forDxfConversion?: boolean;
}

/**
 * Export file formats
 */
export type ExportFormat = "svg" | "dxf" | "json";

/**
 * File filters for export dialogs
 */
const SVG_FILE_FILTERS: FileFilter[] = [
  { name: "SVG", extensions: ["svg"] }
];

const DXF_FILE_FILTERS: FileFilter[] = [
  { name: "DXF/DWG", extensions: ["dxf", "dwg"] }
];

/**
 * Export Service class
 * Handles export operations for nesting results to various formats
 * Follows the pattern from main/deepnest.js ES6 class structure
 */
export class ExportService {
  /** Electron dialog for file save dialogs */
  private dialog: ElectronDialog | null = null;

  /** Electron remote for accessing global variables */
  private remote: ElectronRemote | null = null;

  /** Node.js file system module */
  private fs: FileSystem | null = null;

  /** HTTP client for conversion requests */
  private httpClient: HttpClient | null = null;

  /** FormData constructor for file upload */
  private FormData: FormDataConstructor | null = null;

  /** Configuration getter */
  private config: ConfigGetter | null = null;

  /** DeepNest instance for accessing parts and nests */
  private deepNest: DeepNestInstance | null = null;

  /** SvgParser instance for line merging operations */
  private svgParser: SvgParserInstance | null = null;

  /** Export button element for spinner state */
  private exportButton: ExportButtonElement | null = null;

  /** Flag to track if export is busy */
  private isExporting = false;

  /**
   * Create a new ExportService instance
   * Dependencies are injected for testability
   */
  constructor(options?: {
    dialog?: ElectronDialog;
    remote?: ElectronRemote;
    fs?: FileSystem;
    httpClient?: HttpClient;
    FormData?: FormDataConstructor;
    config?: ConfigGetter;
    deepNest?: DeepNestInstance;
    svgParser?: SvgParserInstance;
    exportButton?: ExportButtonElement;
  }) {
    if (options) {
      this.dialog = options.dialog || null;
      this.remote = options.remote || null;
      this.fs = options.fs || null;
      this.httpClient = options.httpClient || null;
      this.FormData = options.FormData || null;
      this.config = options.config || null;
      this.deepNest = options.deepNest || null;
      this.svgParser = options.svgParser || null;
      this.exportButton = options.exportButton || null;
    }
  }

  /**
   * Set the dialog module for file save dialogs
   * @param dialog - Electron dialog module
   */
  setDialog(dialog: ElectronDialog): void {
    this.dialog = dialog;
  }

  /**
   * Set the remote module for accessing globals
   * @param remote - Electron remote module
   */
  setRemote(remote: ElectronRemote): void {
    this.remote = remote;
  }

  /**
   * Set the file system module
   * @param fs - Node.js fs module
   */
  setFileSystem(fs: FileSystem): void {
    this.fs = fs;
  }

  /**
   * Set the HTTP client for conversion requests
   * @param httpClient - HTTP client (e.g., axios)
   */
  setHttpClient(httpClient: HttpClient): void {
    this.httpClient = httpClient;
  }

  /**
   * Set the FormData constructor
   * @param FormData - FormData constructor
   */
  setFormDataConstructor(FormData: FormDataConstructor): void {
    this.FormData = FormData;
  }

  /**
   * Set the configuration getter
   * @param config - Configuration object with getSync method
   */
  setConfig(config: ConfigGetter): void {
    this.config = config;
  }

  /**
   * Set the DeepNest instance
   * @param deepNest - DeepNest instance for accessing parts and nests
   */
  setDeepNest(deepNest: DeepNestInstance): void {
    this.deepNest = deepNest;
  }

  /**
   * Set the SvgParser instance for line merging operations
   * @param svgParser - SvgParser instance
   */
  setSvgParser(svgParser: SvgParserInstance): void {
    this.svgParser = svgParser;
  }

  /**
   * Set the export button element for spinner state
   * @param button - Export button element
   */
  setExportButton(button: ExportButtonElement): void {
    this.exportButton = button;
  }

  /**
   * Get the conversion server URL from config or use default
   * @returns Conversion server URL
   */
  private getConversionServerUrl(): string {
    if (!this.config) {
      return DEFAULT_CONVERSION_SERVER;
    }

    const configUrl = this.config.getSync("conversionServer");
    return configUrl || DEFAULT_CONVERSION_SERVER;
  }

  /**
   * Get the currently selected nesting result
   * @returns Selected nesting result or null if none selected
   */
  private getSelectedNest(): SelectableNestingResult | null {
    if (!this.deepNest) {
      return null;
    }

    const selected = this.deepNest.nests.filter((n) => n.selected);
    if (selected.length === 0) {
      return null;
    }

    return selected[selected.length - 1];
  }

  /**
   * Show the export button as loading
   */
  private setExportLoading(loading: boolean): void {
    if (this.exportButton) {
      if (loading) {
        this.exportButton.className = "button export spinner";
      } else {
        this.exportButton.className = "button export";
      }
    }
  }

  /**
   * Export the selected nest result to JSON file
   * Saves to the NEST_DIRECTORY as exports.json
   * @returns True if export was successful
   */
  exportToJson(): boolean {
    if (!this.remote || !this.fs || !this.deepNest) {
      return false;
    }

    const nestDirectory = this.remote.getGlobal("NEST_DIRECTORY");
    if (!nestDirectory) {
      return false;
    }

    const filePath = nestDirectory + "exports.json";

    const selected = this.getSelectedNest();
    if (!selected) {
      return false;
    }

    const fileData = JSON.stringify(selected);
    this.fs.writeFileSync(filePath, fileData);

    return true;
  }

  /**
   * Show save dialog and export to SVG
   * @returns True if export was successful
   */
  exportToSvg(): boolean {
    if (!this.dialog || !this.fs) {
      message("Export dependencies not available", true);
      return false;
    }

    let fileName = this.dialog.showSaveDialogSync({
      title: "Export deepnest SVG",
      filters: SVG_FILE_FILTERS,
    });

    if (fileName === undefined) {
      return false;
    }

    // Ensure .svg extension
    if (!fileName.toLowerCase().endsWith(".svg")) {
      fileName = fileName + ".svg";
    }

    const selected = this.getSelectedNest();
    if (!selected) {
      return false;
    }

    const svgContent = this.generateSvgExport(selected);
    this.fs.writeFileSync(fileName, svgContent);

    return true;
  }

  /**
   * Show save dialog and export to DXF via conversion server
   * @returns Promise that resolves to true if export was successful
   */
  async exportToDxf(): Promise<boolean> {
    if (!this.dialog || !this.fs || !this.httpClient || !this.FormData) {
      message("Export dependencies not available", true);
      return false;
    }

    let fileName = this.dialog.showSaveDialogSync({
      title: "Export deepnest DXF",
      filters: DXF_FILE_FILTERS,
    });

    if (fileName === undefined) {
      return false;
    }

    // Ensure .dxf or .dwg extension
    if (!fileName.toLowerCase().endsWith(".dxf") && !fileName.toLowerCase().endsWith(".dwg")) {
      fileName = fileName + ".dxf";
    }

    const selected = this.getSelectedNest();
    if (!selected) {
      return false;
    }

    const url = this.getConversionServerUrl();
    this.setExportLoading(true);

    try {
      // Generate SVG with DXF scaling
      const svgContent = this.generateSvgExport(selected, { forDxfConversion: true });

      const formData = new this.FormData();
      formData.append("fileUpload", Buffer.from(svgContent), {
        filename: "deepnest.svg",
        contentType: "image/svg+xml",
      });
      formData.append("format", "dxf");

      const response = await this.httpClient.post(url, formData.getBuffer(), {
        headers: formData.getHeaders(),
        responseType: "text",
      });

      const body = response.data;

      // Check for error responses
      if (body.substring(0, 5) === "error") {
        message(body, true);
        return false;
      }

      if (body.includes('"error"') && body.includes('"error_id"')) {
        const jsonErr = JSON.parse(body) as { error_id: string };
        message(
          `There was an Error while converting: ${jsonErr.error_id}<br>Please use this code to open an issue on github.com/deepnest-next/deepnest`,
          true
        );
        return false;
      }

      this.fs.writeFileSync(fileName, body);
      return true;
    } catch (err) {
      const error = err as { response?: { data: string }; message: string };
      const errorData = error.response?.data || error.message;

      if (
        typeof errorData === "string" &&
        errorData.includes('"error"') &&
        errorData.includes('"error_id"')
      ) {
        const jsonErr = JSON.parse(errorData) as { error_id: string };
        message(
          `There was an Error while converting: ${jsonErr.error_id}<br>Please use this code to open an issue on github.com/deepnest-next/deepnest`,
          true
        );
      } else {
        message(
          `Could not contact file conversion server: ${JSON.stringify(err)}<br>Please use this code to open an issue on github.com/deepnest-next/deepnest`,
          true
        );
      }
      return false;
    } finally {
      this.setExportLoading(false);
    }
  }

  /**
   * Generate SVG content from a nesting result
   * Core function that builds the SVG document from placements
   * @param nestResult - The nesting result to export
   * @param options - Export options
   * @returns SVG content as string
   */
  generateSvgExport(
    nestResult: SelectableNestingResult,
    options: ExportOptions = {}
  ): string {
    if (!this.deepNest || !this.config) {
      throw new Error("DeepNest or config not available");
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let svgWidth = 0;
    let svgHeight = 0;
    let sheetNumber = 0;

    const parts = this.deepNest.parts;
    const exportWithSheetBoundaries = !!this.config.getSync("exportWithSheetBoundboarders");
    const exportWithSheetsSpace = !!this.config.getSync("exportWithSheetsSpace");
    const exportWithSheetsSpaceValue = this.config.getSync("exportWithSheetsSpaceValue") || 0;

    // Process each sheet placement
    (nestResult.placements as SheetGroup[]).forEach((s) => {
      sheetNumber++;

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      svg.appendChild(group);

      // Add sheet boundary if configured
      if (exportWithSheetBoundaries) {
        this.addSheetBoundary(group, parts[s.sheet]);
      }

      const sheetBounds = parts[s.sheet].bounds;

      // Position the group
      group.setAttribute(
        "transform",
        `translate(${-sheetBounds.x} ${svgHeight - sheetBounds.y})`
      );

      // Track maximum width
      if (svgWidth < sheetBounds.width) {
        svgWidth = sheetBounds.width;
      }

      // Add each part placement
      s.sheetplacements.forEach((p) => {
        const part = parts[p.source];
        const partGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // Clone all SVG elements from the part
        part.svgelements.forEach((e) => {
          const node = e.cloneNode(false) as Element;

          // Handle image elements with relative paths
          if (node.tagName === "image") {
            const relPath = node.getAttribute("data-href");
            if (relPath) {
              node.setAttribute("href", relPath);
            }
            node.removeAttribute("data-href");
          }

          partGroup.appendChild(node);
        });

        group.appendChild(partGroup);

        // Position and rotate the part
        partGroup.setAttribute(
          "transform",
          `translate(${p.x} ${p.y}) rotate(${p.rotation})`
        );
        partGroup.setAttribute("id", String(p.id));
      });

      // Update height for next sheet
      svgHeight += sheetBounds.height;

      // Add spacing between sheets (except after last sheet)
      if (exportWithSheetsSpace && sheetNumber < (nestResult.placements as SheetGroup[]).length) {
        svgHeight += exportWithSheetsSpaceValue;
      }
    });

    // Calculate final dimensions with scaling
    this.applyDimensions(svg, svgWidth, svgHeight, options);

    // Apply line merging if configured
    this.applyLineMerging(svg, nestResult);

    return new XMLSerializer().serializeToString(svg);
  }

  /**
   * Add sheet boundary to a group
   * @param group - SVG group element
   * @param sheetPart - Part representing the sheet
   */
  private addSheetBoundary(group: SVGGElement, sheetPart: Part): void {
    sheetPart.svgelements.forEach((e) => {
      const node = e.cloneNode(false) as SVGElement;
      node.setAttribute("stroke", "#00ff00");
      node.setAttribute("fill", "none");
      group.appendChild(node);
    });
  }

  /**
   * Apply dimensions and viewBox to the SVG element
   * @param svg - SVG element
   * @param width - Content width in SVG units
   * @param height - Content height in SVG units
   * @param options - Export options
   */
  private applyDimensions(
    svg: SVGSVGElement,
    width: number,
    height: number,
    options: ExportOptions
  ): void {
    if (!this.config) {
      return;
    }

    let scale = this.config.getSync("scale");

    // Apply DXF export scale if converting to DXF
    if (options.forDxfConversion) {
      const dxfExportScale = Number(this.config.getSync("dxfExportScale")) || 1;
      scale /= dxfExportScale;
    }

    // Convert scale based on units
    const units = this.config.getSync("units");
    if (units === "mm") {
      scale /= 25.4;
    }

    // Set dimensions with unit suffix
    const unitSuffix = units === "inch" ? "in" : "mm";
    svg.setAttribute("width", `${width / scale}${unitSuffix}`);
    svg.setAttribute("height", `${height / scale}${unitSuffix}`);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  /**
   * Apply line merging optimization if configured
   * @param svg - SVG element
   * @param nestResult - Nesting result with merged length info
   */
  private applyLineMerging(
    svg: SVGSVGElement,
    nestResult: SelectableNestingResult
  ): void {
    if (!this.config || !this.svgParser) {
      return;
    }

    const mergeLines = this.config.getSync("mergeLines");
    const mergedLength = (nestResult as unknown as { mergedLength?: number }).mergedLength;

    if (mergeLines && mergedLength && mergedLength > 0) {
      const curveTolerance = this.config.getSync("curveTolerance");

      // Apply SVG processing for line optimization
      this.svgParser.applyTransform(svg);
      this.svgParser.flatten(svg);
      this.svgParser.splitLines(svg);
      this.svgParser.mergeOverlap(svg, 0.1 * curveTolerance);
      this.svgParser.mergeLines(svg);

      // Set stroke and fill for all non-group, non-image elements
      const elements = Array.prototype.slice.call(svg.children) as Element[];
      elements.forEach((e) => {
        if (e.tagName !== "g" && e.tagName !== "image") {
          e.setAttribute("fill", "none");
          e.setAttribute("stroke", "#000000");
        }
      });
    }
  }

  /**
   * Export to the specified format
   * @param format - Export format (svg, dxf, or json)
   * @returns Promise that resolves to true if export was successful
   */
  async export(format: ExportFormat): Promise<boolean> {
    if (this.isExporting) {
      return false;
    }

    this.isExporting = true;

    try {
      switch (format) {
        case "svg":
          return this.exportToSvg();
        case "dxf":
          return await this.exportToDxf();
        case "json":
          return this.exportToJson();
        default:
          message(`Unsupported export format: ${format}`, true);
          return false;
      }
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Check if export is currently in progress
   * @returns True if exporting
   */
  isExportInProgress(): boolean {
    return this.isExporting;
  }

  /**
   * Check if there is a selected nest result available for export
   * @returns True if a nest result is selected
   */
  hasSelectedNest(): boolean {
    return this.getSelectedNest() !== null;
  }

  /**
   * Get supported export formats
   * @returns Array of supported format strings
   */
  static getSupportedFormats(): ExportFormat[] {
    return ["svg", "dxf", "json"];
  }

  /**
   * Get file filters for a specific format
   * @param format - Export format
   * @returns Array of file filters
   */
  static getFileFilters(format: ExportFormat): FileFilter[] {
    switch (format) {
      case "svg":
        return [...SVG_FILE_FILTERS];
      case "dxf":
        return [...DXF_FILE_FILTERS];
      default:
        return [];
    }
  }

  /**
   * Create and return a new ExportService instance
   * @param options - Optional configuration options
   * @returns New ExportService instance
   */
  static create(options?: ConstructorParameters<typeof ExportService>[0]): ExportService {
    return new ExportService(options);
  }
}

/**
 * Factory function to create an export service
 * @param options - Optional configuration options
 * @returns New ExportService instance
 */
export function createExportService(
  options?: ConstructorParameters<typeof ExportService>[0]
): ExportService {
  return ExportService.create(options);
}
