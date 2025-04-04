const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const { rmSync, renameSync } = require("fs");
const fs = require("fs");
const { execSync } = require("child_process");
const { globSync } = require("glob");
const path = require("path");

// Get the package version from package.json
const packageJson = require("./package.json");
const { type, version } = require("os");
const packageVersion = packageJson.version;
// Extract major.minor version without patch
const shortVersion = packageVersion.replace(/\.\d+$/, '');

// Extract platform and arch from command line arguments
let makerArch =
  process.env.MAKER_ARCH || process.platform == "win32" ? "x64" : "arm64";
let makerPlatform = process.env.MAKER_PLATFORM || "darwin";
console.log("Maker Arch:", makerArch);
console.log("Maker Platform:", makerPlatform);
for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--arch") {
    makerArch = process.argv[i + 1];
  }
  if (arg === "--platform") {
    makerPlatform = process.argv[i + 1];
  }
}
console.log("after Maker Arch:", makerArch);
console.log("after Maker Platform:", makerPlatform);

// Define included files for packaging
const includeFiles = [
  // we need to make sure the project root directory is included
  ".",
  "main.js",
  "presets.js",
  "notification-service.js",
  ...globSync("main/**"),
  "LICENSE",
  "LICENSE.md",
  "package.json",
  // per electron-packager's docs, a set of files in the node_modules directory are always ignored
  // unless we are providing an IgnoreFunction. Because we want to ignore a lot more files than
  // packager does by default, we need to ensure that we're including the relevant node_modules
  // while ignoring what packager normally would.
  // See https://electron.github.io/electron-packager/main/interfaces/electronpackager.options.html#ignore.
  ...globSync("node_modules/**", {
    ignore: [
      "node_modules/.bin/**",
      "node_modules/electron/**",
      "node_modules/electron-prebuilt/**",
      "node_modules/electron-prebuilt-compile/**",
      "node_modules/@deepnest/calculate-nfp/rust-minkowski/**",
      "node_modules/@deepnest/calculate-nfp/prebuilt/**",
    ],
  }),
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const readDirRecursive = (dir) => {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
    } else {
      files.forEach((file) => {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          console.log("Directory:", fullPath);
          readDirRecursive(fullPath);
        } else {
          console.log("File:", fullPath);
        }
      });
    }
  });
};

// Utility function to delete empty node_modules folders
const deleteEmptyNodeModules = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let isEmpty = true;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      deleteEmptyNodeModules(fullPath);
      if (fs.existsSync(fullPath) && fs.readdirSync(fullPath).length > 0) {
        isEmpty = false;
      }
    } else {
      isEmpty = false;
    }
  }

  if (isEmpty) {
    console.log("Deleting empty folder:", dir);
    rmSync(dir, { recursive: true, force: true });
  }
};

