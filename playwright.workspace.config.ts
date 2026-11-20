// SPDX-License-Identifier: MIT
// Workspace window (Electron shell of @deepnest-next/workspace-ui) end-to-end tests.
// Needs rust-api-server on DEEPNEST_SERVER (default http://127.0.0.1:8000) and the UI
// release in workspace/ui/dist (npm run workspace:ui).
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/workspace",
  timeout: 90_000,
  workers: 1,
  reporter: [["list"]],
});
