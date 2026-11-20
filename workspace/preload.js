// SPDX-License-Identifier: MIT
// Preload for the workspace window (sandboxed, contextIsolation): exposes exactly the
// `ElectronBridge` of @deepnest-next/workspace-ui as `window.deepnestHost`.
const { contextBridge, ipcRenderer } = require("electron");

const call = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld("deepnestHost", {
  backend: {
    inspect: call("dn:backend:inspect"),
    parseBom: call("dn:backend:parseBom"),
    startNest: call("dn:backend:startNest"),
    jobStatus: call("dn:backend:jobStatus"),
    jobResult: call("dn:backend:jobResult"),
  },
  host: {
    openFiles: call("dn:host:openFiles"),
    saveFile: call("dn:host:saveFile"),
    storageGet: call("dn:host:storageGet"),
    storageSet: call("dn:host:storageSet"),
    openExternal: call("dn:host:openExternal"),
    version: call("dn:host:version"),
  },
});
