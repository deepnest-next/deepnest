/*!
 * SvgParser
 * A library to convert an SVG string to parse-able segments for CAD/CAM use
 * Licensed under the MIT license
 */

// Polyfill for DOMParser will be handled at runtime

// Type definitions
interface SvgParserConfig {
  /** Maximum bound for bezier->line segment conversion, in native SVG units */
  tolerance: number;
  /** Fudge factor for browser inaccuracy in SVG unit handling */
  toleranceSvg: number;
  /** Scale factor for unit conversion */
  scale: number;
  /** Tolerance for endpoint matching */
  endpointTolerance: number;
}

/** Supported SVG units for scaling calculations */
type SvgUnit = 'in' | 'mm' | 'cm' | 'pt' | 'pc' | 'px';

/** Unit conversion factors to pixels per inch */
const UNIT_CONVERSION_FACTORS: Record<SvgUnit, number> = {
  in: 1,      // inches (base unit)
  mm: 25.4,   // millimeters to inches
  cm: 2.54,   // centimeters to inches  
  pt: 72,     // points to inches
  pc: 6,      // picas to inches
  px: 96      // CSS pixels to inches
};

/**
 * SVG Parser class for converting SVG strings to geometric data for CAD/CAM applications
 */
export class SvgParser {
  /** The SVG document */
  private svg: Document | undefined;
  
  /** The top level SVG element of the SVG document */
  private svgRoot: SVGElement | undefined;
  
  /** Configuration settings */
  private conf: SvgParserConfig;
  
  /** Directory path for resolving relative image paths */
  private dirPath: string | null;

  /**
   * Creates a new SvgParser instance with default configuration
   */
  constructor() {
    this.svg = undefined;
    this.svgRoot = undefined;
    this.dirPath = null;
    
    this.conf = {
      tolerance: 2, // max bound for bezier->line segment conversion, in native SVG units
      toleranceSvg: 0.01, // fudge factor for browser inaccuracy in SVG unit handling
      scale: 72,
      endpointTolerance: 2
    };
  }

  /**
   * Updates the parser configuration
   * @param config - Configuration object with tolerance and endpointTolerance
   */
  config(config: Partial<Pick<SvgParserConfig, 'tolerance' | 'endpointTolerance'>>): void {
    if (config.tolerance !== undefined) {
      this.conf.tolerance = Number(config.tolerance);
    }
    if (config.endpointTolerance !== undefined) {
      this.conf.endpointTolerance = Number(config.endpointTolerance);
    }
  }

  /**
   * Loads and parses an SVG string with scaling and unit conversion
   * @param dirpath - Directory path for resolving relative image paths
   * @param svgString - The SVG string to parse
   * @param scale - Target scale factor for the SVG
   * @param scalingFactor - Optional additional scaling factor
   * @returns The root SVG element or undefined if parsing fails
   * @throws Error if svgString is invalid
   */
  load(dirpath: string | null, svgString: string, scale: number, scalingFactor?: number): SVGElement | undefined {
    // Validate input
    if (!svgString || typeof svgString !== 'string') {
      throw new Error('invalid SVG string');
    }

    // Handle Inkscape SVGs opened and saved in Illustrator
    // They may fail due to missing inkscape xmlns declaration
    if (/inkscape/.test(svgString) && !/xmlns:inkscape/.test(svgString)) {
      svgString = svgString.replace(/xmlns=/i, ' xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns=');
    }

    // Parse the SVG string
    const parser = new DOMParser();
    const svg = parser.parseFromString(svgString, "image/svg+xml");
    this.dirPath = dirpath;

    // Check for parsing errors
    const failed = svg.documentElement.nodeName.indexOf('parsererror') > -1;
    if (failed) {
      console.log('svg DOM parsing error: ' + svg.documentElement.nodeName);
    }

    if (svg) {
      // Get the root SVG element
      const root = svg.firstElementChild as SVGElement;

      this.svg = svg;
      this.svgRoot = root;

      // Get scaling information from SVG attributes
      const width = root.getAttribute('width');
      const viewBox = root.getAttribute('viewBox');
      let transform = root.getAttribute('transform') || '';

      // Handle cases where width or viewBox are missing
      if (!width || !viewBox) {
        if (!scalingFactor) {
          return this.svgRoot;
        } else {
          // Apply absolute scaling
          transform += ' scale(' + scalingFactor + ')';
          root.setAttribute('transform', transform);
          this.conf.scale *= scalingFactor;
          return this.svgRoot;
        }
      }

      // Parse width and viewBox
      const trimmedWidth = width.trim();
      const viewBoxValues = viewBox.trim().split(/[\s,]+/);

      if (!trimmedWidth || viewBoxValues.length < 4) {
        return this.svgRoot;
      }

      const pxwidth = parseFloat(viewBoxValues[2]);

      // Calculate local scale factor based on detected units
      let localscale = this.calculateLocalScale(trimmedWidth, pxwidth);

      // Apply additional scaling factors
      if (localscale === null) {
        localscale = scalingFactor || null;
      } else if (scalingFactor) {
        localscale *= scalingFactor;
      }

      // Handle case where no scaling factor can be determined
      if (localscale === null) {
        console.log('no scale');
        return this.svgRoot;
      }

      // Apply final scaling transformation
      transform = root.getAttribute('transform') || '';
      transform += ' scale(' + (scale / localscale) + ')';
      root.setAttribute('transform', transform);

      this.conf.scale *= scale / localscale;
    }

    return this.svgRoot;
  }

  /**
   * Calculates the local scale factor based on the width attribute and its units
   * @param width - The width attribute value (e.g., "100mm", "5in")
   * @param pxwidth - The pixel width from the viewBox
   * @returns The calculated scale factor or null if units are not recognized
   */
  private calculateLocalScale(width: string, pxwidth: number): number | null {
    // Extract numeric value from width string
    const numericValue = Number(width.replace(/[^0-9\.]/g, ''));
    
    // Check each supported unit type
    for (const [unit, conversionFactor] of Object.entries(UNIT_CONVERSION_FACTORS)) {
      if (new RegExp(unit).test(width)) {
        return (conversionFactor * pxwidth) / numericValue;
      }
    }
    
    // Return null if no recognized unit is found
    return null;
  }

  /**
   * Gets the parsed SVG document
   * @returns The SVG document or undefined if not loaded
   */
  get document(): Document | undefined {
    return this.svg;
  }

  /**
   * Gets the root SVG element
   * @returns The root SVG element or undefined if not loaded
   */
  get root(): SVGElement | undefined {
    return this.svgRoot;
  }

  /**
   * Gets the current directory path
   * @returns The directory path or null if not set
   */
  get directoryPath(): string | null {
    return this.dirPath;
  }

  // Remaining methods will be converted in subsequent steps...
}