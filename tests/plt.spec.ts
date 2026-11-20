/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
/* PLT (HPGL) export: what the README promises for plotters and cutters. */
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

const UNITS_PER_MM = 1016 / 25.4; // HPGL plotter units

/** Paths of an HPGL file: each PU x,y; PD x,y,...; run, in mm. */
function hpglPaths(hpgl: string): { x: number; y: number }[][] {
  const paths: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] | null = null;
  for (const cmd of hpgl.split(";").map((c) => c.trim())) {
    const nums = cmd.slice(2).split(",").filter(Boolean).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2)
      pts.push({ x: nums[i] / UNITS_PER_MM, y: nums[i + 1] / UNITS_PER_MM });
    if (cmd.startsWith("PU") && pts.length) paths.push((current = [pts[0]]));
    else if (cmd.startsWith("PD") && current) current.push(...pts);
  }
  return paths;
}

const size = (pts: { x: number; y: number }[]) => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const [w, h] = [
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  ];
  return [Math.max(w, h), Math.min(w, h)];
};

test("the HPGL generator's own checks pass", () => {
  // tests/hpgl.cjs was not part of `npm test`; run it here so CI does.
  execFileSync(process.execPath, [path.join(__dirname, "hpgl.cjs")], {
    stdio: "pipe",
  });
});

test("PLT export: a nested part comes out at true size, outlines closed", async ({}, testInfo) => {
  test.setTimeout(120_000);
  const dir = await mkdtemp(path.join(tmpdir(), "deepnest-plt-"));
  const userData = path.join(dir, "profile");
  await mkdir(userData, { recursive: true });
  await writeFile(
    path.join(userData, "settings.json"),
    JSON.stringify({
      showNotifications: false,
      exportWithSheetBoundboarders: true,
    }),
  );
  // 100 × 50 mm plate with a Ø 20 mm hole.
  const part = path.join(dir, "plate.svg");
  await writeFile(
    part,
    '<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50">' +
      '<rect width="100" height="50" fill="none" stroke="#000"/><circle cx="50" cy="25" r="10" fill="none" stroke="#000"/></svg>',
  );

  const app = await electron.launch({
    args: ["main.js", `--user-data-dir=${userData}`],
  });
  const win = await app.firstWindow();
  await win.waitForFunction(
    () => typeof (window as unknown as { nest?: unknown }).nest === "object",
  );
  await app.evaluate(({ dialog }, p) => {
    dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({
      filePaths: [p],
      canceled: false,
    });
  }, part);
  await win.click("id=import");
  await expect(win.locator("#importsnav li")).toHaveCount(1);
  await win.click("id=addsheet");
  await win.fill("id=sheetwidth", "300");
  await win.fill("id=sheetheight", "200");
  await win.click("id=confirmsheet");
  await win.click("id=startnest");
  await expect(() =>
    expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText("1/1"),
  ).toPass({
    timeout: 60_000,
  });
  await win.locator("#stopnest").click();

  const file = testInfo.outputPath("nest.plt");
  await app.evaluate(({ dialog }, p) => {
    dialog.showSaveDialogSync = () => p;
  }, file);
  await win.click("id=export");
  await win.click("id=exportplt");
  await expect
    .poll(
      async () => (await readFile(file).catch(() => Buffer.alloc(0))).length,
    )
    .toBeGreaterThan(0);
  const hpgl = (await readFile(file)).toString();
  await app.close();

  expect(hpgl.startsWith("IN;")).toBe(true);
  expect(hpgl.trimEnd().endsWith("SP0;")).toBe(true);
  const paths = hpglPaths(hpgl);
  const sizes = paths.map((p) => size(p).map((v) => Math.round(v * 10) / 10));
  // The plate and its hole, in whatever orientation the nester chose (0.1 mm), and the sheet
  // outline (exported in its own <g id="layer-SHEET">, which must survive flattening).
  expect(sizes).toContainEqual([100, 50]);
  expect(paths).toHaveLength(3);
  expect(Math.max(...sizes.map((s) => s[0]))).toBeGreaterThan(100);
  expect(
    sizes.some(([w, h]) => Math.abs(w - 20) < 0.2 && Math.abs(h - 20) < 0.2),
  ).toBe(true);
  // Closed outlines return to their start (a plotter would leave a gap otherwise).
  for (const p of paths) {
    const [a, b] = [p[0], p[p.length - 1]];
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.05);
  }
  // Everything lies in the positive quadrant of the plotter.
  for (const p of paths)
    for (const q of p) expect(Math.min(q.x, q.y)).toBeGreaterThanOrEqual(-0.05);
});