// Hook for post-prune operations
const packageAfterPruneHook = async (
  config,
  buildPath,
  electronVersion,
  platform,
  arch
) => {
  console.log("packageAfterPrune", buildPath, electronVersion, platform, arch);

  if (platform === "mas") {
    try {
      const myPlatform = platform === "mas" ? "darwin" : platform; // Use 'darwin' for macOS App Store builds

      console.log(
        "packageAfterPrune",
        buildPath,
        electronVersion,
        platform,
        myPlatform,
        arch
      );
      // Execute yarn install with the specified arch in the build folder
      execSync(`rm -rf yarn.lock node_modules/`, {
        cwd: buildPath,
        stdio: "inherit",
        env: { ...process.env },
      });
      execSync(
        `npm install --cpu ${arch} --os ${myPlatform} --arch=${arch} --platform=${myPlatform} --production`,
        {
          cwd: buildPath,
          stdio: "inherit",
          env: {
            ...process.env,
            npm_config_platform: myPlatform,
            npm_config_arch: arch,
          },
        }
      );
    } catch (error) {
      console.error("Error during npm install:", error.message);
      execSync(`cat /Users/runner/.npm/_logs/*`, {
        cwd: buildPath,
        stdio: "inherit",
        env: { ...process.env },
      });
    }
    await delay(1000);

    // Check each node_module for a gyp build and print native addon modules
    const nodeModulesPath = path.join(buildPath, "node_modules");
    const gypFiles = globSync(`${nodeModulesPath}/**/binding.gyp`);
    gypFiles.forEach((gypFile) => {
      console.log("Native addon detected in module:", path.dirname(gypFile));
    });

    const cwd = path.resolve(
      buildPath,
      "node_modules",
      "@deepnest",
      "calculate-nfp"
    );
    const includeFiles = [
      "rust-minkowski",
      "build",
      "node_modules",
      "prebuilds",
    ];

    // Use for...of loop instead of forEach for async operations
    for (const file of includeFiles) {
      const filePath = path.join(cwd, file);
      try {
        rmSync(filePath, { recursive: true, force: true });
      } catch (e) {}
    }

    const cwd2 = path.resolve(buildPath, "node_modules", "fs-xattr");
    readDirRecursive(cwd2);
    rmSync(path.join(cwd2, "bin"), { recursive: true, force: true });

    console.log("platform", platform);
    console.log("arch", arch);

    try {
      const cwd3 = path.resolve(
        buildPath,
        "node_modules",
        "@deepnest",
        "svg-preprocessor-darwin-x64"
      );
      const cwd4 = path.resolve(
        buildPath,
        "node_modules",
        "@deepnest",
        "svg-preprocessor-darwin-arm64"
      );
      const cwd5 = path.resolve(
        buildPath,
        "node_modules",
        "@deepnest",
        "svg-preprocessor",
        "node_modules"
      );
      if (arch === "x64") {
        renameSync(
          path.join(cwd3, "svg-preprocessor.darwin-x64.node"),
          path.join(
            cwd3,
            "..",
            "svg-preprocessor",
            "svg-preprocessor.darwin-universal.node"
          )
        );
      } else {
        renameSync(
          path.join(cwd4, "svg-preprocessor.darwin-arm64.node"),
          path.join(
            cwd4,
            "..",
            "svg-preprocessor",
            "svg-preprocessor.darwin-universal.node"
          )
        );
      }
      rmSync(cwd3, { recursive: true, force: true });
      rmSync(cwd4, { recursive: true, force: true });
      rmSync(cwd5, { recursive: true, force: true });
    } catch (e) {
      console.error("Error renaming files:", e);
    }

    const prebuilds = globSync(`${buildPath}/**/prebuilds/*`);
    const nodeAbi = await import("node-abi");
    const abiVersion = nodeAbi.getAbi(
      packageJson.devDependencies.electron,
      "electron"
    );
    prebuilds.forEach(function (fpath) {
      if (!fpath.endsWith(".node")) return;
      if (!fpath.includes("darwin")) return;
      if (!fpath.includes("abi" + abiVersion)) return;
      console.log(
        "Renaming file:",
        fpath,
        "to",
        path.join(path.dirname(fpath), "..", `${darwin}.node`)
      );
      renameSync(fpath, path.join(path.dirname(fpath), "..", `${darwin}.node`));
    });
    const prebuildDirs = globSync(`${buildPath}/**/prebuilds`);
    prebuildDirs.forEach((dir) =>
      rmSync(dir, { recursive: true, force: true })
    );
  }

  // remove electron directory from node_modules don't need it for release
  try {
    const cwd_electron = path.resolve(buildPath, "node_modules", "electron");
    rmSync(cwd_electron, { recursive: true, force: true });
  } catch (e) {
    console.error("Error removing electron directory:", e);
  }
  await delay(1000);

  // Start checking for empty node_modules folders
  deleteEmptyNodeModules(path.join(buildPath, "node_modules"));

  return void 0;
};

// Generate base packager configuration
const getPackagerConfig = () => {
  const basePackagerConfig = {
    appCategoryType: "public.app-category.productivity",
    appBundleId: "net.deepnest.app",
    appCopyright: "Copyright © 2025 Josef Fröhle - www.deepnest.net", 
    appVersion: `${packageVersion}`,
    buildVersion: `${shortVersion}.${process.env.GITHUB_RUN_ID}`,
    executableName: "deepnest",
    icon: path.resolve(__dirname, "_assets", "icon"),
    asar: true,
    ignore: (p) => {
      if (p === "") {
        return false;
      }
      return !includeFiles.includes(path.normalize(p.replace("/", "")));
    },
    prune: true,
    extendInfo: {
      ITSAppUsesNonExemptEncryption: false,
      LSMultipleInstancesProhibited: true,
    },
  };

  return basePackagerConfig;
};

