/*eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }]*/
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
  if (existsSync(testInfo.outputDir)) {
    mkdir(testInfo.outputDir, { recursive: true });
  }

  const electronApp = await electron.launch({
    args: ["main.js"],
    recordVideo: { dir: testInfo.outputDir },
  });

  const mainWindow = await electronApp.firstWindow();

  const consoleDump = testInfo.outputPath("console.txt");
  if (pipeConsole) {
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (error) {
                // ignore
              }
              await appendFile(
                consoleDump,
                JSON.stringify(
                  {
                    location: `${file}:${lineNumber}:${columnNumber}`,
                    args: await Promise.all(
                      message.args().map((x) => x.jsonValue()),
                    ),
                    type: message.type(),
                  },
                  null,
                  2,
                ) + ",\n\n",
              );
            },
            { box: true },
          );
        };

        mainWindow.on("console", logMessage);
        electronApp.on("window", (win) => win.on("console", logMessage));
      },
      { box: true },
    );
  }
  await test.step("Config", async () => {
    await mainWindow.locator("#config_tab").click();
    const configTab = mainWindow.locator("#config");
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
    const config = await mainWindow.evaluate(() => {
      return window.config.getSync();
    });
    const deepNestConfig = await mainWindow.evaluate(() => {
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
      conversionServer: "https://converter.deepnest.app/convert",
      dxfExportScale: "1",
      dxfImportScale: "1",
      endpointTolerance: 0.36,
      units: "mm",
    });
    expect(deepNestConfig).toMatchObject({
      ...sharedConfig,
      clipperScale: 10000000,
    });
    await mainWindow.locator("#home_tab").click();
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
    await mainWindow.click("id=import");
    await expect(mainWindow.locator("#importsnav li")).toHaveCount(2);
  });

  await test.step("Add sheet", async () => {
    const sheet = { width: 300, height: 200 };
    await mainWindow.click("id=addsheet");
    await mainWindow.fill("id=sheetwidth", sheet.width.toString());
    await mainWindow.fill("id=sheetheight", sheet.height.toString());
    await mainWindow.click("id=confirmsheet");
  });

  // await expect(window).toHaveScreenshot("loaded.png", {
  //   clip: { x: 100, y: 100, width: 2000, height: 1000 },
  // });
  await mainWindow.click("id=startnest");

  const stopNesting = () =>
    test.step("Stop nesting", async () => {
      const button = mainWindow.locator("#stopnest");
      await button.click();
      await expect(() => expect(button).toHaveText("Start nest")).toPass();
    });

  const downloadSvg = () =>
    test.step("Download SVG", async () => {
      const file = testInfo.outputPath("output.svg");
      electronApp.evaluate(({ dialog }, path) => {
        dialog.showSaveDialogSync = () => path;
      }, file);
      await mainWindow.click("id=export");
      await expect(mainWindow.locator("id=exportsvg")).toBeVisible();
      await mainWindow.click("id=exportsvg");
      return (await readFile(file)).toString();
    });

  const waitForIteration = (n: number) =>
    test.step(`Wait for iteration #${n}`, () =>
      expect(() =>
        expect(
          mainWindow
            .locator("id=nestlist")
            .locator("span")
            .nth(n - 1),
        ).toBeVisible(),
      ).toPass());

  await expect(mainWindow.locator("id=progressbar")).toBeVisible();
  await waitForIteration(1);
  await expect(
    mainWindow.locator("id=nestinfo").locator("h1").nth(0),
  ).toHaveText("1");
  await expect(() =>
    expect(mainWindow.locator("id=nestinfo").locator("h1").nth(1)).toHaveText(
      "54/54",
    ),
  ).toPass();

  await test.step("Attachments", async () => {
    const svg = await downloadSvg();
    const data = (): Promise<NestingResult> =>
      mainWindow.evaluate(() => window.DeepNest.nests);

    await testInfo.attach("nesting.svg", {
      body: svg,
      contentType: "image/svg+xml",
    });
    await testInfo.attach("nesting.json", {
      body: JSON.stringify(await data(), null, 2),
      contentType: "application/json",
    });
    if (existsSync(consoleDump)) {
      await testInfo.attach("console.json", {
        body: JSON.stringify(
          (await readFile(consoleDump))
            .toString()
            .split(",\n\n")
            .filter((x) => !!x)
            .map((x) => JSON.parse(x)),
          null,
          2,
        ),
        contentType: "application/json",
      });
    }
  });

  await stopNesting();
});

test.afterAll(async ({}, testInfo) => {
  const { outputDir } = testInfo;
  await Promise.all(
    (await readdir(outputDir)).map((file) => {
      return testInfo.attach(file, {
        path: path.resolve(outputDir, file),
      });
    }),
  );
});
