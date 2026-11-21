/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";
import { NestingResult } from "../index";

// Issue #137: parts that fill a 1000 x 1000 mm sheet exactly must be placed.
const cases = [
  { file: "box-1000x1000.svg", parts: 1 },
  { file: "two-500x1000.svg", parts: 2 },
];
for (const { file, parts } of cases)
  for (const simplify of [false, true])
    for (const rotations of [4, 360]) {
      test(`Exact fit ${file} on 1000 x 1000 mm (simplify ${simplify}, ${rotations} rotations)`, async () => {
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
              typeof (window as unknown as { nest?: unknown }).nest ===
              "object",
          );

          await win.locator("#config_tab").click();
          await win.locator("#config").getByRole("radio").nth(1).check(); // mm
          await win
            .locator('#config input[data-config="simplify"]')
            .setChecked(simplify);
          await expect
            .poll(() => win.evaluate(() => window.DeepNest.config().simplify))
            .toBe(simplify);
          const rot = win.locator('#config input[data-config="rotations"]');
          await rot.fill(String(rotations));
          await rot.blur();
          await expect
            .poll(() => win.evaluate(() => window.DeepNest.config().rotations))
            .toBe(rotations);
          await win.locator("#home_tab").click();

          const svg = path.resolve(__dirname, "assets", "issue-137", file);
          await app.evaluate(
            ({ dialog }, paths) => {
              dialog.showOpenDialog =
                async (): Promise<OpenDialogReturnValue> => ({
                  filePaths: paths,
                  canceled: false,
                });
            },
            [svg],
          );
          await win.click("id=import");
          await expect(win.locator("#parts tbody tr")).toHaveCount(parts);

          await win.click("id=addsheet");
          await win.fill("id=sheetwidth", "1000");
          await win.fill("id=sheetheight", "1000");
          await win.click("id=confirmsheet");
          await expect(win.locator("#parts tbody tr")).toHaveCount(parts + 1);

          await win.click("id=startnest");
          await expect(() =>
            expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText(
              `${parts}/${parts}`,
            ),
          ).toPass({ timeout: 60_000 });
          await win.locator("#stopnest").click();

          // The best result places all parts; no result has a part outside the sheet.
          // (A GA individual with one part turned 90 degrees places fewer, as with any fit.)
          const results = await win.evaluate(() => {
            const w = window as unknown as {
              ClipperLib: any; // eslint-disable-line @typescript-eslint/no-explicit-any
            };
            const C = w.ClipperLib;
            const scale = 1e6;
            const toPath = (pts: { x: number; y: number }[]) =>
              pts.map((p) => new C.IntPoint(p.x * scale, p.y * scale));
            const all = window.DeepNest.parts;
            return (window.DeepNest.nests as NestingResult[]).map((nest) => {
              let placed = 0;
              let outside = 0;
              for (const s of nest.placements) {
                const sheet = toPath(all[s.sheet].polygontree);
                for (const p of s.sheetplacements) {
                  placed++;
                  const a = (p.rotation * Math.PI) / 180;
                  const poly = all[p.source].polygontree.map((v) => ({
                    x: v.x * Math.cos(a) - v.y * Math.sin(a) + p.x,
                    y: v.x * Math.sin(a) + v.y * Math.cos(a) + p.y,
                  }));
                  const c = new C.Clipper();
                  c.AddPath(toPath(poly), C.PolyType.ptSubject, true);
                  c.AddPath(sheet, C.PolyType.ptClip, true);
                  const diff = new C.Paths();
                  c.Execute(
                    C.ClipType.ctDifference,
                    diff,
                    C.PolyFillType.pftNonZero,
                    C.PolyFillType.pftNonZero,
                  );
                  const out = diff.reduce(
                    (sum: number, d: unknown) =>
                      sum + Math.abs(C.Clipper.Area(d)),
                    0,
                  );
                  outside = Math.max(
                    outside,
                    out / Math.abs(C.Clipper.Area(toPath(poly))),
                  );
                }
              }
              return { placed, outside };
            });
          });
          expect(results.length).toBeGreaterThan(0);
          expect(results[0].placed).toBe(parts);
          for (const r of results) expect(r.outside).toBeLessThan(1e-6);
        } finally {
          await app.close();
        }
      });
    }
