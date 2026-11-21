/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import {
  ElectronApplication,
  Page,
  _electron as electron,
  expect,
  test,
} from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { createServer } from "node:http";
import { AddressInfo } from "node:net";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// Issue #160: rounded <rect> holes (rx/ry) must keep their rounded corners in the
// exported SVG/DXF, also when "merge lines" rebuilds the export from single segments.
// The reporter's part has 20 rounded holes; 3 copies give 240 corner arcs.
const file = path.resolve(
  __dirname,
  "assets",
  "issue-160",
  "rounded-holes.svg",
);

async function launch(
  settings: Record<string, unknown> = {},
): Promise<{ app: ElectronApplication; win: Page }> {
  const userData = await mkdtemp(path.join(tmpdir(), "deepnest-test-"));
  await writeFile(
    path.join(userData, "settings.json"),
    JSON.stringify({ showNotifications: false, ...settings }),
  );
  const app = await electron.launch({
    args: ["main.js", `--user-data-dir=${userData}`],
  });
  const win = await app.firstWindow();
  await win.waitForFunction(
    () => typeof (window as unknown as { nest?: unknown }).nest === "object",
  );
  return { app, win };
}

async function importPart(app: ElectronApplication, win: Page) {
  await app.evaluate(
    ({ dialog }, paths) => {
      dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({
        filePaths: paths,
        canceled: false,
      });
    },
    [file],
  );
  await win.click("id=import");
  await expect(win.locator("#parts tbody tr")).toHaveCount(1);
}

/** Nest 3 copies of the reporter's part on a sheet that fits them stacked. */
async function nestThree(win: Page, mergeLines: boolean) {
  await win.locator("#config_tab").click();
  await win.locator("#config").getByRole("radio").nth(1).check(); // mm
  await win
    .locator('#config input[data-config="mergeLines"]')
    .setChecked(mergeLines);
  await expect
    .poll(() => win.evaluate(() => window.DeepNest.config().mergeLines))
    .toBe(mergeLines);
  await win.locator("#home_tab").click();
  const quantity = win
    .locator("#parts tbody tr")
    .nth(0)
    .locator('input[type="number"]');
  await quantity.fill("3");
  await quantity.blur();
  await expect
    .poll(() => win.evaluate(() => window.DeepNest.parts[0].quantity))
    .toBe(3);

  // In mm (the app stores 72 units per inch).
  const { width, height } = await win.evaluate(
    () => window.DeepNest.parts[0].bounds,
  );
  await win.click("id=addsheet");
  await win.fill("id=sheetwidth", String(Math.ceil((width * 1.2 * 25.4) / 72)));
  await win.fill(
    "id=sheetheight",
    String(Math.ceil((height * 3.6 * 25.4) / 72)),
  );
  await win.click("id=confirmsheet");

  await win.click("id=startnest");
  await expect(() =>
    expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText("3/3"),
  ).toPass({ timeout: 60_000 });
  await win.locator("#stopnest").click();
}

/** Corner arcs: arc commands in paths, plus 4 per <rect> that still has a radius. */
function cornerArcs(svg: string): number {
  const pathArcs = [...svg.matchAll(/\sd="([^"]*)"/g)].reduce(
    (n, m) => n + (m[1].match(/[Aa]/g) || []).length,
    0,
  );
  const roundedRects = [...svg.matchAll(/<rect\b[^>]*>/g)].filter((m) =>
    /\br[xy]="(?!0")[\d.]+"/.test(m[0]),
  ).length;
  return pathArcs + 4 * roundedRects;
}

for (const mergeLines of [true, false]) {
  test(`SVG export keeps rounded rect corners (merge lines ${mergeLines})`, async ({}, testInfo) => {
    test.setTimeout(120_000);
    const { app, win } = await launch();
    try {
      await importPart(app, win);
      await nestThree(win, mergeLines);

      const out = testInfo.outputPath("output.svg");
      await app.evaluate(({ dialog }, p) => {
        dialog.showSaveDialogSync = () => p;
      }, out);
      await win.click("id=export");
      await expect(win.locator("id=exportsvg")).toBeVisible();
      await win.click("id=exportsvg");
      await expect
        .poll(() => readFile(out, "utf8").catch(() => ""))
        .toContain("</svg>");
      const svg = await readFile(out, "utf8");
      await testInfo.attach("output.svg", {
        body: svg,
        contentType: "image/svg+xml",
      });
      expect(cornerArcs(svg)).toBe(240);
    } finally {
      await app.close();
    }
  });
}

