/**
 * NFP (No Fit Polygon) Cache for nesting algorithm
 * Caches computed NFPs to avoid redundant calculations during nesting
 * NFP represents all possible positions where one polygon touches but doesn't intersect another
 */

import { Point } from "./util/point.js";

/** NFP type: array of points with optional children for nested polygons */
type Nfp = Point[] & { children?: Point[][] };

/**
 * NFP document structure for cache key generation
 */
export interface NfpDoc {
  /** ID of first polygon (container) */
  A: string;
  /** ID of second polygon (part to place) */
  B: string;
  /** Rotation angle of polygon A (in degrees or as string) */
  Arotation: number | string;
  /** Rotation angle of polygon B (in degrees or as string) */
  Brotation: number | string;
  /** Whether polygon A is flipped */
  Aflipped?: boolean;
  /** Whether polygon B is flipped */
  Bflipped?: boolean;
  /** Cached NFP polygon data (single or array for multiple) */
  nfp: Nfp | Nfp[];
}

/**
 * NFP Cache for nesting algorithm optimization
 * Stores computed No Fit Polygons to avoid redundant calculations
 */
export class NfpCache {
  /** Internal cache database mapping keys to NFP data */
  private db: Record<string, Nfp | Nfp[]> = {};

  /**
   * Deep clone an NFP polygon structure
   * @param nfp - NFP polygon to clone
   * @returns A new NFP polygon with cloned Point instances
   * @sideEffect None (returns new object)
   */
  private clone(nfp: Nfp): Nfp {
    const newnfp: Nfp = nfp.map((p) => new Point(p.x, p.y));
    if (nfp.children && nfp.children.length > 0) {
      newnfp.children = nfp.children.map((child) =>
        child.map((p) => new Point(p.x, p.y)),
      );
    }
    return newnfp;
  }

  /**
   * Clone NFP or NFP array
   * @param nfp - Single NFP or array of NFPs to clone
   * @param inner - If true, clone as array of NFPs
   * @returns Cloned NFP or NFP array
   * @sideEffect None (returns new objects)
   */
  private cloneNfp(nfp: Nfp | Nfp[], inner?: boolean): Nfp | Nfp[] {
    if (!inner) {
      return this.clone(nfp as Nfp);
    }
    return (nfp as Nfp[]).map((n) => this.clone(n));
  }

  /**
   * Generate cache key from NFP document
   * Key format: {A}-{B}-{Arotation}-{Brotation}-{Aflipped}-{Bflipped}
   * @param doc - NFP document containing polygon IDs, rotations, and flip states
   * @param _inner - Optional flag for inner NFP arrays (unused in current implementation)
   * @returns String cache key
   * @sideEffect None
   */
  private makeKey(doc: NfpDoc, _inner?: boolean): string {
    const Arotation = parseInt(doc.Arotation as string);
    const Brotation = parseInt(doc.Brotation as string);
    const Aflipped = doc.Aflipped ? "1" : "0";
    const Bflipped = doc.Bflipped ? "1" : "0";
    return `${doc.A}-${doc.B}-${Arotation}-${Brotation}-${Aflipped}-${Bflipped}`;
  }

  /**
   * Check if NFP exists in cache
   * @param obj - NFP document describing the cached NFP
   * @returns True if NFP is cached
   * @sideEffect None
   */
  has(obj: NfpDoc): boolean {
    const key = this.makeKey(obj);
    return key in this.db;
  }

  /**
   * Find and clone NFP from cache
   * @param obj - NFP document describing the cached NFP
   * @param inner - If true, return as array of NFPs
   * @returns Cloned NFP polygon data or null if not found
   * @sideEffect None (returns new object)
   */
  find(obj: NfpDoc, inner?: boolean): Nfp | Nfp[] | null {
    const key = this.makeKey(obj, inner);
    if (this.db[key]) {
      return this.cloneNfp(this.db[key], inner);
    }
    return null;
  }

  /**
   * Insert NFP into cache
   * @param obj - NFP document with NFP data to store
   * @param inner - Optional flag for inner NFP arrays
   * @sideEffect Modifies internal cache database
   */
  insert(obj: NfpDoc, inner?: boolean): void {
    const key = this.makeKey(obj, inner);
    this.db[key] = this.cloneNfp(obj.nfp, inner);
  }

  /**
   * Get the entire cache database
   * @returns Record mapping cache keys to NFP data
   * @sideEffect None (returns reference to internal database)
   */
  getCache(): Record<string, Nfp | Nfp[]> {
    return this.db;
  }

  /**
   * Get cache statistics
   * @returns Number of cached NFPs
   * @sideEffect None
   */
  getStats(): number {
    return Object.keys(this.db).length;
  }
}
