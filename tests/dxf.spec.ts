/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
/* DXF import and export through the local converter (@deepnest/dxf-converter). */
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dxfToSvg, svgToDxf } = require("@deepnest/dxf-converter");

/** Value of a DXF header variable. */
const header = (dxf: string, name: string) => {
  const lines = dxf.split(/\r?\n/).map((l) => l.trim());
  const i = lines.indexOf(name);
  return i < 0 ? undefined : lines[i + 2];
};

test("DXF import and AC1009/AC1018 export run locally", async ({}, testInfo) => {
  test.setTimeout(120_000);
  // Fixture: a 100 × 50 mm part with a hole, written as AC1018 (it declares mm).
  const dir = await mkdtemp(path.join(tmpdir(), "deepnest-dxf-"));
  const part = path.join(dir, "part.dxf");
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50">' +
    '<rect width="100" height="50" fill="none" stroke="#000"/><circle cx="50" cy="25" r="10" fill="none" stroke="#000"/></svg>';
  await writeFile(part, svgToDxf(Buffer.from(svg), { version: "AC1018" }));

  // Fresh profile, no notifications, and an unreachable conversion server: if anything
  // still went online, import/export would fail.
  const userData = path.join(dir, "profile");
  await mkdir(userData, { recursive: true });
  await writeFile(
    path.join(userData, "settings.json"),
    JSON.stringify({ showNotifications: false, conversionServer: "http://127.0.0.1:9/convert" }),
  );
  const app = await electron.launch({ args: ["main.js", `--user-data-dir=${userData}`] });
  const win = await app.firstWindow();
  await win.waitForFunction(() => typeof (window as unknown as { nest?: unknown }).nest === "object");

  await app.evaluate(({ dialog }, p) => {
    dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({ filePaths: [p], canceled: false });
  }, part);
  await win.click("id=import");
  await expect(win.locator("#importsnav li")).toHaveCount(1);

  await win.click("id=addsheet");
  await win.fill("id=sheetwidth", "300");
  await win.fill("id=sheetheight", "200");
  await win.click("id=confirmsheet");
  await win.click("id=startnest");
  await expect(() => expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText("1/1")).toPass({
    timeout: 60_000,
  });
  await win.locator("#stopnest").click();

  const exportDxf = async (name: string) => {
    const file = testInfo.outputPath(name);
    await app.evaluate(({ dialog }, p) => {
      dialog.showSaveDialogSync = () => p;
    }, file);
    await win.click("id=export");
    await win.click("id=exportdxf");
    await expect.poll(async () => (await readFile(file).catch(() => Buffer.alloc(0))).length).toBeGreaterThan(0);
    return readFile(file);
  };

  // Default: R12. "DXF export units" default 1 = inches.
  const r12 = (await exportDxf("nest-r12.dxf")).toString();
  expect(header(r12, "$ACADVER")).toBe("AC1009");

  await win.locator("#config_tab").click();
  await win.selectOption('select[data-config="dxfExportVersion"]', "AC1018");
  await win.locator("#home_tab").click();
  const r2004 = await exportDxf("nest-r2004.dxf");
  expect(header(r2004.toString(), "$ACADVER")).toBe("AC1018");
  expect(header(r2004.toString(), "$INSUNITS")).toBe("1"); // inches

  // The exported nest reads back at true size: the part is 100 × 50 mm, in whatever
  // orientation the nester chose.
  const back = dxfToSvg(r2004).svg as string;
  const [, , w, h] = (/viewBox="([^"]+)"/.exec(back)?.[1] ?? "").split(" ").map(Number);
  expect(Math.max(w, h)).toBeCloseTo(100, 1);
  expect(Math.min(w, h)).toBeCloseTo(50, 1);
  await app.close();
});
