/**
 * Preset management utility
 * Provides CRUD operations for user presets stored in userData directory
 * Migrates legacy conversion server URLs to current server
 */

const fs = require("fs");
const path = require("path");
const { app } = require("electron");

/** Path to presets.json file in userData directory */
const presetsPath = path.resolve(app.getPath("userData"), "presets.json");

/**
 * Load all presets from file system
 * Migrates legacy conversion server URLs to current server automatically
 * @returns Object mapping preset names to configuration strings
 * @sideEffect Reads from file system, modifies data through migration (not persisted)
 */
function loadPresets() {
  if (fs.existsSync(presetsPath)) {
    return JSON.parse(
      fs
        .readFileSync(presetsPath)
        .toString()
        .replaceAll(
          "http://convert.deepnest.io",
          "https://converter.deepnest.app/convert",
        )
        .replaceAll(
          "https://convert.deepnest.io",
          "https://converter.deepnest.app/convert",
        ),
    );
  }
  return {};
}

/**
 * Save a preset configuration
 * @param name - Preset name to save
 * @param config - Configuration object/string to store (will be stringified)
 * @sideEffect Writes to presets.json file on disk
 */
function savePreset(name, config) {
  const presets = loadPresets();
  presets[name] = config;
  fs.writeFileSync(presetsPath, JSON.stringify(presets, null, 2));
}

/**
 * Delete a preset by name
 * @param name - Name of preset to delete
 * @sideEffect Writes updated presets.json to disk, removes preset from file
 */
function deletePreset(name) {
  const presets = loadPresets();
  delete presets[name];
  fs.writeFileSync(presetsPath, JSON.stringify(presets, null, 2));
}

module.exports = {
  loadPresets,
  savePreset,
  deletePreset,
};