// Configure macOS signing options based on target and environment
const getMacSigningConfig = () => {
  const isMas = makerPlatform === "mas";

  // Base signing configuration common to all macOS builds
  const baseSignConfig = {
    osxSign: {
      type: isMas ? "distribution" : "distribution", //"development",
      hardenedRuntime: isMas ? false : true, // Hardened runtime is not needed for MAS
      gatekeeperAssess: isMas ? false : true, // Gatekeeper assessment is not needed for MAS
      identity: isMas
        ? process.env.APPLE_MAS_IDENTITY
        : process.env.APPLE_DEVELOPER_ID_APPLICATION,
      entitlements: path.join(
        __dirname,
        "_assets",
        `entitlements${isMas ? ".mas" : ""}.plist`
      ),
      entitlementsInherit: path.join(
        __dirname,
        "_assets",
        `entitlements${isMas ? ".mas" : ""}.inherit.plist`
      ),
      preAutoEntitlements: false,
      preEmbedProvisioningProfile: isMas ? true : false,
      signatureFlags: "library",
      provisioningProfile: path.join(
        __dirname,
        "_assets",
        "embedded.provisionprofile"
      ),
      optionsForFile: (filePath) => {

        if (filePath.endsWith("deepnest.app")) {
          return {
            entitlements: path.resolve(
              __dirname,
              "_assets",
              `entitlements${isMas ? ".mas" : ""}.plist`
            ),
            hardenedRuntime: isMas ? false : true,
            provisioningProfile: path.join(
              __dirname,
              "_assets",
              "embedded.provisionprofile"
            ),
          };
        }
        if (filePath.endsWith("deepnest Login Helper.app")) {
          return {
            entitlements: path.resolve(
              __dirname,
              "_assets",
              `entitlements${isMas ? ".mas" : ""}.loginhelper.plist`
            ),
            hardenedRuntime: isMas ? false : true,
            provisioningProfile: path.join(
              __dirname,
              "_assets",
              "embedded.provisionprofile"
            ),
          };
        }
        if (filePath.endsWith("deepnest Helper (GPU).app")) {
          return {
            entitlements: path.resolve(
              __dirname,
              "_assets",
              `entitlements${isMas ? ".mas" : ""}.gpu.plist`
            ),
            hardenedRuntime: isMas ? false : true,
            provisioningProfile: path.join(
              __dirname,
              "_assets",
              "embedded.provisionprofile"
            ),
          };
        }
        if (filePath.endsWith("deepnest Helper (Plugin).app")) {
          return {
            entitlements: path.resolve(
              __dirname,
              "_assets",
              `entitlements${isMas ? ".mas" : ""}.plugin.plist`
            ),
            hardenedRuntime: isMas ? false : true,
            provisioningProfile: path.join(
              __dirname,
              "_assets",
              "embedded.provisionprofile"
            ),
          };
        }
        if (filePath.endsWith("deepnest Helper (Renderer).app")) {
          return {
            entitlements: path.resolve(
              __dirname,
              "_assets",
              `entitlements${isMas ? ".mas" : ""}.renderer.plist`
            ),
            hardenedRuntime: isMas ? false : true,
            provisioningProfile: path.join(
              __dirname,
              "_assets",
              "embedded.provisionprofile"
            ),
          };
        }
        if (filePath.endsWith("deepnest Helper.app")) {
          return {
            entitlements: path.resolve(
              __dirname,
              "_assets",
              `entitlements${isMas ? ".mas" : ""}.renderer.plist`
            ),
            hardenedRuntime: isMas ? false : true,
            provisioningProfile: path.join(
              __dirname,
              "_assets",
              "embedded.provisionprofile"
            ),
          };
        }
        return {
          entitlements: path.resolve(
            __dirname,
            "_assets",
            `entitlements${isMas ? ".mas" : ""}.plist`
          ),
          hardenedRuntime: isMas ? false : true,
          provisioningProfile: path.join(
            __dirname,
            "_assets",
            "embedded.provisionprofile"
          ),
        };
      },
    },
  };

  // Add notarization if all required environment variables exist
  if (
    !isMas &&
    process.env.APPLE_API_KEY_ID &&
    process.env.APPLE_API_ISSUER &&
    process.env.NOTARIZATION_KEY_PATH
  ) {
    baseSignConfig.osxNotarize = {
      tool: "notarytool",
      appBundleId: "net.deepnest.app",
      appleApiKey: process.env.NOTARIZATION_KEY_PATH,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER,
    };
  }

  return baseSignConfig;
};

