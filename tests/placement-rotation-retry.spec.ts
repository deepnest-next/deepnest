/* Engine check without Electron: placeParts retries other rotations (see the .cjs). */
import { test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "path";

test("a part with no room at its GA rotation is placed at another allowed rotation", () => {
  execFileSync(
    process.execPath,
    [path.join(__dirname, "placement-rotation-retry.cjs")],
    { stdio: "pipe" },
  );
});
