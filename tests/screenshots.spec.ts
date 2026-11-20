/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { readdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// README screenshots. Not part of the normal suite; run on demand:
//   SCREENSHOTS=1 npx playwright test tests/screenshots.spec.ts
test.skip(
  !process.env.SCREENSHOTS,
  "set SCREENSHOTS=1 to refresh docs/screenshots",
);

// Sheet in mm, sized so the 54 letters fill it well.
const SHEET = { width: "185", height: "110" };
const outDir = path.resolve(__dirname, "..", "docs", "screenshots");

test("README screenshots", async () => {
  test.setTimeout(180_000);
  const userData = await mkdtemp(path.join(tmpdir(), "deepnest-shots-"));
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
    // Same window size on every machine, so the images stay comparable.
    await app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows().find((x) =>
        x.webContents.getURL().endsWith("/main/index.html"),
      );
      w?.unmaximize();
      w?.setContentSize(1440, 900);
      w?.center();
    });
    const shot = (name: string) =>
      win.screenshot({ path: path.join(outDir, `${name}.png`) });

    // mm, gravity, small gap: a realistic job for a 1:1 sheet.
    await win.locator("#config_tab").click();
    await win.locator("#config").getByRole("radio").nth(1).check();
    const spacing = win.locator('#config input[data-config="spacing"]');
    await spacing.fill("1");
    await spacing.blur();
    await win
      .locator('#config select[name="placementType"]')
      .selectOption("gravity");
    await win.locator("#home_tab").click();

    const inputDir = path.resolve(__dirname, "assets");
    const files = (await readdir(inputDir))
      .filter((f) => f.endsWith(".svg"))
      .map((f) => path.resolve(inputDir, f));
    await app.evaluate(({ dialog }, paths) => {
      dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({
        filePaths: paths,
        canceled: false,
      });
    }, files);
    await win.click("id=import");
    await expect(win.locator("#importsnav li")).toHaveCount(files.length);
    await win.click("id=addsheet");
    await win.fill("id=sheetwidth", SHEET.width);
    await win.fill("id=sheetheight", SHEET.height);
    await win.click("id=confirmsheet");
    await shot("parts");

    await win.locator("#config_tab").click();
    // Hover fills the right half with that setting's help text and diagram.
    await win.locator('#config select[name="placementType"]').hover();
    await shot("settings");
    await win.locator("#home_tab").click();

    await win.click("id=startnest");
    await expect(() =>
      expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText(
        /^(\d+)\/\1$/,
      ),
    ).toPass({ timeout: 120_000 });
    // Let the GA find a few better layouts before taking the picture.
    await expect(win.locator("id=nestlist").locator("span").nth(2)).toBeVisible(
      {
        timeout: 90_000,
      },
    );
    await win.locator("#stopnest").click();
    await expect(win.locator("#stopnest")).toHaveText("Start nest");

    // Toggle the class the dark-mode button sets; clicking it here would slide to another page.
    const setDark = (on: boolean) =>
      win.evaluate((on) => document.body.classList.toggle("dark-mode", on), on);
    await setDark(false);
    await shot("nest");
    await setDark(true);
    await shot("nest-dark");
  } finally {
    await app.close();
  }
});
