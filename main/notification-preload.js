// The notification window shows content fetched from the internet, so it runs sandboxed
// without Node; this is the only API it gets.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notification", {
  requestData: () => ipcRenderer.send("get-notification-data"),
  onData: (cb) => ipcRenderer.on("notification-data", (_event, data) => cb(data)),
  close: () => ipcRenderer.send("close-notification"),
});
