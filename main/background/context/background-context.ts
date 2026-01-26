/**
 * BackgroundContext Singleton
 * Manages global dependencies for the background worker process
 * Provides centralized access to: ipcRenderer, addon, db, path, url, fs
 */

import type { NfpCache } from "../../nfpDb.js";

/**
 * IPC Renderer interface for Electron communication
 * Provides methods for sending and receiving messages between processes
 */
export interface IpcRenderer {
  /**
   * Send a message to the main process
   * @param channel - IPC channel name
   * @param args - Arguments to send
   */
  send(channel: string, ...args: unknown[]): void;

  /**
   * Listen for messages from the main process
   * @param channel - IPC channel name
   * @param listener - Callback function
   */
  on(
    channel: string,
    listener: (event: unknown, ...args: unknown[]) => void,
  ): void;

  /**
   * Remove a listener for messages from the main process
   * @param channel - IPC channel name
   * @param listener - Callback function to remove
   */
  off(
    channel: string,
    listener: (event: unknown, ...args: unknown[]) => void,
  ): void;

  /**
   * Send a message and wait for a response
   * @param channel - IPC channel name
   * @param args - Arguments to send
   * @returns Promise that resolves with the response
   */
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
}

/**
 * NFP Addon interface for @deepnest/calculate-nfp module
 * Provides native NFP calculation functionality
 */
export interface NfpAddon {
  /**
   * Calculate No-Fit Polygon between two polygons
   * @param A - First polygon (array of points)
   * @param B - Second polygon (array of points)
   * @param config - Configuration object
   * @returns NFP polygon or array of NFPs
   */
  nfp(A: unknown, B: unknown, config?: unknown): unknown;

  /**
   * Calculate inner NFP for a polygon within a container
   * @param A - Container polygon
   * @param B - Polygon to place inside
   * @param config - Configuration object
   * @returns Inner NFP polygon or array of NFPs
   */
  innerNfp(A: unknown, B: unknown, config?: unknown): unknown;

  [key: string]: unknown;
}

/**
 * BackgroundContext Singleton
 * Manages global dependencies for the background worker process
 * Ensures single instance and one-time initialization
 */
export class BackgroundContext {
  /** Singleton instance */
  private static instance: BackgroundContext | null = null;

  /** Initialization flag */
  private initialized = false;

  /** IPC Renderer for Electron communication */
  private ipcRenderer: IpcRenderer | null = null;

  /** NFP Addon for native NFP calculations */
  private addon: NfpAddon | null = null;

  /** NFP Cache for storing computed NFPs */
  private db: NfpCache | null = null;

  /** Node.js path module */
  private path: typeof import("path") | null = null;

  /** Node.js url module */
  private url: typeof import("url") | null = null;

  /** graceful-fs module for file system operations (untyped third-party module) */
  private fs: any = null;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {}

  /**
   * Get the singleton instance
   * @returns The BackgroundContext singleton instance
   */
  static getInstance(): BackgroundContext {
    if (BackgroundContext.instance === null) {
      BackgroundContext.instance = new BackgroundContext();
    }
    return BackgroundContext.instance;
  }

  /**
   * Initialize the context with dependencies
   * Must be called exactly once at startup
   * @param deps - Object containing all required dependencies
   * @throws Error if already initialized
   */
  initialize(deps: {
    ipcRenderer: IpcRenderer;
    addon: NfpAddon;
    db: NfpCache;
    path: typeof import("path");
    url: typeof import("url");
    fs: any;
  }): void {
    if (this.initialized) {
      throw new Error("BackgroundContext is already initialized");
    }

    this.ipcRenderer = deps.ipcRenderer;
    this.addon = deps.addon;
    this.db = deps.db;
    this.path = deps.path;
    this.url = deps.url;
    this.fs = deps.fs;

    this.initialized = true;
  }

  /**
   * Get the IPC Renderer
   * @returns IPC Renderer instance
   * @throws Error if not initialized
   */
  getIpcRenderer(): IpcRenderer {
    if (!this.initialized || this.ipcRenderer === null) {
      throw new Error("BackgroundContext is not initialized");
    }
    return this.ipcRenderer;
  }

  /**
   * Get the NFP Addon
   * @returns NFP Addon instance
   * @throws Error if not initialized
   */
  getAddon(): NfpAddon {
    if (!this.initialized || this.addon === null) {
      throw new Error("BackgroundContext is not initialized");
    }
    return this.addon;
  }

  /**
   * Get the NFP Cache
   * @returns NFP Cache instance
   * @throws Error if not initialized
   */
  getDb(): NfpCache {
    if (!this.initialized || this.db === null) {
      throw new Error("BackgroundContext is not initialized");
    }
    return this.db;
  }

  /**
   * Get the path module
   * @returns Node.js path module
   * @throws Error if not initialized
   */
  getPath(): typeof import("path") {
    if (!this.initialized || this.path === null) {
      throw new Error("BackgroundContext is not initialized");
    }
    return this.path;
  }

  /**
   * Get the url module
   * @returns Node.js url module
   * @throws Error if not initialized
   */
  getUrl(): typeof import("url") {
    if (!this.initialized || this.url === null) {
      throw new Error("BackgroundContext is not initialized");
    }
    return this.url;
  }

  /**
   * Get the graceful-fs module
   * @returns graceful-fs module
   * @throws Error if not initialized
   */
  getFs(): any {
    if (!this.initialized || this.fs === null) {
      throw new Error("BackgroundContext is not initialized");
    }
    return this.fs;
  }

  /**
   * Check if the context is initialized
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
