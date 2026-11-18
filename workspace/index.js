// SPDX-License-Identifier: MIT
/**
 * Workspace window (beta): hosts the shared deepnest workspace UI
 * (@deepnest-next/workspace-ui, Electron target, AGPL-3.0-or-later — fetched at build time
 * into workspace/ui/dist, see workspace/README.md) and implements its host contract:
 *
 *  - the UI runs sandboxed with contextIsolation; the preload exposes only `deepnestHost`;
 *  - files / dialogs / storage / links are served here in the main process;
 *  - conversion + nesting go over HTTP to rust-api-server (setting `DEEPNEST_SERVER`,
 *    default http://127.0.0.1:8000) — from the main process, so there is no CORS.
 *
 * Usage from main.js:  registerWorkspace() before `ready`, then openWorkspaceWindow().
 */
const { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const SCHEME = "deepnest-ui";
const UI_DIR = process.env.DEEPNEST_WORKSPACE_UI || path.join(__dirname, "ui", "dist");

/** True when the app was started with `--workspace` (or DEEPNEST_WORKSPACE=1). */
function workspaceRequested(argv = process.argv) {
  return argv.includes("--workspace") || process.env.DEEPNEST_WORKSPACE === "1";
}

function serverUrl() {
  return (process.env.DEEPNEST_SERVER || "http://127.0.0.1:8000").replace(/\/+$/, "");
}

/** Errors cross IPC as plain Errors; the UI decodes `code: message`. */
function hostError(code, message) {
  return new Error(`${code}: ${message}`);
}

async function api(pathname, init) {
  let res;
  try {
    res = await fetch(serverUrl() + pathname, init);
  } catch (e) {
    throw hostError(
      "unreachable",
      `Can't reach the nesting server at ${serverUrl()} — start rust-api-server (cargo run) or set DEEPNEST_SERVER. (${e.message})`,
    );
  }
  if (!res.ok && res.status !== 202) {
    let code = `http_${res.status}`;
    let message = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j.error) code = String(j.error).replace(/\s+/g, "_");
      if (j.reason) message = j.reason;
    } catch {
      /* not JSON */
    }
    throw hostError(code, message);
  }
  return res;
}

const json = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/** Backend: rust-api-server endpoints, payloads passed through unchanged. */
const backend = {
  async inspect(drawing) {
    const body = drawing.kind === "file" ? Buffer.from(drawing.data, "base64") : drawing.data;
    const res = await api("/v1/convert/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body,
    });
    return res.json();
  },
  async parseBom(input) {
    return ((await (await api("/v1/nest/bom/parse", json(input))).json()).rows) || [];
  },
  async startNest(request) {
    return (await (await api("/v1/nest/jobs/bom", json(request))).json()).job_id;
  },
  async jobStatus(id) {
    return (await api(`/v1/nest/jobs/${encodeURIComponent(id)}`)).json();
  },
  async jobResult(id) {
    const res = await api(`/v1/nest/jobs/${encodeURIComponent(id)}/result`);
    return { bytes: await res.arrayBuffer(), contentType: res.headers.get("content-type") || "application/octet-stream" };
  },
};

/** Small JSON key/value store in userData (the UI's autosave + prefs). */
function storeFile() {
  return path.join(app.getPath("userData"), "workspace-ui.json");
}
function readStore() {
  try {
    return JSON.parse(fs.readFileSync(storeFile(), "utf8"));
  } catch {
    return {};
  }
}

function hostHandlers(win) {
  return {
    async openFiles(accept, multiple) {
      const r = await dialog.showOpenDialog(win(), {
        properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
        filters: [{ name: "Files", extensions: accept.map((a) => a.replace(/^\./, "")) }],
      });
      if (r.canceled) return [];
      return r.filePaths.map((p) => {
        const buf = fs.readFileSync(p);
        return { name: path.basename(p), bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
      });
    },
    async saveFile(name, bytes) {
      const ext = path.extname(name).slice(1);
      const r = await dialog.showSaveDialog(win(), {
        defaultPath: name,
        filters: ext ? [{ name: ext.toUpperCase(), extensions: [ext] }] : [],
      });
      if (!r.canceled && r.filePath) fs.writeFileSync(r.filePath, Buffer.from(bytes));
    },
    async storageGet(key) {
      const v = readStore()[key];
      return typeof v === "string" ? v : null;
    },
    async storageSet(key, value) {
      const s = readStore();
      s[key] = String(value);
      fs.mkdirSync(path.dirname(storeFile()), { recursive: true });
      fs.writeFileSync(storeFile(), JSON.stringify(s));
    },
    async openExternal(url) {
      if (/^https:\/\//.test(url)) await shell.openExternal(url);
    },
    async version() {
      return app.getVersion();
    },
  };
}

let registered = false;
let workspaceWindow = null;

/** Call before `app` is ready: privileged scheme for the UI + IPC handlers. */
function registerWorkspace() {
  if (registered) return;
  registered = true;
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, codeCache: true } },
  ]);
  const host = hostHandlers(() => workspaceWindow);
  for (const [name, fn] of Object.entries(backend)) ipcMain.handle(`dn:backend:${name}`, (_e, ...a) => fn(...a));
  for (const [name, fn] of Object.entries(host)) ipcMain.handle(`dn:host:${name}`, (_e, ...a) => fn(...a));
  app.whenReady().then(() => {
    // deepnest-ui://app/<path> → files of the UI build; unknown paths fall back to index.html.
    protocol.handle(SCHEME, (req) => {
      const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, "") || "index.html";
      const file = path.resolve(UI_DIR, rel);
      const inside = file.startsWith(path.resolve(UI_DIR) + path.sep);
      const target = inside && fs.existsSync(file) ? file : path.join(UI_DIR, "index.html");
      return net.fetch(pathToFileURL(target).toString());
    });
  });
}

/** Open (or focus) the workspace window. */
function openWorkspaceWindow() {
  if (workspaceWindow) {
    workspaceWindow.focus();
    return workspaceWindow;
  }
  if (!fs.existsSync(path.join(UI_DIR, "index.html"))) {
    dialog.showErrorBox(
      "Workspace UI not installed",
      `No workspace UI build in ${UI_DIR}.\nRun: npm run workspace:ui`,
    );
  }
  workspaceWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "deepnest workspace",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  workspaceWindow.setMenu(null);
  workspaceWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  workspaceWindow.once("ready-to-show", () => workspaceWindow && workspaceWindow.show());
  workspaceWindow.on("closed", () => (workspaceWindow = null));
  workspaceWindow.loadURL(`${SCHEME}://app/index.html`);
  return workspaceWindow;
}

module.exports = { registerWorkspace, openWorkspaceWindow, workspaceRequested, SCHEME, UI_DIR };
