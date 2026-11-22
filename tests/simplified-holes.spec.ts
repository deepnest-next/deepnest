import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

// Before nesting, every outline and hole is simplified, and the simplified shapes are nested.
// A simplified hole is free space that other parts are placed into, so it must not cover any
// of the part's real material. It did: the simplified hole was united with the real one, like
// an outline, and grew over material that bulges into the hole. A part nested into the hole
// could then overlap the part around it.
test("A simplified hole does not cover the part's material", async () => {
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
    const file = path.resolve(
      __dirname,
      "assets",
      "simplified-holes",
      "plate-with-arc-hole.svg",
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
    await expect(win.locator("#parts tbody tr")).toHaveCount(1);
    await win.click("id=addsheet");
    await win.fill("id=sheetwidth", "300");
    await win.fill("id=sheetheight", "300");
    await win.click("id=confirmsheet");
    await win.click("id=startnest");
    // The simplified copies exist once the genetic algorithm has its first population.
    await win.waitForFunction(
      () => !!(window.DeepNest as unknown as { GA?: unknown }).GA,
      undefined,
      { timeout: 60_000 },
    );

    const result = await win.evaluate(() => {
      type Point = { x: number; y: number };
      type Tree = Point[] & { children?: Tree[]; source: number };
      const w = window as unknown as {
        ClipperLib: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        DeepNest: {
          parts: { polygontree: Tree }[];
          GA: { population: { placement: Tree[] }[] };
        };
      };
      const C = w.ClipperLib;
      const scale = 1e7;
      // Counter-clockwise, so that the non-zero rule treats every path as solid.
      const solid = (polygon: Point[]) => {
        const p = polygon.map((v) => ({
          X: Math.round(v.x * scale),
          Y: Math.round(v.y * scale),
        }));
        return C.Clipper.Area(p) < 0 ? p.reverse() : p;
      };
      const clip = (type: unknown, subject: unknown[], clipper: unknown[]) => {
        const c = new C.Clipper();
        const out = new C.Paths();
        c.AddPaths(subject, C.PolyType.ptSubject, true);
        c.AddPaths(clipper, C.PolyType.ptClip, true);
        c.Execute(
          type,
          out,
          C.PolyFillType.pftNonZero,
          C.PolyFillType.pftNonZero,
        );
        return out as unknown[];
      };
      const area = (paths: unknown[]) =>
        paths.reduce((sum: number, p) => sum + Math.abs(C.Clipper.Area(p)), 0) /
        scale /
        scale;

      const simplified = w.DeepNest.GA.population[0].placement[0];
      const real = w.DeepNest.parts[simplified.source].polygontree;
      const material = clip(
        C.ClipType.ctDifference,
        [solid(real)],
        (real.children || []).map(solid),
      );
      const holes = (simplified.children || []).map(solid);
      return {
        holes: holes.length,
        // Real material that the simplified outline does not cover.
        outlineLost: area(
          clip(C.ClipType.ctDifference, [solid(real)], [solid(simplified)]),
        ),
        // Real material that the simplified hole declares to be free space.
        holeIntoMaterial: area(
          clip(C.ClipType.ctIntersection, holes, material),
        ),
      };
    });
    await win.locator("#stopnest").click();

    expect(result.holes).toBe(1);
    expect(result.outlineLost).toBeLessThan(1e-6);
    expect(result.holeIntoMaterial).toBeLessThan(1e-6);
  } finally {
    await app.close();
  }
});
