/**
 * Preset Service
 * Manages preset save/load/delete operations via IPC
 * Provides a clean interface for preset management in the renderer process
 */

import type { UIConfig, PresetConfig } from "../types/index.js";
import { IPC_CHANNELS, DEFAULT_CONVERSION_SERVER } from "../types/index.js";

// Type for IPC renderer - available in Electron context
interface IpcRenderer {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
}

/**
 * Legacy conversion server URLs that need to be migrated
 */
const LEGACY_CONVERSION_SERVERS = [
  "http://convert.deepnest.io",
  "https://convert.deepnest.io",
] as const;

/**
 * Preset Service class
 * Handles preset operations via IPC communication with the main process
 * Follows the pattern from main/deepnest.js ES6 class structure
 */
export class PresetService {
  /** IPC renderer for communicating with main process */
  private ipcRenderer: IpcRenderer | null = null;

  /** Cached presets to avoid unnecessary IPC calls */
  private cachedPresets: PresetConfig | null = null;

  /** Whether the cache is valid */
  private cacheValid = false;

  /**
   * Create a new PresetService instance
   * @param ipcRenderer - Electron IPC renderer for communication (optional for testing)
   */
  constructor(ipcRenderer?: IpcRenderer) {
    this.ipcRenderer = ipcRenderer || null;
  }

  /**
   * Migrate legacy conversion server URLs to the current server
   * This handles presets that were saved with old deepnest.io URLs
   * @param configString - JSON string of config to migrate
   * @returns Migrated config string
   */
  private migrateConversionServer(configString: string): string {
    let migrated = configString;
    for (const legacyUrl of LEGACY_CONVERSION_SERVERS) {
      // Use split/join pattern for compatibility with ES2020
      migrated = migrated.split(legacyUrl).join(DEFAULT_CONVERSION_SERVER);
    }
    return migrated;
  }

  /**
   * Load all presets from storage
   * @returns Promise resolving to preset configuration object
   */
  async loadPresets(): Promise<PresetConfig> {
    if (this.cacheValid && this.cachedPresets !== null) {
      return this.cachedPresets;
    }

    if (!this.ipcRenderer) {
      return {};
    }

    try {
      const presets = (await this.ipcRenderer.invoke(
        IPC_CHANNELS.LOAD_PRESETS
      )) as PresetConfig | null;

      if (presets && typeof presets === "object") {
        this.cachedPresets = presets;
        this.cacheValid = true;
        return presets;
      }
      return {};
    } catch {
      // Return empty presets on error
      return {};
    }
  }

  /**
   * Get list of preset names
   * @returns Promise resolving to array of preset names
   */
  async getPresetNames(): Promise<string[]> {
    const presets = await this.loadPresets();
    return Object.keys(presets);
  }

  /**
   * Get a specific preset configuration by name
   * @param name - Name of the preset to retrieve
   * @returns Promise resolving to parsed config or null if not found
   */
  async getPreset(name: string): Promise<Partial<UIConfig> | null> {
    const presets = await this.loadPresets();
    const presetString = presets[name];

    if (!presetString) {
      return null;
    }

    try {
      // Migrate any legacy conversion server URLs
      const migrated = this.migrateConversionServer(presetString);
      return JSON.parse(migrated) as Partial<UIConfig>;
    } catch {
      // Return null if parsing fails
      return null;
    }
  }

  /**
   * Save a preset with the given name
   * @param name - Name for the preset
   * @param config - Configuration to save (will be stringified if object)
   * @returns Promise resolving when save is complete
   * @throws Error if name is empty or save fails
   */
  async savePreset(name: string, config: UIConfig | string): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Preset name cannot be empty");
    }

    if (!this.ipcRenderer) {
      throw new Error("IPC renderer not available");
    }

    // Convert config to string if it's an object
    const configString =
      typeof config === "string" ? config : JSON.stringify(config);

    try {
      await this.ipcRenderer.invoke(
        IPC_CHANNELS.SAVE_PRESET,
        trimmedName,
        configString
      );

      // Invalidate cache after save
      this.invalidateCache();
    } catch (error) {
      throw new Error(
        `Failed to save preset: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a preset by name
   * @param name - Name of the preset to delete
   * @returns Promise resolving when delete is complete
   * @throws Error if name is empty or delete fails
   */
  async deletePreset(name: string): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Preset name cannot be empty");
    }

    if (!this.ipcRenderer) {
      throw new Error("IPC renderer not available");
    }

    try {
      await this.ipcRenderer.invoke(IPC_CHANNELS.DELETE_PRESET, trimmedName);

      // Invalidate cache after delete
      this.invalidateCache();
    } catch (error) {
      throw new Error(
        `Failed to delete preset: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if a preset exists
   * @param name - Name of the preset to check
   * @returns Promise resolving to true if preset exists
   */
  async hasPreset(name: string): Promise<boolean> {
    const presets = await this.loadPresets();
    return Object.prototype.hasOwnProperty.call(presets, name);
  }

  /**
   * Invalidate the preset cache
   * Call this when presets may have changed externally
   */
  invalidateCache(): void {
    this.cacheValid = false;
    this.cachedPresets = null;
  }

  /**
   * Create and return a new PresetService instance
   * @param ipcRenderer - Electron IPC renderer
   * @returns New PresetService instance
   */
  static create(ipcRenderer: IpcRenderer): PresetService {
    return new PresetService(ipcRenderer);
  }
}

/**
 * Factory function to create a preset service
 * @param ipcRenderer - Electron IPC renderer
 * @returns New PresetService instance
 */
export function createPresetService(ipcRenderer: IpcRenderer): PresetService {
  return PresetService.create(ipcRenderer);
}
