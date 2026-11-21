/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// A 1000 mm box must import exactly as large as a 1000 mm sheet typed in (#137).
for (const useSvgPreProcessor of [false, true]) {
  test(`SVG import keeps mm sizes exact (svg pre-processor ${useSvgPreProcessor})`, async () => {
    // With the pre-processor on this needs @deepnest/svg-preprocessor >= 0.2.3 (f64 import;
    // 0.2.2 used usvg, which stores float32: 2834.6457 units).
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
      const pre = win.locator(
        '#config input[data-config="useSvgPreProcessor"]',
      );
      await pre.setChecked(useSvgPreProcessor);
      await expect(pre).toBeChecked({ checked: useSvgPreProcessor });
      await win.locator("#home_tab").click();

      const svg = path.resolve(
        __dirname,
        "assets",
        "svg-precision",
        "box-1000mm.svg",
      );
      await app.evaluate(
        ({ dialog }, paths) => {
          dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({
            filePaths: paths,
            canceled: false,
          });
        },
        [svg],
      );
      await win.click("id=import");
      await expect(win.locator("#parts tbody tr")).toHaveCount(1);
      await win.click("id=addsheet");
      await win.fill("id=sheetwidth", "1000");
      await win.fill("id=sheetheight", "1000");
      await win.click("id=confirmsheet");
      await expect(win.locator("#parts tbody tr")).toHaveCount(2);

      const sizes = await win.evaluate(() =>
        window.DeepNest.parts.map(
          (p: { polygontree: { x: number; y: number }[] }) => {
            const xs = p.polygontree.map((v) => v.x);
            const ys = p.polygontree.map((v) => v.y);
            return [
              Math.max(...xs) - Math.min(...xs),
              Math.max(...ys) - Math.min(...ys),
            ];
          },
        ),
      );
      console.log(
        `pre-processor ${useSvgPreProcessor}: part ${sizes[0]}, sheet ${sizes[1]}`,
      );
      // Both go through Clipper's 1e-7 grid: 2834.645669291339 becomes 2834.6456693.
      expect(sizes[1]).toEqual([2834.6456693, 2834.6456693]);
      expect(sizes[0]).toEqual(sizes[1]);
    } finally {
      await app.close();
    }
  });
}
