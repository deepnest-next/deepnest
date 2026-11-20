/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import {
  _electron as electron,
  ElectronApplication,
  expect,
  Page,
  test,
} from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// Issue #161: the parts table columns must follow the parts panel width, and the
// nest result must fit the view and be zoomable/draggable instead of scrolling.

async function launch(): Promise<{ app: ElectronApplication; win: Page }> {
  const userData = await mkdtemp(path.join(tmpdir(), "deepnest-test-"));
  await writeFile(
    path.join(userData, "settings.json"),
    JSON.stringify({ showNotifications: false }),
  );
  const app = await electron.launch({
    args: ["main.js", `--user-data-dir=${userData}`],
  });
  const win = await app.firstWindow();
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(1280, 800),
  );
  await win.waitForFunction(
    () => typeof (window as unknown as { nest?: unknown }).nest === "object",
  );
  const file = path.resolve(__dirname, "assets", "issue-161", "issue-161.svg");
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
  await expect(win.locator("#parts tbody tr")).toHaveCount(6);
  return { app, win };
}

// Drag the right edge of the parts panel by dx pixels.
async function dragPanel(win: Page, dx: number) {
  const box = (await win.locator("#parts").boundingBox())!;
  const x = box.x + box.width - 3;
  const y = box.y + box.height / 2;
  await win.mouse.move(x, y);
  await win.mouse.down();
  await win.mouse.move(x + dx / 2, y, { steps: 5 });
  await win.mouse.move(x + dx, y, { steps: 5 });
  await win.mouse.up();
}

test("Parts table columns follow the panel width (#161)", async () => {
  const { app, win } = await launch();
  try {
    const qtyFits = () =>
      win.evaluate(() => {
        const panel = document.querySelector("#parts")!.getBoundingClientRect();
        const qty = document
          .querySelector("#parts tbody tr input[type=number]")!
          .getBoundingClientRect();
        return qty.right <= panel.right + 1;
      });
    expect(await qtyFits()).toBe(true);

    await dragPanel(win, 400);
    await dragPanel(win, -400);
    expect(await qtyFits()).toBe(true);
  } finally {
    await app.close();
  }
});

test("Nest result fits the view and can be zoomed and dragged (#161)", async () => {
  test.setTimeout(120_000);
  const { app, win } = await launch();
  try {
    const sheetRow = await win.evaluate(() => {
      const parts = window.DeepNest.parts;
      let best = 0;
      parts.forEach((p, i) => {
        if (p.bounds.height > parts[best].bounds.height) best = i;
      });
      return best;
    });
    await win
      .locator("#parts tbody tr")
      .nth(sheetRow)
      .locator('input[type="checkbox"]')
      .check();
    await win.click("id=startnest");
    await expect(() =>
      expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText("5/5"),
    ).toPass({ timeout: 90_000 });
    await win.locator("#stopnest").click();

    const sheetRect = () =>
      win.evaluate(() => {
        const r = document
          .querySelector("#nestsvg g.sheet.active")!
          .getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
    const display = (await win.locator("#nestdisplay").boundingBox())!;

    // The whole (tall) sheet is visible without scrolling.
    const fit = await sheetRect();
    expect(fit.y).toBeGreaterThanOrEqual(display.y - 1);
    expect(fit.y + fit.height).toBeLessThanOrEqual(
      display.y + display.height + 1,
    );
    // ...and keeps a margin to the right window edge.
    expect(fit.x + fit.width).toBeLessThanOrEqual(
      display.x + display.width - 16,
    );

    // Wheel up zooms in.
    await win.mouse.move(
      display.x + display.width / 2,
      display.y + display.height / 2,
    );
    await win.mouse.wheel(0, -300);
    await expect
      .poll(async () => (await sheetRect()).width)
      .toBeGreaterThan(fit.width * 1.2);

    // Dragging pans the view.
    const before = await sheetRect();
    await win.mouse.down();
    await win.mouse.move(
      display.x + display.width / 2 + 100,
      display.y + display.height / 2 + 50,
      { steps: 5 },
    );
    await win.mouse.up();
    const after = await sheetRect();
    expect(after.x - before.x).toBeCloseTo(100, -1);
    expect(after.y - before.y).toBeCloseTo(50, -1);

    // The zoom buttons work, and reset fits everything again.
    await win.locator("#nest .zoomin").click();
    expect((await sheetRect()).width).toBeGreaterThan(after.width * 1.1);
    await win.locator("#nest .zoomreset").click();
    const reset = await sheetRect();
    expect(reset.width).toBeCloseTo(fit.width, 0);
    expect(reset.y).toBeCloseTo(fit.y, 0);
  } finally {
    await app.close();
  }
});
