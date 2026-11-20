import { _electron as electron, expect, test } from "@playwright/test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// The file dialogs must be attached to the main window. Without a parent, one
// click on the window hides the dialog behind it (GNOME/Wayland) and the Import
// button keeps spinning until the user finds the dialog again.
test("Import dialog is attached to the main window", async () => {
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
    await app.evaluate(({ dialog, BrowserWindow }) => {
      const g = global as unknown as { parentIsMain?: boolean };
      dialog.showOpenDialog = (async (...args: unknown[]) => {
        // The main window shows index.html (the hidden worker window does not).
        g.parentIsMain =
          args[0] instanceof BrowserWindow &&
          args[0].webContents.getURL().endsWith("/main/index.html");
        return { canceled: true, filePaths: [] };
      }) as typeof dialog.showOpenDialog;
    });

    await win.click("id=import");
    await expect(win.locator("#import")).toHaveClass("button import");
    expect(
      await app.evaluate(
        () => (global as unknown as { parentIsMain?: boolean }).parentIsMain,
      ),
    ).toBe(true);
  } finally {
    await app.close();
  }
});
