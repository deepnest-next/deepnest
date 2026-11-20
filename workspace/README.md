# Workspace window (beta)

The workspace window hosts the shared **deepnest workspace UI**
([deepnest-next/workspace-ui](https://github.com/deepnest-next/workspace-ui), Electron target).
The same UI also runs in the deepnest-next desktop app (Tauri) and on rust-api-server (`/app`).

```sh
npm run workspace:ui       # download + verify the UI release pinned in workspace-ui.lock → workspace/ui/dist
npm run start:workspace    # electron . --workspace   (or DEEPNEST_WORKSPACE=1)
```

**Nesting server.** Conversion and nesting go to **rust-api-server**
(`DEEPNEST_SERVER`, default `http://127.0.0.1:8000`). The calls are made from the main
process, so CORS does not apply.

## How it is wired

| Piece | File |
|---|---|
| Privileged `deepnest-ui://` scheme serving `workspace/ui/dist` | `index.js` (`registerWorkspace`) |
| Window with `contextIsolation`, `sandbox`, no Node in the renderer | `index.js` (`openWorkspaceWindow`) |
| Preload exposing exactly `window.deepnestHost` (the UI's `ElectronBridge`) | `preload.js` |
| Host: open/save dialogs, file read/write, JSON store (`userData/workspace-ui.json`), https links | `index.js` (`hostHandlers`) |
| Backend: `/v1/convert/inspect`, `/v1/nest/bom/parse`, `/v1/nest/jobs/bom` (+ status, result) | `index.js` (`backend`) |
| Minimal entry for development and tests, without the native NFP modules | `main.js` |

**Errors.** Errors reach the UI as `"<code>: <message>"`, for example
`unreachable: Can't reach the nesting server …`.

**Developing the UI and the shell together.** Run `bun run dev:electron:host` in
workspace-ui, then start Electron with
`DEEPNEST_WORKSPACE_UI=<path to a build>` (for example `../workspace-ui/dist/electron` after
`bun run build:electron`). To use a local build instead of the release, set
`WORKSPACE_UI_DIST` when running `npm run workspace:ui`.

## Tests

```sh
npm run workspace:ui
(cd ../rust-api-server && cargo run) &      # the nesting server
xvfb-run -a npm run test:workspace          # Playwright + Electron
```

The tests drive the real window. File dialogs are stubbed in the main process.

1. Import a DXF and an SVG; check the preview and units.
2. Nest.
3. Export a DXF to disk.
4. Check that autosave reaches the store.
5. Check that `electron . --workspace` opens only this window.

## Licence

The shell code in this folder is MIT, like the rest of deepnest. The UI build it loads
(`workspace/ui/dist`, fetched at build time, not part of this repository) is
**AGPL-3.0-or-later**. Distributing it means meeting the AGPL for that component; its
source is the public release tag of deepnest-next/workspace-ui.
