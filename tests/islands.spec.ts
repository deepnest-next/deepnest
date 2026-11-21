/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// A closed outline inside another part's hole is a part of its own (an "island"; parts
// drawn inside a cut-out, as in model-kit DXFs). It stayed attached to the outer part:
// never nested, its area counted as free hole space, so other parts were nested on top
// of it, hidden in the nest view (hole fill) but drawn in the export.
test("An outline inside a hole is its own part", async () => {
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
      () => typeof (window as unknown as { nest?: unknown }).nest === "object",
    );
    await win.locator("#config_tab").click();
    await win.locator("#config").getByRole("radio").nth(1).check(); // mm
    await win.locator("#home_tab").click();

    const file = path.resolve(
      __dirname,
      "assets",
      "islands",
      "frame-with-island.svg",
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
    await expect(win.locator("#parts tbody tr")).toHaveCount(2);

    // Frame: its outline and its hole. Island: its outline and the line on it.
    const parts = await win.evaluate(() =>
      window.DeepNest.parts.map((p) => ({
        width: Math.round((p.bounds.width / 72) * 25.4),
        holes: (
          (p as unknown as { polygontree: { children?: unknown[] } })
            .polygontree.children || []
        ).length,
        elements: p.svgelements.map((e) => e.tagName),
      })),
    );
    expect(parts).toEqual([
      { width: 100, holes: 1, elements: ["path", "path"] },
      { width: 30, holes: 0, elements: ["path", "line"] },
    ]);

    // On a sheet the frame fills exactly, the island only fits in the frame's hole.
    await win.click("id=addsheet");
    await win.fill("id=sheetwidth", "100");
    await win.fill("id=sheetheight", "60");
    await win.click("id=confirmsheet");
    await win.click("id=startnest");
    await expect(() =>
      expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText("2/2"),
    ).toPass({ timeout: 60_000 });
    await win.locator("#stopnest").click();
  } finally {
    await app.close();
  }
});
