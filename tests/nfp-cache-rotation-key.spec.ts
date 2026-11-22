/* Engine check without Electron: NFP cache keys per rotation (see the .cjs). */
import { test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "path";

test("NFP cache keys tell rotations apart and treat a full turn as 0", () => {
  execFileSync(
    process.execPath,
    [path.join(__dirname, "nfp-cache-rotation-key.cjs")],
    { stdio: "pipe" },
  );
});