// Define base makers configuration
const getMakers = () => {
  const isMas = makerPlatform === "mas";
  const makers = [
    {
      name: "@reforged/maker-appimage",
      platforms: ["linux"],
      config: {
        options: {
          categories: [
            "Graphics",
            "Utility",
            "VectorGraphics",
            "2DGraphics",
            "ImageProcessing",
          ],
          icon: path.resolve(__dirname, "_assets", "icon.svg"),
        },
      },
    },
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: {
        name: `deepnest-${makerArch}`,
        setupExe: `deepnest-v${packageVersion}-${makerArch}-setup.exe`,
        setupIcon: path.resolve(__dirname, "_assets", "icon.ico"),
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32", "linux"],
      config: (arch) => ({
        //macUpdateManifestBaseUrl: `https://dl.deepnest.app/deepnest-next/darwin/${arch}`
      }),
    },
    {
      name: "@electron-forge/maker-flatpak",
      config: {
        options: {
          categories: ["Education", "Graphics", "Utility"],
          mimeType: [
            "image/x-dxf",
            "image/x-dwg",
            "image/svg+xml",
            "application/postscript",
            "image/vnd.dxf",
            "image/vnd.dwg",
          ],
        },
      },
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"],
      config: {
        options: {
          maintainer: "Josef Fröhle",
          homepage: "https://www.deepnest.net",
          categories: ["Education", "Graphics", "Utility"],
          section: "graphics",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      platforms: ["linux"],
      config: {
        options: {
          homepage: "https://www.deepnest.net",
          categories: ["Education", "Graphics", "Utility"],
        },
      },
    },
  ];

  if (!isMas && process.platform === "darwin") {
    makers.push(
      {
        name: "@electron-forge/maker-dmg",
        platforms: ["darwin"],
        config: {
          name: `deepnest-${
            makerPlatform == "darwin" ? "mac" : "mas"
          }-${makerArch}`,
          background: path.resolve(__dirname, "_assets", "dmg-background.png"),
          icon: path.join(__dirname, "_assets", "icon.icns"),
          format: "ULFO",
          contents: () => [
            {
              x: 150,
              y: 180,
              type: "file",
              path: `${process.cwd()}/out/deepnest-darwin-${makerArch}/deepnest.app`,
            },
            { x: 350, y: 180, type: "link", path: "/Applications" },
          ],
          additionalDMGOptions: {
            window: {
              size: {
                width: 500,
                height: 345,
              },
            },
          },
        },
      },
      {
        name: "@electron-forge/maker-zip",
        platforms: ["darwin"],
        config: (arch) => ({
          //macUpdateManifestBaseUrl: `https://dl.deepnest.app/deepnest-next/darwin/${arch}`
        }),
      }
    );
  }
  if (makerPlatform === "mas") {
    makers.push({
      name: "@electron-forge/maker-pkg",
      platforms: ["mas"],
      config: {
        name: `deepnest-${
          makerPlatform == "darwin" ? "mac" : "mas"
        }-${makerArch}`,
        identity: isMas
          ? process.env.APPLE_MAS_INSTALLER_IDENTITY
          : process.env.APPLE_INSTALLER_IDENTITY,
        appBundleId: "net.deepnest.app",
      },
    });
  }

  return makers;
};

// Define publishers configuration
const getPublishers = () => {
  return [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "Dexus",
          name: "Deepnest",
        },
        draft: true,
        prerelease: false,
      },
    },
    {
      name: "@electron-forge/publisher-s3",
      config: {
        bucket: process.env.S3_BUCKET || "deepnest-next",
        region: process.env.S3_REGION || "eu-central-1",
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        endpoint:
          process.env.S3_ENDPOINT || "https://s3.eu-central-1.amazonaws.com",
        s3ForcePathStyle: true,
        public: true,
        folder: "deepnest-next",
        // refs: https://github.com/lobehub/lobe-chat/pull/5479
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
      },
    },
  ];
};

// Build the final configuration
const buildConfig = () => {
  // Start with base configuration
  const config = {
    hooks: {
      packageAfterPrune: packageAfterPruneHook,
    },
    packagerConfig: getPackagerConfig(),
    rebuildConfig: {
      force: false,
    },
    makers: getMakers(),
    publishers: getPublishers(),
    plugins: [
      {
        name: "@electron-forge/plugin-auto-unpack-natives",
        config: {},
      },
      // Fuses are used to enable/disable various Electron functionality
      // at package time, before code signing the application
      new FusesPlugin({
        version: FuseVersion.V1,
        [FuseV1Options.RunAsNode]: true,
        [FuseV1Options.EnableCookieEncryption]: true,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
      }),
    ],
  };

  // Add macOS signing configuration if applicable
  if (
    (makerPlatform === "darwin" || makerPlatform === "mas") &&
    process.platform === "darwin"
  ) {
    const signingConfig = getMacSigningConfig();
    config.packagerConfig = {
      ...config.packagerConfig,
      ...signingConfig,
    };
  }

  return config;
};

// Generate the final configuration
const config = buildConfig();
module.exports = config;
