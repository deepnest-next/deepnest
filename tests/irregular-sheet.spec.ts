/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";
import { NestingResult } from "../index";

// Issue #180: on an irregular (non-convex) sheet, parts must stay inside the sheet
// outline, also with "Use rough approximation" (simplify) on.
for (const simplify of [false, true])
  for (const rotations of [4, 360]) {
    test(`Irregular sheet keeps parts inside (simplify ${simplify}, ${rotations} rotations)`, async () => {
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

        const file = path.resolve(
          __dirname,
          "assets",
          "issue-180",
          "issue-180.svg",
        );
        await app.evaluate(
          ({ dialog }, paths) => {
            dialog.showOpenDialog =
              async (): Promise<OpenDialogReturnValue> => ({
                filePaths: paths,
                canceled: false,
              });
          },
          [file],
        );
        await win.click("id=import");
        await expect(win.locator("#parts tbody tr")).toHaveCount(3);
        // The sheet is the part with the largest bounds.
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
          expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText(
            "2/2",
          ),
        ).toPass({ timeout: 90_000 });
        // Let the GA produce several results; every one of them is checked below.
        await expect
          .poll(() => win.evaluate(() => window.DeepNest.nests.length), {
            timeout: 60_000,
          })
          .toBeGreaterThan(3);
        await win.locator("#stopnest").click();

        // Area of every placed part that lies outside its sheet, relative to the part.
        const outside = await win.evaluate(() => {
          const w = window as unknown as {
            ClipperLib: any; // eslint-disable-line @typescript-eslint/no-explicit-any
          };
          const C = w.ClipperLib;
          const scale = 1e6;
          const toPath = (pts: { x: number; y: number }[]) =>
            pts.map((p) => new C.IntPoint(p.x * scale, p.y * scale));
          const parts = window.DeepNest.parts;
          const result: number[] = [];
          for (const nest of window.DeepNest.nests as NestingResult[]) {
            for (const s of nest.placements) {
              const sheet = toPath(parts[s.sheet].polygontree);
              for (const p of s.sheetplacements) {
                const a = (p.rotation * Math.PI) / 180;
                const poly = parts[p.source].polygontree.map((v) => ({
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
                result.push(out / Math.abs(C.Clipper.Area(toPath(poly))));
              }
            }
          }
          return result;
        });
        expect(outside.length).toBeGreaterThan(0);
        expect(Math.max(...outside)).toBeLessThan(1e-3);
      } finally {
        await app.close();
      }
    });
  }
