/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
/* DXF import and export through the local converter (@deepnest/dxf-converter). */
import {
  _electron as electron,
  ElectronApplication,
  expect,
  Page,
  test,
  TestInfo,
} from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { AddressInfo } from "node:net";
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

/** Size (long side, short side) of every closed outline in an SVG the converter wrote. */
const outlines = (svg: string) =>
  [...svg.matchAll(/<path d="([^"]+)"/g)].map(([, d]) => {
    const pts = [...d.matchAll(/[ML]\s*(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const [w, h] = [
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
    ];
    return [Math.max(w, h), Math.min(w, h)].map((v) => Math.round(v * 10) / 10);
  });

/**
 * Start deepnest with a fresh profile and no notifications. The conversion server is a local
 * stub that records every request: the DXF tests assert it received none (nothing went online).
 */
async function start(settings: Record<string, unknown> = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "deepnest-dxf-"));
  const requests: string[] = [];
  const stub = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    res.writeHead(500).end();
  });
  await new Promise<void>((ok) => stub.listen(0, "127.0.0.1", ok));
  const { port } = stub.address() as AddressInfo;
  const userData = path.join(dir, "profile");
  await mkdir(userData, { recursive: true });
  await writeFile(
    path.join(userData, "settings.json"),
    JSON.stringify({
      showNotifications: false,
      conversionServer: `http://127.0.0.1:${port}/convert`,
      ...settings,
    }),
  );
  const app = await electron.launch({
    args: ["main.js", `--user-data-dir=${userData}`],
  });
  const win = await app.firstWindow();
  await win.waitForFunction(
    () => typeof (window as unknown as { nest?: unknown }).nest === "object",
  );
  return { app, win, dir, requests, stub };
}

async function importAndNest(
  app: ElectronApplication,
  win: Page,
  files: string[],
) {
  await app.evaluate(({ dialog }, paths) => {
    dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({
      filePaths: paths,
      canceled: false,
    });
  }, files);
  await win.click("id=import");
  await expect(win.locator("#importsnav li")).toHaveCount(files.length);
  await win.click("id=addsheet");
  await win.fill("id=sheetwidth", "300");
  await win.fill("id=sheetheight", "200");
  await win.click("id=confirmsheet");
  await win.click("id=startnest");
  const n = `${files.length}/${files.length}`;
  await expect(() =>
    expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText(n),
  ).toPass({
    timeout: 60_000,
  });
  await win.locator("#stopnest").click();
}

async function exportDxf(
  app: ElectronApplication,
  win: Page,
  testInfo: TestInfo,
  name: string,
) {
  const file = testInfo.outputPath(name);
  await app.evaluate(({ dialog }, p) => {
    dialog.showSaveDialogSync = () => p;
  }, file);
  await win.click("id=export");
  await win.click("id=exportdxf");
  await expect
    .poll(
      async () => (await readFile(file).catch(() => Buffer.alloc(0))).length,
    )
    .toBeGreaterThan(0);
  return readFile(file);
}

test("DXF import and AC1009/AC1018 export run locally", async ({}, testInfo) => {
  test.setTimeout(120_000);
  const { app, win, dir, requests, stub } = await start();
  // Fixture: a 100 × 50 mm part with a hole, written as AC1018 (it declares mm).
  const part = path.join(dir, "part.dxf");
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50">' +
    '<rect width="100" height="50" fill="none" stroke="#000"/><circle cx="50" cy="25" r="10" fill="none" stroke="#000"/></svg>';
  await writeFile(
    part,
    await svgToDxf(Buffer.from(svg), { version: "AC1018" }),
  );
  await importAndNest(app, win, [part]);

  // Default: R12. "DXF export units" default 1 = inches.
  const r12 = (await exportDxf(app, win, testInfo, "nest-r12.dxf")).toString();
  expect(header(r12, "$ACADVER")).toBe("AC1009");

  await win.locator("#config_tab").click();
  await win.selectOption('select[data-config="dxfExportVersion"]', "AC1018");
  await win.locator("#home_tab").click();
  const r2004 = await exportDxf(app, win, testInfo, "nest-r2004.dxf");
  expect(header(r2004.toString(), "$ACADVER")).toBe("AC1018");
  expect(header(r2004.toString(), "$INSUNITS")).toBe("1"); // inches

  // The exported nest reads back at true size, in whatever orientation the nester chose.
  expect(outlines((await dxfToSvg(r2004)).svg)).toContainEqual([100, 50]);
  await app.close();
  stub.close();
  expect(requests, "requests to the conversion server").toEqual([]);
});

