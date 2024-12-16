import {
  ConsoleMessage,
  _electron as electron,
  expect,
  test,
} from "@playwright/test";
import { OpenDialogReturnValue } from "electron";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "path";
import { DeepNestConfig, NestingResult } from "../index";

// !process.env.CI && test.use({ launchOptions: { slowMo: 500 } });

test("Nest", async ({}, testInfo) => {
  const { pipeConsole } = testInfo.config.metadata;
  !existsSync(testInfo.outputDir) &&
    mkdir(testInfo.outputDir, { recursive: true });

  const electronApp = await electron.launch({
    args: ["main.js"],
    recordVideo: { dir: testInfo.outputDir },
    env: {
      ...process.env,
      // https://github.com/microsoft/playwright/issues/11932#issuecomment-1200164702
      NODE_ENV: "development",
    },
  });

  const window = await electronApp.firstWindow();

  const consoleDump = testInfo.outputPath("console.txt");
  pipeConsole &&
    test.step(
      "Pipe browser console logs",
      () => {
        const logMessage = async (message: ConsoleMessage) => {
          await test.step(
            "Log message",
            async () => {
              const { url, lineNumber, columnNumber } = message.location();
              let file = url;
              try {
                file = path.relative(process.cwd(), fileURLToPath(url));
              } catch (error) {}
              await appendFile(
                consoleDump,
                JSON.stringify(
                  {
                    location: `${file}:${lineNumber}:${columnNumber}`,
                    args: await Promise.all(
                      message.args().map((x) => x.jsonValue())
                    ),
                    type: message.type(),
                  },
                  null,
                  2
                ) + ",\n\n"
              );
            },
            { box: true }
          );
        };

        window.on("console", logMessage);
        electronApp.on("window", (win) => win.on("console", logMessage));
      },
      { box: true }
    );

  await test.step("Config", async () => {
    await window.locator("#config_tab").click();
    const configTab = window.getByText("Nesting configuration Display");
    await configTab.getByRole("link", { name: "set all to default" }).click();
    await test.step("units mm", () =>
      configTab.getByRole("radio").nth(1).check());
    await test.step("spacing 10mm", async () => {
      await configTab.getByRole("spinbutton").first().fill("10");
      await configTab.getByRole("spinbutton").first().blur();
    });
    await test.step("placement type gravity", () =>
      configTab
        .locator('select[name="placementType"]')
        .selectOption("gravity"));
    const config = await window.evaluate(() => {
      return window.config.getSync();
    });
    const deepNestConfig = await window.evaluate(() => {
      return window.DeepNest.config();
    });
    const sharedConfig: Partial<DeepNestConfig> = {
      curveTolerance: 0.72,
      mergeLines: true,
      mutationRate: 10,
      placementType: "gravity",
      populationSize: 10,
      rotations: 4,
      scale: 72,
      simplify: false,
      spacing: 28.34645669291339,
      threads: 4,
      timeRatio: 0.5,
    };
    expect(config).toMatchObject({
      ...sharedConfig,
      conversionServer: "http://convert.deepnest.io",
      dxfExportScale: "72",
      dxfImportScale: "1",
      endpointTolerance: 0.36,
      units: "mm",
    });
    expect(deepNestConfig).toMatchObject({
      ...sharedConfig,
      clipperScale: 10000000,
    });
    await window.locator("#home_tab").click();
  });

  await test.step("Upload files", async () => {
    const inputDir = path.resolve(__dirname, "assets");
    const files = (await readdir(inputDir))
      .filter((file) => path.extname(file) === ".svg")
      .map((file) => path.resolve(inputDir, file));
    await electronApp.evaluate(({ dialog }, paths) => {
      dialog.showOpenDialog = async (): Promise<OpenDialogReturnValue> => ({
        filePaths: paths,
        canceled: false,
      });
    }, files);
    await window.click("id=import");
    await expect(window.locator("#importsnav li")).toHaveCount(2);
  });

  await test.step("Add sheet", async () => {
    const sheet = { width: 300, height: 200 };
    await window.click("id=addsheet");
    await window.fill("id=sheetwidth", sheet.width.toString());
    await window.fill("id=sheetheight", sheet.height.toString());
    await window.click("id=confirmsheet");
  });

  // await expect(window).toHaveScreenshot("loaded.png", {
  //   clip: { x: 100, y: 100, width: 2000, height: 1000 },
  // });
  await window.click("id=startnest");

  const stopNesting = () =>
    test.step("Stop nesting", async () => {
      const button = window.locator("#stopnest");
      await button.click();
      await expect(() => expect(button).toHaveText("Start nest")).toPass();
    });

  const downloadSvg = () =>
    test.step("Download SVG", async () => {
      const file = testInfo.outputPath("output.svg");
      electronApp.evaluate(({ dialog }, path) => {
        dialog.showSaveDialogSync = () => path;
      }, file);
      await window.click("id=export");
      await expect(window.locator("id=exportsvg")).toBeVisible();
      await window.click("id=exportsvg");
      return (await readFile(file)).toString();
    });

  const waitForIteration = (n: number) =>
    test.step(`Wait for iteration #${n}`, () =>
      expect(() =>
        expect(
          window
            .locator("id=nestlist")
            .locator("span")
            .nth(n - 1)
        ).toBeVisible()
      ).toPass());

  await expect(window.locator("id=progressbar")).toBeVisible();
  await waitForIteration(1);
  await expect(window.locator("id=nestinfo").locator("h1").nth(0)).toHaveText(
    "1"
  );
  await expect(window.locator("id=nestinfo").locator("h1").nth(1)).toHaveText(
    "54/54"
  );

  await test.step("Attachments", async () => {
    const svg = await downloadSvg();
    const data = (): Promise<NestingResult> =>
      window.evaluate(() => window.DeepNest.nests);

    await testInfo.attach("nesting.svg", {
      body: svg,
      contentType: "image/svg+xml",
    });
    await testInfo.attach("nesting.json", {
      body: JSON.stringify(await data(), null, 2),
      contentType: "application/json",
    });
    existsSync(consoleDump) &&
      (await testInfo.attach("console.json", {
        body: JSON.stringify(
          (
            await readFile(consoleDump)
          )
            .toString()
            .split(",\n\n")
            .filter((x) => !!x)
            .map((x) => JSON.parse(x)),
          null,
          2
        ),
        contentType: "application/json",
      }));
  });

  await stopNesting();
});

test.afterAll(async ({}, testInfo) => {
  const { outputDir } = testInfo;
  await Promise.all(
    (
      await readdir(outputDir)
    ).map((file) => {
      return testInfo.attach(file, {
        path: path.resolve(outputDir, file),
      });
    })
  );
});
