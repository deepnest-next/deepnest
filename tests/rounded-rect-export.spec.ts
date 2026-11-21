/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// Issue #160: rounded <rect> holes (rx/ry) must keep their rounded corners in the
// exported SVG, also when "merge lines" rebuilds the export from single segments.
// The reporter's part has 20 rounded holes; 3 copies give 240 corner arcs.
for (const mergeLines of [true, false]) {
  test(`Export keeps rounded rect corners (merge lines ${mergeLines})`, async ({}, testInfo) => {
    test.setTimeout(120_000);
    const userData = await mkdtemp(path.join(tmpdir(), "deepnest-test-"));
    await writeFile(
      path.join(userData, "settings.json"),
      JSON.stringify({ showNotifications: false }),
    );
    const app = await electron.launch({
      args: ["main.js", `--user-data-dir=${userData}`],
    });
    try {
      const win = await app.firstWindow();
      await win.waitForFunction(
        () =>
          typeof (window as unknown as { nest?: unknown }).nest === "object",
      );

      await win.locator("#config_tab").click();
      await win.locator("#config").getByRole("radio").nth(1).check(); // mm
      await win
        .locator('#config input[data-config="mergeLines"]')
        .setChecked(mergeLines);
      await expect
        .poll(() => win.evaluate(() => window.DeepNest.config().mergeLines))
        .toBe(mergeLines);
      await win.locator("#home_tab").click();

      const file = path.resolve(
        __dirname,
        "assets",
        "issue-160",
        "rounded-holes.svg",
      );
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
      const quantity = win
        .locator("#parts tbody tr")
        .nth(0)
        .locator('input[type="number"]');
      await quantity.fill("3");
      await quantity.blur();
      await expect
        .poll(() => win.evaluate(() => window.DeepNest.parts[0].quantity))
        .toBe(3);

      // A sheet for three parts stacked, in mm (the app stores 72 units per inch).
      const { width, height } = await win.evaluate(
        () => window.DeepNest.parts[0].bounds,
      );
      await win.click("id=addsheet");
      await win.fill(
        "id=sheetwidth",
        String(Math.ceil((width * 1.2 * 25.4) / 72)),
      );
      await win.fill(
        "id=sheetheight",
        String(Math.ceil((height * 3.6 * 25.4) / 72)),
      );
      await win.click("id=confirmsheet");

      await win.click("id=startnest");
      await expect(() =>
        expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText(
          "3/3",
        ),
      ).toPass({ timeout: 60_000 });
      await win.locator("#stopnest").click();

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

      // Corner arcs: arc commands in paths, plus 4 per <rect> that still has a radius.
      const pathArcs = [...svg.matchAll(/\sd="([^"]*)"/g)].reduce(
        (n, m) => n + (m[1].match(/[Aa]/g) || []).length,
        0,
      );
      const roundedRects = [...svg.matchAll(/<rect\b[^>]*>/g)].filter((m) =>
        /\br[xy]="(?!0")[\d.]+"/.test(m[0]),
      ).length;
      expect(pathArcs + 4 * roundedRects).toBe(240);
    } finally {
      await app.close();
    }
  });
}
