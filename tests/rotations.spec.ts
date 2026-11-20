/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";
import { NestingResult } from "../index";

// Issue #189: rotations up to 360 (1° steps) must be accepted and actually nest.
test("Nest with 360 rotations", async () => {
  test.setTimeout(180_000);
  // Fresh profile, notifications off (see index.spec.ts for why).
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

    await test.step("Set rotations to 360", async () => {
      await win.locator("#config_tab").click();
      // mm, so the sheet below is a real 1:1 size and not inches.
      await win.locator("#config").getByRole("radio").nth(1).check();
      const rotations = win.locator('#config input[data-config="rotations"]');
      await rotations.fill("360");
      await rotations.blur();
      expect(
        await rotations.evaluate((el: HTMLInputElement) => el.checkValidity()),
      ).toBe(true);
      expect(await win.evaluate(() => window.DeepNest.config().rotations)).toBe(
        360,
      );
      await win.locator("#home_tab").click();
    });

    await test.step("Import parts and add sheet", async () => {
      const file = path.resolve(__dirname, "assets", "henny-penny.svg");
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
      await expect(win.locator("#importsnav li")).toHaveCount(1);
      await win.click("id=addsheet");
      // Tight enough that the 27 letters need real packing, not just free space.
      await win.fill("id=sheetwidth", "160");
      await win.fill("id=sheetheight", "100");
      await win.click("id=confirmsheet");
    });

    await win.click("id=startnest");
    await test.step("All parts placed", () =>
      expect(() =>
        expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText(
          /^(\d+)\/\1$/,
        ),
      ).toPass({ timeout: 150_000 }));

    // 1° steps: some result must land off the 90° grid that 4 rotations allow. The GA
    // starts at 0°, so wait for the mutants that try other angles.
    await expect
      .poll(
        () =>
          win.evaluate(() =>
            (window.DeepNest.nests as NestingResult[]).some((n) =>
              n.placements.some((p) =>
                p.sheetplacements.some((s) => s.rotation % 90 !== 0),
              ),
            ),
          ),
        { timeout: 60_000 },
      )
      .toBe(true);

    await win.locator("#stopnest").click();
    await win.screenshot({ path: test.info().outputPath("nest-360.png") });
  } finally {
    await app.close();
  }
});
