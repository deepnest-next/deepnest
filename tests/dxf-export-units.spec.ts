/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
/* DXF export asks the converter for the chosen unit, so the file carries $INSUNITS (#96). */
import { _electron as electron, expect, test } from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { createServer } from "node:http";
import { AddressInfo } from "node:net";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "path";

/** Text fields and the uploaded file of a multipart body (enough for this test). */
function fields(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(
    /name="([^"]+)"[^\r]*\r\n(?:[^\r]+\r\n)*\r\n([\s\S]*?)\r\n--/g,
  ))
    out[m[1]] = m[2];
  return out;
}

for (const server of ["current", "old"] as const)
  test(`DXF export with the ${server} converter`, async ({}, testInfo) => {
    test.setTimeout(120_000);
    const requests: { url: string; f: Record<string, string> }[] = [];
    const mock = createServer((req, res) => {
      let body = "";
      req.setEncoding("latin1");
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        requests.push({ url: req.url!, f: fields(body) });
        // An old server ignores mm_per_unit and sends no X-Convert-Mm-Per-Unit
        if (req.url === "/v1/convert" && server === "current")
          res.setHeader("X-Convert-Mm-Per-Unit", "25.4");
        res.end(`DXF from ${req.url}`);
      });
    });
    await new Promise<void>((r) => mock.listen(0, "127.0.0.1", r));
    const port = (mock.address() as AddressInfo).port;

    const dir = await mkdtemp(path.join(tmpdir(), "deepnest-dxf-"));
    const userData = path.join(dir, "profile");
    await mkdir(userData, { recursive: true });
    await writeFile(
      path.join(userData, "settings.json"),
      JSON.stringify({
        showNotifications: false,
        conversionServer: `http://127.0.0.1:${port}/convert`,
        dxfExportScale: 1, // DXF export units: inches
      }),
    );
    const part = path.join(dir, "plate.svg");
    await writeFile(
      part,
      '<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50">' +
        '<rect width="100" height="50" fill="none" stroke="#000"/></svg>',
    );

    const app = await electron.launch({
      args: ["main.js", `--user-data-dir=${userData}`],
    });
    const win = await app.firstWindow();
    await win.waitForFunction(
      () => typeof (window as unknown as { nest?: unknown }).nest === "object",
    );
    await win.locator("#config_tab").click();
    await win.locator("#config").getByRole("radio").nth(1).check(); // mm
    await win.locator("#home_tab").click();
    await app.evaluate(({ dialog }, p) => {
      dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({
        filePaths: [p],
        canceled: false,
      });
    }, part);
    await win.click("id=import");
    await expect(win.locator("#importsnav li")).toHaveCount(1);
    await win.click("id=addsheet");
    await win.fill("id=sheetwidth", "160");
    await win.fill("id=sheetheight", "100");
    await win.click("id=confirmsheet");
    await win.click("id=startnest");
    await expect(() =>
      expect(win.locator("id=nestinfo").locator("h1").nth(1)).toHaveText("1/1"),
    ).toPass({ timeout: 60_000 });
    await win.locator("#stopnest").click();

    const file = testInfo.outputPath("nest.dxf");
    await app.evaluate(({ dialog }, p) => {
      dialog.showSaveDialogSync = () => p;
    }, file);
    await win.click("id=export");
    await win.click("id=exportdxf");
    await expect
      .poll(async () => (await readFile(file).catch(() => "")).toString())
      .not.toBe("");
    await app.close();
    mock.close();

    const v1 = requests[0];
    expect(v1.url).toBe("/v1/convert");
    expect(v1.f.to).toBe("dxf");
    expect(v1.f.version).toBe("r2000");
    expect(Number(v1.f.mm_per_unit)).toBeCloseTo(25.4);
    // The SVG has its true size (160 mm sheet) and a stroke for outlines drawn by CSS.
    const root = v1.f.file.match(/<svg[^>]*>/)![0];
    expect(Number(root.match(/width="([\d.]+)mm"/)![1])).toBeCloseTo(160, 3);
    expect(root).toContain('stroke="#000000"');

    if (server === "current") {
      expect(requests).toHaveLength(1);
      expect((await readFile(file)).toString()).toBe("DXF from /v1/convert");
    } else {
      // Fallback: the legacy route, one SVG inch per DXF unit, unitless (160 mm = 6.3 units)
      expect(requests).toHaveLength(2);
      expect(requests[1].url).toBe("/convert");
      expect(requests[1].f.format).toBe("dxf");
      const legacyRoot = requests[1].f.fileUpload.match(/<svg[^>]*>/)![0];
      expect(Number(legacyRoot.match(/width="([\d.]+)mm"/)![1])).toBeCloseTo(
        160,
        3,
      );
      expect((await readFile(file)).toString()).toBe("DXF from /convert");
    }
  });