// DXF goes through the conversion server, which converts the SVG deepnest sends it.
// A mock server records that SVG; it must carry the same 240 corner arcs.
test("DXF export sends rounded rect corners to the converter", async ({}, testInfo) => {
  test.setTimeout(120_000);
  const uploads: string[] = [];
  const mock = createServer((req, res) => {
    let body = "";
    req.setEncoding("latin1");
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      uploads.push(body);
      res.setHeader("X-Convert-Mm-Per-Unit", "1");
      res.end("DXF");
    });
  });
  await new Promise<void>((r) => mock.listen(0, "127.0.0.1", r));
  const port = (mock.address() as AddressInfo).port;
  const { app, win } = await launch({
    conversionServer: `http://127.0.0.1:${port}/convert`,
  });
  try {
    await importPart(app, win);
    await nestThree(win, true);
    const out = testInfo.outputPath("nest.dxf");
    await app.evaluate(({ dialog }, p) => {
      dialog.showSaveDialogSync = () => p;
    }, out);
    await win.click("id=export");
    await win.click("id=exportdxf");
    await expect
      .poll(async () => (await readFile(out).catch(() => "")).toString())
      .not.toBe("");
    expect(uploads.length).toBeGreaterThan(0);
    const svg = uploads[0].match(/<svg[\s\S]*<\/svg>/)![0];
    await testInfo.attach("sent.svg", {
      body: svg,
      contentType: "image/svg+xml",
    });
    expect(cornerArcs(svg)).toBe(240);
  } finally {
    await app.close();
    mock.close();
  }
});

// The nesting geometry of a rounded hole must follow its corners. A sharp 4-point
// rectangle is larger than the real hole, so a part nested into the hole could cut
// into the corner material.
test("Imported rounded rect holes keep their rounded geometry", async () => {
  test.setTimeout(60_000);
  const { app, win } = await launch();
  try {
    await importPart(app, win);
    const holes = await win.evaluate(() => {
      const tree = (
        window.DeepNest.parts[0] as unknown as {
          polygontree: { children?: { x: number; y: number }[][] };
        }
      ).polygontree;
      return (tree.children || []).map((h) => h.length);
    });
    expect(holes).toHaveLength(20);
    for (const n of holes) expect(n).toBeGreaterThan(4);
  } finally {
    await app.close();
  }
});

// splitLines on a rounded rect that has no transform (applyTransform leaves such a
// rect alone, so splitLines sees the <rect> itself): the corners must stay arcs.
test("splitLines keeps the arcs of an untransformed rounded rect", async () => {
  test.setTimeout(60_000);
  const { app, win } = await launch();
  try {
    // Set by a module script in index.html, which can finish after window.nest.
    await win.waitForFunction(() => "SvgParser" in window);
    const result = await win.evaluate(() => {
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg") as SVGSVGElement;
      const rect = document.createElementNS(ns, "rect");
      for (const [k, v] of Object.entries({
        x: "0",
        y: "0",
        width: "40",
        height: "20",
        rx: "5",
      }))
        rect.setAttribute(k, v);
      svg.appendChild(rect);
      document.body.appendChild(svg);
      (
        window as unknown as {
          SvgParser: { splitLines(svg: SVGSVGElement): void };
        }
      ).SvgParser.splitLines(svg);
      const children = Array.from(svg.children);
      svg.remove();
      return {
        rects: children.filter((c) => c.tagName === "rect").length,
        lines: children.filter((c) => c.tagName === "line").length,
        arcs: children
          .map((c) => c.getAttribute("d") || "")
          .join(" ")
          .match(/[Aa]/g)?.length,
      };
    });
    expect(result).toEqual({ rects: 0, lines: 4, arcs: 4 });
  } finally {
    await app.close();
  }
});
