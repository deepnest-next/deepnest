// SPDX-License-Identifier: MIT
import { _electron as electron, expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
const fixture = (name: string) => path.join(__dirname, "fixtures", name);

test("workspace window: import → nest → export through the Electron host", async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "dn-ws-"));
  const app = await electron.launch({
    args: ["--no-sandbox", path.join(root, "workspace/main.js"), `--user-data-dir=${userData}`],
    env: { ...process.env, DEEPNEST_SERVER: process.env.DEEPNEST_SERVER ?? "http://127.0.0.1:8000" },
  });
  try {
    const win = await app.firstWindow();
    await expect(win.getByText("Press Nest to run the engine.")).toBeVisible();

    // Sandboxed renderer: the bridge exists, Node does not.
    expect(await win.evaluate(() => typeof (window as unknown as { deepnestHost: unknown }).deepnestHost)).toBe("object");
    expect(await win.evaluate(() => typeof (globalThis as unknown as { require?: unknown }).require)).toBe("undefined");

    // Native open dialog → two drawings (stubbed in the main process).
    await app.evaluate(({ dialog }, files) => {
      dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: files })) as typeof dialog.showOpenDialog;
    }, [fixture("slot.dxf"), fixture("plate.svg")]);
    await win.getByRole("button", { name: /Add DXF/ }).click();
    await expect(win.getByTestId("part-card")).toHaveCount(2);
    await win.getByTestId("part-card").first().click();
    await expect(win.getByTestId("inspector")).toContainText("source units");

    await win.getByTestId("nest").click();
    await expect(win.getByTestId("nest-status")).toContainText("placed", { timeout: 60_000 });
    await expect(win.getByTestId("phase")).toHaveText("live nest · done");
    expect(await win.getByTestId("sheet").locator("polygon.outer").count()).toBeGreaterThan(0);

    // Native save dialog → DXF written by the main process.
    const out = path.join(userData, "nest.dxf");
    await app.evaluate(({ dialog }, file) => {
      dialog.showSaveDialog = (async () => ({ canceled: false, filePath: file })) as typeof dialog.showSaveDialog;
    }, out);
    await win.getByTestId("export").click();
    await expect.poll(() => fs.existsSync(out) && fs.readFileSync(out, "utf8").includes("SECTION"), { timeout: 30_000 }).toBe(true);

    // Autosave goes to the host's JSON store.
    await expect
      .poll(() => {
        try {
          return JSON.parse(fs.readFileSync(path.join(userData, "workspace-ui.json"), "utf8"))["dn-job"]?.includes("slot");
        } catch {
          return false;
        }
      })
      .toBe(true);
  } finally {
    await app.close();
  }
});

test("deepnest main.js opens the workspace window with --workspace", async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "dn-ws-main-"));
  const app = await electron.launch({
    args: ["--no-sandbox", root, "--workspace", `--user-data-dir=${userData}`],
    env: { ...process.env, DEEPNEST_SERVER: process.env.DEEPNEST_SERVER ?? "http://127.0.0.1:8000" },
  });
  try {
    const win = await app.firstWindow();
    await expect(win.getByTestId("nest")).toBeVisible();
    expect(await win.title()).toContain("deepnest");
    expect(app.windows()).toHaveLength(1); // the classic UI and its background workers are not started
  } finally {
    await app.close();
  }
});