test("R12 without units uses 'DXF import units'; mm export; CSS-only outlines are kept", async ({}, testInfo) => {
  test.setTimeout(120_000);
  // "DXF import units" = mm (points per unit) and "DXF export units" = mm (units per inch).
  // No line merging, so every part keeps its own outline to measure.
  const { app, win, dir, requests, stub } = await start({
    dxfImportScale: 2.83465,
    dxfExportScale: 25.4,
    mergeLines: false,
  });
  // R12 has no $INSUNITS: these are 100 × 50 bare numbers, mm by the setting.
  const r12part = path.join(dir, "r12.dxf");
  const numbers =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50">' +
    '<rect width="100" height="50" fill="none" stroke="#f00"/></svg>';
  await writeFile(
    r12part,
    await svgToDxf(Buffer.from(numbers), { version: "AC1009" }),
  );
  // An SVG part whose stroke sits on a group: deepnest flattens groups, so the exported path
  // is fill="none" without a stroke of its own.
  const svgPart = path.join(dir, "grouped.svg");
  await writeFile(
    svgPart,
    '<svg xmlns="http://www.w3.org/2000/svg" width="60mm" height="30mm" viewBox="0 0 60 30">' +
      '<g stroke="#000"><path fill="none" d="M0 0 L60 0 L60 30 L0 30 Z"/></g></svg>',
  );
  await importAndNest(app, win, [r12part, svgPart]);

  for (const version of ["AC1009", "AC1018"]) {
    await win.locator("#config_tab").click();
    await win.selectOption('select[data-config="dxfExportVersion"]', version);
    await win.locator("#home_tab").click();
    const dxf = await exportDxf(app, win, testInfo, `nest-mm-${version}.dxf`);
    expect(header(dxf.toString(), "$ACADVER")).toBe(version);
    if (version === "AC1018")
      expect(header(dxf.toString(), "$INSUNITS")).toBe("4"); // mm
    // In mm (R12: bare numbers, read as mm): both parts at their size, the grouped one included.
    const parts = outlines((await dxfToSvg(dxf)).svg);
    expect(parts, version).toContainEqual([100, 50]);
    expect(parts, version).toContainEqual([60, 30]);
  }
  await app.close();
  stub.close();
  expect(requests, "requests to the conversion server").toEqual([]);
});

test("file names and converter errors are shown as text, never as HTML", async () => {
  test.setTimeout(60_000);
  const { app, win, dir, requests, stub } = await start({
    showNotifications: true,
  });
  // Linux/macOS allow < > in file names; message() renders HTML in a renderer with Node.
  const name = "<img src=x onerror=window.__pwned=1>.dxf";
  const file = path.join(dir, name);
  await writeFile(file, "0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n"); // valid, but empty
  await app.evaluate(({ dialog }, p) => {
    dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({
      filePaths: [p],
      canceled: false,
    });
  }, file);
  await win.click("id=import");
  await expect(win.locator("#messagecontent")).toContainText(name);
  await expect(win.locator("#messagecontent")).toContainText(
    "nothing we can convert",
  );
  expect(
    await win.evaluate(
      () => (window as unknown as { __pwned?: number }).__pwned,
    ),
  ).toBeUndefined();
  expect(await win.locator("#messagecontent img").count()).toBe(0);
  await app.close();
  stub.close();
  expect(requests, "requests to the conversion server").toEqual([]);
});
