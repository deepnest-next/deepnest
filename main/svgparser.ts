/*!
 * SvgParser
 * A library to convert an SVG string to parse-able segments for CAD/CAM use
 * Licensed under the MIT license
 */

// Polyfill for DOMParser will be handled at runtime
import { Matrix } from './util/matrix.js';
import { Point } from './util/point.js';

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
  
  /** Elements that can be imported */
  private readonly allowedElements: string[];
  
  /** Elements that can be polygonified */
  private readonly polygonElements: string[];
  
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
    
    // Elements that can be imported
    this.allowedElements = ['svg', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'rect', 'image', 'line'];
    
    // Elements that can be polygonified
    this.polygonElements = ['svg', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'rect'];
    
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

  /**
   * Gets the list of allowed SVG element types
   * @returns Array of allowed element tag names
   */
  get allowedElementTypes(): string[] {
    return this.allowedElements;
  }

  /**
   * Gets the list of SVG element types that can be converted to polygons
   * @returns Array of polygonifiable element tag names
   */
  get polygonElementTypes(): string[] {
    return this.polygonElements;
  }

  /**
   * Gets the endpoints of an SVG element (for debugging/testing)
   * @param element - The SVG element to analyze
   * @returns Object with start and end points, or null if unable to determine
   */
  getElementEndpoints(element: SVGElement): { start: Point; end: Point } | null {
    return this.getEndpoints(element);
  }

  /**
   * Reverses the direction of an open path element (for testing)
   * @param element - The SVG element to reverse
   */
  reverseElementPath(element: SVGElement): void {
    this.reverseOpenPath(element);
  }

  /**
   * Merges two open path elements (for testing)
   * @param pathA - The first path (destination)
   * @param pathB - The second path (source)
   * @returns The merged path element or null if merging fails
   */
  mergeElementPaths(pathA: SVGElement, pathB: SVGElement): SVGElement | null {
    return this.mergeOpenPaths(pathA, pathB);
  }

  /**
   * Finds coincident paths for testing
   * @param path - The path to find coincident paths for
   * @param list - List of paths to search
   * @param tolerance - Distance tolerance for endpoint matching
   * @returns Coincident path info or null if none found
   */
  findCoincidentPath(
    path: SVGElement & { endpoints?: { start: Point; end: Point } },
    list: Array<SVGElement & { endpoints?: { start: Point; end: Point } }>,
    tolerance: number
  ): { path: SVGElement; reverse1: boolean; reverse2: boolean } | null {
    return this.getCoincident(path, list, tolerance);
  }

  /**
   * Merges all open paths in the root element (for testing)
   * @param root - The SVG root element containing paths
   * @param tolerance - Distance tolerance for endpoint matching
   */
  mergeAllLines(root: SVGElement, tolerance: number): void {
    this.mergeLines(root, tolerance);
  }

  /**
   * Prepares the SVG for CAD/CAM operations by applying all necessary preprocessing steps
   * @param dxfFlag - Special flag for DXF import handling
   * @returns The processed SVG root element
   */
  cleanInput(dxfFlag: boolean = false): SVGElement | undefined {
    if (!this.svgRoot) {
      return undefined;
    }

    // Apply any transformations, so that all path positions etc will be in the same coordinate space
    this.applyTransform(this.svgRoot, '', false, dxfFlag);

    // Remove any g elements and bring all elements to the top level
    this.flatten(this.svgRoot);

    // Remove any non-geometric elements like text
    this.filter(this.allowedElements);

    // Update image paths to absolute paths
    this.imagePaths(this.svgRoot);

    // Split any compound paths into individual path elements
    this.recurse(this.svgRoot, (element) => this.splitPath(element));

    // Merge open paths into closed paths for numerically accurate exports
    this.mergeLines(this.svgRoot, this.conf.toleranceSvg);

    console.log('this is the scale ', this.conf.scale * 0.02, this.conf.endpointTolerance);

    // For exports with wide gaps, roughly 0.005 inch
    this.mergeLines(this.svgRoot, this.conf.endpointTolerance);
    
    // Finally close any open paths with a really wide margin
    this.mergeLines(this.svgRoot, 3 * this.conf.endpointTolerance);

    return this.svgRoot;
  }

  /**
   * Converts relative image paths to absolute paths
   * @param svg - The SVG element to process
   * @returns False if no directory path is set, undefined otherwise
   */
  imagePaths(svg: SVGElement): boolean | undefined {
    if (!this.dirPath) {
      return false;
    }

    for (let i = 0; i < svg.children.length; i++) {
      const element = svg.children[i];
      if (element.tagName === 'image') {
        let relpath = element.getAttribute('href');
        if (!relpath) {
          relpath = element.getAttribute('xlink:href');
        }
        
        if (relpath) {
          const abspath = this.dirPath + '/' + relpath;
          element.setAttribute('href', abspath);
          element.setAttribute('data-href', relpath);
        }
      }
    }
    
    return undefined;
  }

  /**
   * Flattens the SVG structure by bringing all child elements to the top level
   * @param element - The element to flatten
   */
  flatten(element: SVGElement): void {
    // Recursively flatten children first
    for (let i = 0; i < element.children.length; i++) {
      this.flatten(element.children[i] as SVGElement);
    }

    // Move all children to parent level (except for SVG root)
    if (element.tagName !== 'svg' && element.parentElement) {
      while (element.children.length > 0) {
        element.parentElement.appendChild(element.children[0]);
      }
    }
  }

  /**
   * Removes all elements with tag names not in the whitelist
   * @param whitelist - Array of allowed element tag names
   * @param element - The element to filter (defaults to SVG root)
   * @throws Error if whitelist is invalid
   */
  filter(whitelist: string[], element?: SVGElement): void {
    if (!whitelist || whitelist.length === 0) {
      throw new Error('invalid whitelist');
    }

    const targetElement = element || this.svgRoot;
    if (!targetElement) {
      return;
    }

    // Recursively filter children first
    for (let i = 0; i < targetElement.children.length; i++) {
      this.filter(whitelist, targetElement.children[i] as SVGElement);
    }

    // Remove element if it's not in whitelist and has no children
    if (targetElement.children.length === 0 && whitelist.indexOf(targetElement.tagName) < 0) {
      targetElement.parentElement?.removeChild(targetElement);
    }
  }

  /**
   * Recursively applies a function to an element and all its children
   * @param element - The element to process
   * @param func - The function to apply to each element
   */
  recurse(element: SVGElement, func: (element: SVGElement) => void): void {
    // Only operate on original DOM tree, ignore any children that are added to avoid infinite loops
    const children = Array.from(element.children) as SVGElement[];
    
    for (const child of children) {
      this.recurse(child, func);
    }

    func(element);
  }

  /**
   * Splits a compound path (paths with multiple M/m commands) into individual path elements
   * @param path - The path element to split
   * @returns Array of new path elements or false if no splitting needed
   */
  splitPath(path: SVGElement): SVGElement[] | false {
    if (!path || path.tagName !== 'path' || !path.parentElement) {
      return false;
    }

    const seglist = (path as any).pathSegList;
    let x = 0, y = 0, x0 = 0, y0 = 0;
    const paths: SVGElement[] = [];
    let currentPath: SVGElement;

    // Find the last M command to determine if splitting is needed
    let lastM = 0;
    for (let i = seglist.numberOfItems - 1; i >= 0; i--) {
      const command = seglist.getItem(i).pathSegTypeAsLetter;
      if (i > 0 && (command === 'M' || command === 'm')) {
        lastM = i;
        break;
      }
    }

    if (lastM === 0) {
      return false; // Only 1 M command, no need to split
    }

    // Process each segment and create new paths
    for (let i = 0; i < seglist.numberOfItems; i++) {
      const s = seglist.getItem(i);
      const command = s.pathSegTypeAsLetter;

      // Create new path for each M/m command
      if (command === 'M' || command === 'm') {
        currentPath = path.cloneNode(false) as SVGElement;
        (currentPath as any).setAttribute('d', '');
        paths.push(currentPath);
      }

      // Process coordinates based on command type
      if (/[MLHVCSQTA]/.test(command)) {
        if ('x' in s) x = s.x;
        if ('y' in s) y = s.y;
        (currentPath! as any).pathSegList.appendItem(s);
      } else {
        if ('x' in s) x += s.x;
        if ('y' in s) y += s.y;
        
        if (command === 'm') {
          (currentPath! as any).pathSegList.appendItem((path as any).createSVGPathSegMovetoAbs(x, y));
        } else {
          if (command === 'Z' || command === 'z') {
            x = x0;
            y = y0;
          }
          (currentPath! as any).pathSegList.appendItem(s);
        }
      }

      // Record the start of a subpath
      if (command === 'M' || command === 'm') {
        x0 = x;
        y0 = y;
      }
    }

    // Add new paths to the document
    const addedPaths: SVGElement[] = [];
    for (const newPath of paths) {
      // Don't add trivial paths from sequential M commands
      if ((newPath as any).pathSegList.numberOfItems > 1) {
        path.parentElement.insertBefore(newPath, path);
        addedPaths.push(newPath);
      }
    }

    // Remove the original path
    path.remove();

    return addedPaths;
  }

  /**
   * Finds a path from list that has one endpoint coincident with the given path
   * @param path - The path to find coincident paths for
   * @param list - List of paths to search
   * @param tolerance - Distance tolerance for endpoint matching
   * @returns Coincident path info or null if none found
   */
  private getCoincident(
    path: SVGElement & { endpoints?: { start: Point; end: Point } },
    list: Array<SVGElement & { endpoints?: { start: Point; end: Point } }>,
    tolerance: number
  ): { path: SVGElement; reverse1: boolean; reverse2: boolean } | null {
    const index = list.indexOf(path);

    if (index < 0 || index === list.length - 1) {
      return null;
    }

    const coincident: Array<{ path: SVGElement; reverse1: boolean; reverse2: boolean }> = [];
    
    for (let i = index + 1; i < list.length; i++) {
      const c = list[i];
      
      if (!path.endpoints || !c.endpoints) {
        continue;
      }

      // Check all possible endpoint connections
      if (this.almostEqualPoints(path.endpoints.start, c.endpoints.start, tolerance)) {
        coincident.push({ path: c, reverse1: true, reverse2: false });
      } else if (this.almostEqualPoints(path.endpoints.start, c.endpoints.end, tolerance)) {
        coincident.push({ path: c, reverse1: true, reverse2: true });
      } else if (this.almostEqualPoints(path.endpoints.end, c.endpoints.end, tolerance)) {
        coincident.push({ path: c, reverse1: false, reverse2: true });
      } else if (this.almostEqualPoints(path.endpoints.end, c.endpoints.start, tolerance)) {
        coincident.push({ path: c, reverse1: false, reverse2: false });
      }
    }

    // There is an edge case where the start point of 3 segments coincide
    // For now, just return the first coincident path found
    if (coincident.length > 0) {
      return coincident[0];
    }
    
    return null;
  }

  /**
   * Merges all open paths that share endpoints into continuous paths
   * @param root - The SVG root element containing paths
   * @param tolerance - Distance tolerance for endpoint matching
   */
  private mergeLines(root: SVGElement, tolerance: number): void {
    // Find all open paths
    const openpaths: Array<SVGElement & { endpoints?: { start: Point; end: Point } }> = [];
    
    for (let i = 0; i < root.children.length; i++) {
      const p = root.children[i] as SVGElement;
      
      if (!this.isClosed(p, tolerance)) {
        openpaths.push(p);
      } else if (p.tagName === 'path') {
        // Ensure closed paths have explicit Z command
        const seglist = (p as any).pathSegList;
        if (seglist && seglist.numberOfItems > 0) {
          const lastCommand = seglist.getItem(seglist.numberOfItems - 1).pathSegTypeAsLetter;
          if (lastCommand !== 'z' && lastCommand !== 'Z') {
            // Endpoints are actually far apart, add close path command
            seglist.appendItem((p as any).createSVGPathSegClosePath());
          }
        }
      }
    }

    // Record endpoints for all open paths
    for (const p of openpaths) {
      const endpoints = this.getEndpoints(p);
      if (endpoints) {
        p.endpoints = endpoints;
      }
    }

    // Merge paths that share endpoints
    for (let i = 0; i < openpaths.length; i++) {
      const p = openpaths[i];
      let c = this.getCoincident(p, openpaths, tolerance);

      while (c) {
        // Reverse paths as needed to align endpoints
        if (c.reverse1) {
          this.reverseOpenPath(p);
        }
        if (c.reverse2) {
          this.reverseOpenPath(c.path);
        }

        // Merge the paths
        const merged = this.mergeOpenPaths(p, c.path);
        
        if (!merged) {
          break;
        }

        // Remove the source path from the list
        const pathIndex = openpaths.indexOf(c.path);
        if (pathIndex >= 0) {
          openpaths.splice(pathIndex, 1);
          // Adjust index if necessary
          if (pathIndex < i) {
            i--;
          }
        }

        // Add merged path to the DOM
        root.appendChild(merged);

        // Replace the current path with the merged one
        openpaths[i] = merged;

        // Check if the merged path is now closed
        if (this.isClosed(merged, tolerance)) {
          const seglist = (merged as any).pathSegList;
          if (seglist && seglist.numberOfItems > 0) {
            const lastCommand = seglist.getItem(seglist.numberOfItems - 1).pathSegTypeAsLetter;
            if (lastCommand !== 'z' && lastCommand !== 'Z') {
              // Add close path command
              seglist.appendItem((merged as any).createSVGPathSegClosePath());
            }
          }

          // Remove closed path from open paths list
          openpaths.splice(i, 1);
          i--;
          break;
        }

        // Update endpoints for the merged path
        const endpoints = this.getEndpoints(merged);
        if (endpoints) {
          (merged as any).endpoints = endpoints;
        }

        // Continue merging with the new path
        c = this.getCoincident(merged, openpaths, tolerance);
      }
    }
  }

  /**
   * Parses an SVG transform string and returns the corresponding transformation matrix
   * @param transformString - The SVG transform string to parse
   * @returns The transformation matrix
   */
  private transformParse(transformString: string): Matrix {
    return new Matrix().applyTransformString(transformString);
  }

  /**
   * Recursively applies transform properties to SVG elements
   * @param element - The SVG element to transform
   * @param globalTransform - The accumulated parent transform string
   * @param skipClosed - Whether to skip closed shapes (leave transform attribute)
   * @param dxfFlag - Special flag for DXF import handling
   */
  applyTransform(element: SVGElement, globalTransform: string = '', skipClosed: boolean = false, dxfFlag: boolean = false): void {
    // Combine global and local transforms
    const elementTransform = element.getAttribute('transform') || '';
    const transformString = (globalTransform + ' ' + elementTransform).trim();

    // Parse the transform string
    let transform: Matrix;
    if (transformString.length > 0) {
      transform = this.transformParse(transformString);
    } else {
      transform = new Matrix();
    }

    // Decompose the transformation matrix
    const tarray = transform.toArray();
    const rotate = Math.atan2(tarray[1], tarray[3]) * 180 / Math.PI;
    const scale = Math.hypot(tarray[0], tarray[2]);

    // Handle container elements (recursively process children)
    if (element.tagName === 'g' || element.tagName === 'svg' || element.tagName === 'defs') {
      element.removeAttribute('transform');
      const children = Array.from(element.children) as SVGElement[];
      for (const child of children) {
        this.applyTransform(child, transformString, skipClosed, dxfFlag);
      }
      return;
    }

    // Apply transforms to specific element types
    if (transform && !transform.isIdentity()) {
      this.applyTransformToElement(element, transform, transformString, skipClosed, dxfFlag, rotate, scale);
    }
  }

  /**
   * Applies transformation to a specific SVG element based on its type
   * @param element - The SVG element to transform
   * @param transform - The transformation matrix
   * @param transformString - The original transform string
   * @param skipClosed - Whether to skip closed shapes
   * @param dxfFlag - Special flag for DXF import handling
   * @param rotate - Rotation angle in degrees
   * @param scale - Scale factor
   */
  private applyTransformToElement(
    element: SVGElement,
    transform: Matrix,
    transformString: string,
    skipClosed: boolean,
    dxfFlag: boolean,
    rotate: number,
    scale: number
  ): void {
    switch (element.tagName) {
      case 'ellipse':
        this.transformEllipse(element, transform, transformString, skipClosed);
        break;
      case 'path':
        this.transformPath(element, transform, transformString, skipClosed, dxfFlag, rotate, scale);
        break;
      case 'image':
        element.setAttribute('transform', transformString);
        break;
      case 'line':
        this.transformLine(element, transform);
        break;
      case 'circle':
        this.transformCircle(element, transform, transformString, skipClosed, rotate, scale);
        break;
      case 'rect':
        this.transformRect(element, transform, transformString, skipClosed);
        break;
      case 'polygon':
      case 'polyline':
        this.transformPolygon(element, transform, transformString, skipClosed);
        break;
    }
  }

  /**
   * Transforms an ellipse element by converting it to a path
   * @param element - The ellipse element
   * @param transform - The transformation matrix
   * @param transformString - The original transform string
   * @param skipClosed - Whether to skip closed shapes
   */
  private transformEllipse(element: SVGElement, transform: Matrix, transformString: string, skipClosed: boolean): void {
    if (skipClosed) {
      element.setAttribute('transform', transformString);
      return;
    }

    // Convert ellipse to path for better transform handling
    const path = this.svg!.createElementNS('http://www.w3.org/2000/svg', 'path');
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const rx = parseFloat(element.getAttribute('rx') || '0');
    const ry = parseFloat(element.getAttribute('ry') || '0');

    // Create ellipse path using arc commands
    const d = `M ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy} A ${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`;
    path.setAttribute('d', d);

    // Copy transform property if it exists
    const transformProperty = element.getAttribute('transform');
    if (transformProperty) {
      path.setAttribute('transform', transformProperty);
    }

    // Replace ellipse with path
    element.parentElement!.replaceChild(path, element);
    
    // Process the path with transform
    this.transformPath(path, transform, transformString, skipClosed, false, 0, 1);
  }

  /**
   * Transforms a path element by processing each path segment
   * @param element - The path element
   * @param transform - The transformation matrix
   * @param transformString - The original transform string
   * @param skipClosed - Whether to skip closed shapes
   * @param dxfFlag - Special flag for DXF import handling
   * @param rotate - Rotation angle in degrees
   * @param scale - Scale factor
   */
  private transformPath(
    element: SVGElement,
    transform: Matrix,
    transformString: string,
    skipClosed: boolean,
    dxfFlag: boolean,
    rotate: number,
    scale: number
  ): void {
    if (skipClosed && this.isClosed(element)) {
      element.setAttribute('transform', transformString);
      return;
    }

    this.pathToAbsolute(element);
    const seglist = (element as any).pathSegList;
    let prevx = 0;
    let prevy = 0;

    for (let i = 0; i < seglist.numberOfItems; i++) {
      const s = seglist.getItem(i);
      const command = s.pathSegTypeAsLetter;

      // Handle horizontal and vertical lines
      if (command === 'H') {
        seglist.replaceItem((element as any).createSVGPathSegLinetoAbs(s.x, prevy), i);
        const updatedS = seglist.getItem(i);
        // Update coordinates from new segment
        prevx = updatedS.x;
        prevy = updatedS.y;
      } else if (command === 'V') {
        seglist.replaceItem((element as any).createSVGPathSegLinetoAbs(prevx, s.y), i);
        const updatedS = seglist.getItem(i);
        // Update coordinates from new segment
        prevx = updatedS.x;
        prevy = updatedS.y;
      } else if (command === 'A') {
        // Handle arc segments with special DXF logic
        let arcrotate: number;
        let arcsweep: boolean;
        
        if (dxfFlag) {
          // Fix DXF import error
          arcrotate = (rotate === 180) ? 0 : rotate;
          arcsweep = (rotate === 180) ? !s.sweepFlag : s.sweepFlag;
        } else {
          arcrotate = s.angle + rotate;
          arcsweep = s.sweepFlag;
        }

        seglist.replaceItem(
          (element as any).createSVGPathSegArcAbs(s.x, s.y, s.r1 * scale, s.r2 * scale, arcrotate, s.largeArcFlag, arcsweep),
          i
        );
        const updatedS = seglist.getItem(i);
        // Update coordinates from new segment
        prevx = updatedS.x;
        prevy = updatedS.y;
      }

      // Transform coordinate points
      if ('x' in s && 'y' in s) {
        const transformed = transform.calc(new Point(s.x, s.y));
        prevx = s.x;
        prevy = s.y;
        s.x = transformed.x;
        s.y = transformed.y;
      }
      if ('x1' in s && 'y1' in s) {
        const transformed = transform.calc(new Point(s.x1, s.y1));
        s.x1 = transformed.x;
        s.y1 = transformed.y;
      }
      if ('x2' in s && 'y2' in s) {
        const transformed = transform.calc(new Point(s.x2, s.y2));
        s.x2 = transformed.x;
        s.y2 = transformed.y;
      }
    }

    element.removeAttribute('transform');
  }

  /**
   * Transforms a line element by transforming its endpoints
   * @param element - The line element
   * @param transform - The transformation matrix
   */
  private transformLine(element: SVGElement, transform: Matrix): void {
    const x1 = Number(element.getAttribute('x1') || '0');
    const x2 = Number(element.getAttribute('x2') || '0');
    const y1 = Number(element.getAttribute('y1') || '0');
    const y2 = Number(element.getAttribute('y2') || '0');

    const transformed1 = transform.calc(new Point(x1, y1));
    const transformed2 = transform.calc(new Point(x2, y2));

    element.setAttribute('x1', transformed1.x.toString());
    element.setAttribute('y1', transformed1.y.toString());
    element.setAttribute('x2', transformed2.x.toString());
    element.setAttribute('y2', transformed2.y.toString());

    element.removeAttribute('transform');
  }

  /**
   * Transforms a circle element by converting it to a path
   * @param element - The circle element
   * @param transform - The transformation matrix
   * @param transformString - The original transform string
   * @param skipClosed - Whether to skip closed shapes
   * @param rotate - Rotation angle in degrees
   * @param scale - Scale factor
   */
  private transformCircle(
    element: SVGElement,
    transform: Matrix,
    transformString: string,
    skipClosed: boolean,
    rotate: number,
    scale: number
  ): void {
    if (skipClosed) {
      element.setAttribute('transform', transformString);
      return;
    }

    // Convert circle to path for better transform handling
    const path = this.svg!.createElementNS('http://www.w3.org/2000/svg', 'path');
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const r = parseFloat(element.getAttribute('r') || '0');

    // Create circle path using arc commands
    const d = `M ${cx - r},${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy} Z`;
    path.setAttribute('d', d);

    // Copy style attributes
    const stylesToCopy = ['style', 'fill', 'stroke', 'stroke-width'];
    stylesToCopy.forEach(attr => {
      if (element.hasAttribute(attr)) {
        path.setAttribute(attr, element.getAttribute(attr)!);
      }
    });

    // Apply transform
    if (transformString) {
      path.setAttribute('transform', transformString);
    }

    // Replace circle with path
    element.parentElement!.replaceChild(path, element);

    // Process the path with transform
    this.transformPath(path, transform, transformString, skipClosed, false, rotate, scale);
  }

  /**
   * Transforms a rectangle element by converting it to a polygon
   * @param element - The rectangle element
   * @param transform - The transformation matrix
   * @param transformString - The original transform string
   * @param skipClosed - Whether to skip closed shapes
   */
  private transformRect(element: SVGElement, transform: Matrix, transformString: string, skipClosed: boolean): void {
    if (skipClosed) {
      element.setAttribute('transform', transformString);
      return;
    }

    // Convert rectangle to polygon
    const polygon = this.svg!.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const width = parseFloat(element.getAttribute('width') || '0');
    const height = parseFloat(element.getAttribute('height') || '0');

    // Create rectangle points
    const points = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ];

    // OnShape exports a rectangle at position 0/0, drop it
    if (x === 0 && y === 0) {
      // Leave polygon empty
    } else {
      // Add points to polygon
      points.forEach(point => {
        const svgPoint = (this.svgRoot as any).createSVGPoint();
        svgPoint.x = point.x;
        svgPoint.y = point.y;
        (polygon as any).points.appendItem(svgPoint);
      });
    }

    // Copy transform property if it exists
    const transformProperty = element.getAttribute('transform');
    if (transformProperty) {
      polygon.setAttribute('transform', transformProperty);
    }

    // Replace rectangle with polygon
    element.parentElement!.replaceChild(polygon, element);

    // Process the polygon with transform
    this.transformPolygon(polygon, transform, transformString, skipClosed);
  }

  /**
   * Transforms a polygon or polyline element by transforming each point
   * @param element - The polygon or polyline element
   * @param transform - The transformation matrix
   * @param transformString - The original transform string
   * @param skipClosed - Whether to skip closed shapes
   */
  private transformPolygon(element: SVGElement, transform: Matrix, transformString: string, skipClosed: boolean): void {
    if (skipClosed && this.isClosed(element)) {
      element.setAttribute('transform', transformString);
      return;
    }

    const points = (element as any).points;
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const transformed = transform.calc(new Point(point.x, point.y));
      point.x = transformed.x;
      point.y = transformed.y;
    }

    element.removeAttribute('transform');
  }

  /**
   * Determines if an SVG element represents a closed shape
   * @param element - The SVG element to check
   * @param tolerance - Optional tolerance for endpoint comparison
   * @returns True if the element represents a closed shape
   */
  private isClosed(element: SVGElement, tolerance?: number): boolean {
    const openElements = ['line', 'polyline', 'path'];
    
    // Elements like rect, circle, ellipse are closed by definition
    if (openElements.indexOf(element.tagName) < 0) {
      return true;
    }
    
    // Line elements are always open
    if (element.tagName === 'line') {
      return false;
    }
    
    // Check polyline closure
    if (element.tagName === 'polyline') {
      const points = (element as any).points;
      
      // A 2-point polyline cannot be closed
      if (points.length < 3) {
        return false;
      }
      
      const first = { x: points[0].x, y: points[0].y };
      const last = { x: points[points.length - 1].x, y: points[points.length - 1].y };
      
      const usedTolerance = tolerance || this.conf.toleranceSvg;
      return this.almostEqual(first.x, last.x, usedTolerance) && 
             this.almostEqual(first.y, last.y, usedTolerance);
    }
    
    // Check path closure
    if (element.tagName === 'path') {
      const seglist = (element as any).pathSegList;
      
      // Check for explicit Z/z command
      for (let j = 0; j < seglist.numberOfItems; j++) {
        const c = seglist.getItem(j);
        if (c.pathSegTypeAsLetter === 'z' || c.pathSegTypeAsLetter === 'Z') {
          return true;
        }
      }
      
      // Check if start and end points coincide
      const test = this.polygonifyPath(element);
      if (!test || test.length < 2) {
        return test ? true : false;
      }
      
      const first = test[0];
      const last = test[test.length - 1];
      const usedTolerance = tolerance || this.conf.toleranceSvg;
      
      return this.almostEqualPoints(first, last, usedTolerance);
    }
    
    return false;
  }

  /**
   * Converts relative path commands to absolute coordinates
   * @param element - The path element to convert
   * @throws Error if element is not a path
   */
  private pathToAbsolute(element: SVGElement): void {
    if (!element || element.tagName !== 'path') {
      throw new Error('invalid path');
    }
    
    const seglist = (element as any).pathSegList;
    let x = 0, y = 0, x0 = 0, y0 = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    
    for (let i = 0; i < seglist.numberOfItems; i++) {
      const command = seglist.getItem(i).pathSegTypeAsLetter;
      const s = seglist.getItem(i);
      
      // Handle absolute commands
      if (/[MLHVCSQTA]/.test(command)) {
        if ('x' in s) x = s.x;
        if ('y' in s) y = s.y;
      } else {
        // Handle relative commands
        if ('x1' in s) x1 = x + s.x1;
        if ('x2' in s) x2 = x + s.x2;
        if ('y1' in s) y1 = y + s.y1;
        if ('y2' in s) y2 = y + s.y2;
        if ('x' in s) x += s.x;
        if ('y' in s) y += s.y;
        
        // Convert relative commands to absolute
        switch (command) {
          case 'm':
            seglist.replaceItem((element as any).createSVGPathSegMovetoAbs(x, y), i);
            break;
          case 'l':
            seglist.replaceItem((element as any).createSVGPathSegLinetoAbs(x, y), i);
            break;
          case 'h':
            seglist.replaceItem((element as any).createSVGPathSegLinetoHorizontalAbs(x), i);
            break;
          case 'v':
            seglist.replaceItem((element as any).createSVGPathSegLinetoVerticalAbs(y), i);
            break;
          case 'c':
            seglist.replaceItem((element as any).createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i);
            break;
          case 's':
            seglist.replaceItem((element as any).createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i);
            break;
          case 'q':
            seglist.replaceItem((element as any).createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i);
            break;
          case 't':
            seglist.replaceItem((element as any).createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i);
            break;
          case 'a':
            seglist.replaceItem((element as any).createSVGPathSegArcAbs(x, y, s.r1, s.r2, s.angle, s.largeArcFlag, s.sweepFlag), i);
            break;
          case 'z':
          case 'Z':
            x = x0;
            y = y0;
            break;
        }
      }
      
      // Record the start of a subpath
      if (command === 'M' || command === 'm') {
        x0 = x;
        y0 = y;
      }
    }
  }

  /**
   * Extracts the start and end points from an SVG element
   * @param element - The SVG element to analyze
   * @returns Object with start and end points, or null if unable to determine
   */
  private getEndpoints(element: SVGElement): { start: Point; end: Point } | null {
    let start: Point, end: Point;
    
    if (element.tagName === 'line') {
      start = new Point(
        Number(element.getAttribute('x1') || '0'),
        Number(element.getAttribute('y1') || '0')
      );
      end = new Point(
        Number(element.getAttribute('x2') || '0'),
        Number(element.getAttribute('y2') || '0')
      );
    } else if (element.tagName === 'polyline') {
      const points = (element as any).points;
      if (points.length === 0) {
        return null;
      }
      start = new Point(points[0].x, points[0].y);
      end = new Point(points[points.length - 1].x, points[points.length - 1].y);
    } else if (element.tagName === 'path') {
      const poly = this.polygonifyPath(element);
      if (!poly || poly.length === 0) {
        return null;
      }
      start = poly[0];
      end = poly[poly.length - 1];
    } else {
      return null;
    }
    
    return { start, end };
  }

  /**
   * Utility method for floating point comparison
   * @param a - First value
   * @param b - Second value
   * @param tolerance - Comparison tolerance
   * @returns True if values are approximately equal
   */
  private almostEqual(a: number, b: number, tolerance: number): boolean {
    return Math.abs(a - b) < tolerance;
  }

  /**
   * Utility method for comparing two points
   * @param a - First point
   * @param b - Second point
   * @param tolerance - Comparison tolerance
   * @returns True if points are approximately equal
   */
  private almostEqualPoints(a: Point, b: Point, tolerance: number): boolean {
    return this.almostEqual(a.x, b.x, tolerance) && this.almostEqual(a.y, b.y, tolerance);
  }

  /**
   * Reverses the direction of an open path (line, polyline, or path)
   * @param element - The SVG element to reverse
   */
  private reverseOpenPath(element: SVGElement): void {
    if (element.tagName === 'line') {
      // Swap the start and end points of the line
      const x1 = element.getAttribute('x1');
      const x2 = element.getAttribute('x2');
      const y1 = element.getAttribute('y1');
      const y2 = element.getAttribute('y2');

      element.setAttribute('x1', x2 || '0');
      element.setAttribute('y1', y2 || '0');
      element.setAttribute('x2', x1 || '0');
      element.setAttribute('y2', y1 || '0');
    } else if (element.tagName === 'polyline') {
      // Reverse the order of points
      const points = (element as any).points;
      const pointsArray: any[] = [];
      
      for (let i = 0; i < points.length; i++) {
        pointsArray.push(points[i]);
      }

      const reversedPoints = pointsArray.reverse();
      points.clear();
      
      for (const point of reversedPoints) {
        points.appendItem(point);
      }
    } else if (element.tagName === 'path') {
      // Convert to absolute coordinates first
      this.pathToAbsolute(element);

      const seglist = (element as any).pathSegList;
      const reversed: any[] = [];

      let x = 0, y = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0;
      let prevx = 0, prevy = 0, prevx1 = 0, prevy1 = 0, prevx2 = 0, prevy2 = 0;

      // Process each path segment and build reversed path
      for (let i = 0; i < seglist.numberOfItems; i++) {
        const s = seglist.getItem(i);
        const command = s.pathSegTypeAsLetter;

        // Store previous coordinates
        prevx = x;
        prevy = y;
        prevx1 = x1;
        prevy1 = y1;
        prevx2 = x2;
        prevy2 = y2;

        // Extract coordinates from current segment
        if (/[MLHVCSQTA]/.test(command)) {
          if ('x1' in s) x1 = s.x1;
          if ('x2' in s) x2 = s.x2;
          if ('y1' in s) y1 = s.y1;
          if ('y2' in s) y2 = s.y2;
          if ('x' in s) x = s.x;
          if ('y' in s) y = s.y;
        }

        // Build reversed path data
        switch (command) {
          case 'M':
            reversed.push(y, x);
            break;
          case 'L':
          case 'H':
          case 'V':
            reversed.push('L', y, x);
            break;
          case 'T':
            // Implicit control point for smooth quadratic bezier
            if (i > 0 && /[QqTt]/.test(seglist.getItem(i - 1).pathSegTypeAsLetter)) {
              x1 = prevx + (prevx - prevx1);
              y1 = prevy + (prevy - prevy1);
            } else {
              x1 = prevx;
              y1 = prevy;
            }
            reversed.push(y1, x1, 'Q', y, x);
            break;
          case 'Q':
            reversed.push(y1, x1, 'Q', y, x);
            break;
          case 'S':
            // Implicit control point for smooth cubic bezier
            if (i > 0 && /[CcSs]/.test(seglist.getItem(i - 1).pathSegTypeAsLetter)) {
              x1 = prevx + (prevx - prevx2);
              y1 = prevy + (prevy - prevy2);
            } else {
              x1 = prevx;
              y1 = prevy;
            }
            reversed.push(y1, x1, y2, x2, 'C', y, x);
            break;
          case 'C':
            reversed.push(y1, x1, y2, x2, 'C', y, x);
            break;
          case 'A':
            // Sweep flag needs to be inverted for correct reverse path
            reversed.push(
              s.sweepFlag ? '0' : '1',
              s.largeArcFlag ? '1' : '0',
              s.angle,
              s.r2,
              s.r1,
              'A',
              y,
              x
            );
            break;
          default:
            console.log('SVG path error: ' + command);
        }
      }

      // Create the final reversed path string
      const newpath = reversed.reverse();
      const reversedString = 'M ' + newpath.join(' ');
      element.setAttribute('d', reversedString);
    }
  }

  /**
   * Merges two open paths by connecting their endpoints
   * @param pathA - The first path (destination)
   * @param pathB - The second path (source)
   * @returns The merged path element or null if merging fails
   */
  private mergeOpenPaths(pathA: SVGElement, pathB: SVGElement): SVGElement | null {
    /**
     * Converts line or polyline elements to path elements
     * @param element - The element to convert
     * @returns A path element or null if conversion fails
     */
    const toPath = (element: SVGElement): SVGElement | null => {
      if (element.tagName === 'line') {
        const path = this.svg!.createElementNS('http://www.w3.org/2000/svg', 'path');
        const x1 = Number(element.getAttribute('x1') || '0');
        const y1 = Number(element.getAttribute('y1') || '0');
        const x2 = Number(element.getAttribute('x2') || '0');
        const y2 = Number(element.getAttribute('y2') || '0');

        (path as any).pathSegList.appendItem((path as any).createSVGPathSegMovetoAbs(x1, y1));
        (path as any).pathSegList.appendItem((path as any).createSVGPathSegLinetoAbs(x2, y2));

        return path;
      }

      if (element.tagName === 'polyline') {
        const points = (element as any).points;
        if (points.length < 2) {
          return null;
        }

        const path = this.svg!.createElementNS('http://www.w3.org/2000/svg', 'path');
        (path as any).pathSegList.appendItem((path as any).createSVGPathSegMovetoAbs(points[0].x, points[0].y));
        
        for (let i = 1; i < points.length; i++) {
          (path as any).pathSegList.appendItem((path as any).createSVGPathSegLinetoAbs(points[i].x, points[i].y));
        }

        return path;
      }

      return null;
    };

    // Convert paths to path elements if needed
    let convertedPathA: SVGElement;
    if (pathA.tagName === 'path') {
      convertedPathA = pathA;
    } else {
      const converted = toPath(pathA);
      if (!converted) return null;
      convertedPathA = converted;
    }

    let convertedPathB: SVGElement;
    if (pathB.tagName === 'path') {
      convertedPathB = pathB;
    } else {
      const converted = toPath(pathB);
      if (!converted) return null;
      convertedPathB = converted;
    }

    // Merge the path segments
    const seglistA = (convertedPathA as any).pathSegList;
    const seglistB = (convertedPathB as any).pathSegList;

    if (!seglistA || !seglistB || seglistB.numberOfItems === 0) {
      return null;
    }

    // Skip the first M command of path B and append the rest to path A
    for (let i = 1; i < seglistB.numberOfItems; i++) {
      const segment = seglistB.getItem(i);
      seglistA.appendItem(segment);
    }

    return convertedPathA;
  }

  // Placeholder for polygonifyPath - will be implemented in Step 9
  private polygonifyPath(_element: SVGElement): Point[] | null {
    // This will be implemented in Step 9: Shape Conversion Methods
    return null;
  }

  // Remaining methods will be converted in subsequent steps...
}