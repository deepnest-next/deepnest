const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const presetsPath = path.resolve(app.getPath("userData"), "presets.json");

function loadPresets() {
  if (fs.existsSync(presetsPath)) {
    return JSON.parse(fs.readFileSync(presetsPath).toString().replaceAll("http://convert.deepnest.io", "https://converter.deepnest.app/convert").replaceAll("https://convert.deepnest.io", "https://converter.deepnest.app/convert"));
  }
  return {};
}

function savePreset(name, config) {
  const presets = loadPresets();
  presets[name] = config;
  fs.writeFileSync(presetsPath, JSON.stringify(presets, null, 2));
}

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
