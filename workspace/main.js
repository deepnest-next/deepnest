// SPDX-License-Identifier: MIT
// Minimal entry that opens only the workspace window — for UI/shell development and the
// e2e tests, without deepnest's native NFP modules:  npx electron workspace/main.js
const { app } = require("electron");
const { registerWorkspace, openWorkspaceWindow } = require("./index");

registerWorkspace();
app.whenReady().then(openWorkspaceWindow);
app.on("window-all-closed", () => app.quit());
