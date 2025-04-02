const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const { rmSync, renameSync } = require("fs");
const fs = require("fs");
const { execSync } = require('child_process');
const { globSync } = require("glob");
const path = require("path");

// Get the package version from package.json
const packageJson = require("./package.json");
const packageVersion = packageJson.version;

// Extract platform and arch from command line arguments
let makerArch = process.env.MAKER_ARCH || null;
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

let includeFiles = [
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
// Fix: Use startsWith instead of includes to match node_modules paths
//console.log('Include files:', includeFiles.filter((f) => f.startsWith('node_modules')));

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

const config = {
  hooks: {
    packageAfterPrune: async (
      config,
      buildPath,
      electronVersion,
      platform,
      arch
    ) => {

      console.log(
        "packageAfterPrune",
        buildPath,
        electronVersion,
        platform,
        arch
      );
      if (platform === "mas") {
        try {
          const myPlatform = platform === 'mas' ? 'darwin' : platform; // Use 'darwin' for macOS App Store builds

          console.log(
            "packageAfterPrune",
            buildPath,
            electronVersion,
            platform,
            myPlatform,
            arch
          );
          // Execute yarn install with the specified arch in the build folder
          execSync(`rm -rf yarn.lock node_modules/`, { cwd: buildPath, stdio: 'inherit', env: { ...process.env } });
          //execSync(`ls -alRs`, { cwd: buildPath, stdio: 'inherit', env: { ...process.env } });
          execSync(`npm install --cpu ${arch} --os ${myPlatform} --arch=${arch} --platform=${myPlatform} --production`, { cwd: buildPath, stdio: 'inherit', env: { ...process.env, npm_config_platform: myPlatform, npm_config_arch: arch } });
        } catch (error) {
          console.error('Error during npm install:', error.message);
          execSync(`cat /Users/runner/.npm/_logs/*`, { cwd: buildPath, stdio: 'inherit', env: { ...process.env } });
        }
        delay(1000);

        // Check each node_module for a gyp build and print native addon modules
        const nodeModulesPath = path.join(buildPath, 'node_modules');
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
        //console.log('packageAfterPrune', cwd);

        // Use for...of loop instead of forEach for async operations
        for (const file of includeFiles) {
          const filePath = path.join(cwd, file);
          //console.log('includeFiles', filePath);
          try {
            rmSync(filePath, { recursive: true, force: true });
          } catch (e) { }

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

        //console.log('includeFiles', includeFiles);
        //console.log('ignoreFiles', ignoreFiles);
        const prebuilds = globSync(`${buildPath}/**/prebuilds/*`);
        const nodeAbi = await import("node-abi");
        const abiVersion = nodeAbi.getAbi(packageJson.devDependencies.electron, "electron");
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
          renameSync(
            fpath,
            path.join(path.dirname(fpath), "..", `${darwin}.node`)
          );
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
      // Function to recursively delete empty node_modules folders
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

      // Start checking for empty node_modules folders
      deleteEmptyNodeModules(path.join(buildPath, "node_modules"));

      //await delay(2000);
      return void 0;
    },
  },
  packagerConfig: {
    appCategoryType: "public.app-category.productivity",
    appBundleId: "net.deepnest.app",
    appCopyright: "Copyright © 2025 Josef Fröhle - www.deepnest.net",
    executableName: "deepnest",
    icon: path.resolve(__dirname, "_assets", "icon"),
    asar: true,
    ignore: (p) => {
      if (p === "") {
        return false;
      }
      let pResult = !includeFiles.includes(path.normalize(p.replace("/", "")));
      // if (pResult) {
      //   console.log('Checking path:', '"' + p.replace('/', '') + '"', '"' + path.normalize(p.replace('/', '')) + '"', pResult);
      // }
      return pResult;
    },
    prune: true,
  },
  rebuildConfig: {
    force: false,
  },
  makers: [
    {
      name: "@reforged/maker-appimage",
      config: {
        options: {
          categories: ["Graphics", "Utility", "VectorGraphics", "2DGraphics", "ImageProcessing"],
          icon: path.resolve(__dirname, "_assets", "icon.svg")
        }
      }
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: `deepnest-${makerArch}`,
        setupExe: `deepnest-v${packageVersion}-${makerArch}-setup.exe`,
        setupIcon: path.resolve(__dirname, "_assets", "icon.ico"),
        // loadingGif: path.resolve(__dirname, '_assets', 'loading.gif'),
      },
    } /*
    {
      name: '@electron-forge/maker-appx',
      config: {
        //publisher: 'CN=developmentca',
        //devCert: 'C:\\devcert.pfx',
        //certPass: 'abcd',
        publisherDisplayName: 'deepnest.net',

        // The following options are only used when building for Windows Store
        // and are ignored when building for Windows Desktop
        makeVersionWinStoreCompatible: true,
      }
    }, 
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        manufacturer: 'DeineAgentur UG (haftungsbeschränkt)',
        name: 'deepnest-next',
      }
    }, */,
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32", "linux"],
      config: (arch) => ({
        //macUpdateManifestBaseUrl: `https://dl.deepnest.app/deepnest-next/darwin/${arch}`
      }),
    },
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: {
        name: `deepnest-${packageVersion}-${makerPlatform}-${makerArch}`,
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
      name: "@electron-forge/maker-pkg",
      platforms: ["darwin", "mas"],
      config: {},
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
      config: {
        options: {
          homepage: "https://www.deepnest.net",
          categories: ["Education", "Graphics", "Utility"],
        },
      },
    } /*
    {
      name: '@electron-forge/maker-snap',
      config: {
        features: {
          webgl: true,
          network: true,
        },
        base: "core24",
        summary: '2d nesting application',
        description: 'Deepnest is a 2D nesting application that helps you optimize the layout of your designs, reducing material waste and improving efficiency.',
        grade: 'stable',
      }
    },
    */,
  ],
  publishers: [
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
    /*
    {
      name: '@electron-forge/publisher-snapcraft',
      config: {
        release: '[latest/edge, insider/stable]'
      }
    },*/
    {
      name: '@electron-forge/publisher-s3',
      config: {
        bucket: process.env.S3_BUCKET || 'deepnest-next',
        region: process.env.S3_REGION || 'eu-central-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        endpoint: process.env.S3_ENDPOINT || 'https://s3.eu-central-1.amazonaws.com',
        s3ForcePathStyle: true,
        public: true,
        folder: 'deepnest-next',
        // refs: https://github.com/lobehub/lobe-chat/pull/5479
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      }
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      resetAdHocDarwinSignature:
        makerPlatform === "darwin" && makerArch == "arm64",
      [FuseV1Options.RunAsNode]: true,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

// Configure code signing based on environment
if (process.env.CI) {
  // CI Environment - GitHub Actions
  if (
    process.platform === "darwin" ||
    makerPlatform === "darwin" ||
    makerPlatform === "mas"
  ) {
    // Base signing configuration
    const baseSignConfig = {
      hardenedRuntime: true,
      gatekeeperAssess: false,
    };

    // Configure for MAS vs regular macOS builds
    if (makerPlatform === "mas") {
      // For MAS builds, use dedicated MAS identity
      if (process.env.APPLE_MAS_IDENTITY) {
        baseSignConfig.identity = process.env.APPLE_MAS_IDENTITY;
      }

      config.packagerConfig.osxSign = {
        ...baseSignConfig,
        entitlements: path.join(__dirname, "_assets", "entitlements.mas.plist"),
        "entitlements-inherit": path.join(
          __dirname,
          "_assets",
          "entitlements.mas.inherit.plist"
        ),
        "signature-flags": "library",
      };

      // Update PKG maker for MAS builds
      for (const maker of config.makers) {
        if (maker.name === "@electron-forge/maker-pkg") {
          maker.config = {
            ...maker.config,
            platform: "mas",
            provisioningProfile: path.join(
              __dirname,
              "_assets",
              "embedded.provisionprofile"
            ),
            name: `deepnest-${packageVersion}-${makerArch}-mas`, // new: pkg name for MAS build
          };

          // Use dedicated MAS installer identity
          if (process.env.APPLE_MAS_INSTALLER_IDENTITY) {
            maker.config.identity = process.env.APPLE_MAS_INSTALLER_IDENTITY;
          }

          if (process.env.APPLE_KEYCHAIN_PATH) {
            maker.config.keychain = process.env.APPLE_KEYCHAIN_PATH;
          }
        }
      }
    } else {
      // Regular macOS builds use Developer ID certificates
      if (process.env.APPLE_DEVELOPER_ID_APPLICATION) {
        baseSignConfig.identity = process.env.APPLE_DEVELOPER_ID_APPLICATION;
      }

      config.packagerConfig.osxSign = {
        ...baseSignConfig,
        entitlements: path.join(__dirname, "_assets", "entitlements.plist"),
        "entitlements-inherit": path.join(
          __dirname,
          "_assets",
          "entitlements.inherit.plist"
        ),
      };

      // Add notarization if all required environment variables exist
      if (
        process.env.APPLE_API_KEY_ID &&
        process.env.APPLE_API_ISSUER &&
        process.env.NOTARIZATION_KEY_PATH
      ) {
        config.packagerConfig.osxNotarize = {
          tool: "notarytool",
          appleApiKey: process.env.NOTARIZATION_KEY_PATH,
          appleApiKeyId: process.env.APPLE_API_KEY_ID,
          appleApiIssuer: process.env.APPLE_API_ISSUER,
        };
      }

      // Update PKG maker for regular builds
      for (const maker of config.makers) {
        if (maker.name === "@electron-forge/maker-pkg") {
          maker.config = {
            ...maker.config,
            platform: "darwin",
            name: `deepnest-${packageVersion}-${makerArch}-darwin`, // new: pkg name for darwin build
          };

          // Use dedicated Developer ID installer identity
          if (process.env.APPLE_DEVELOPER_ID_INSTALLER) {
            maker.config.identity = process.env.APPLE_DEVELOPER_ID_INSTALLER;
          }

          if (process.env.APPLE_KEYCHAIN_PATH) {
            maker.config.keychain = process.env.APPLE_KEYCHAIN_PATH;
          }
        }
      }
    }
  }
} else if (process.platform === "darwin") {
  // Local development on macOS
  config.packagerConfig.osxSign = {
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: path.join(__dirname, "_assets", "entitlements.plist"),
    "entitlements-inherit": path.join(
      __dirname,
      "_assets",
      "entitlements.inherit.plist"
    ),
  };

  // For local MAS builds
  if (makerPlatform === "mas") {
    config.packagerConfig.osxSign = {
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: path.join(__dirname, "_assets", "entitlements.mas.plist"),
      "entitlements-inherit": path.join(
        __dirname,
        "_assets",
        "entitlements.mas.inherit.plist"
      ),
      "signature-flags": "library",
    };

    for (const maker of config.makers) {
      if (maker.name === "@electron-forge/maker-pkg") {
        maker.config.platform = "mas";
        maker.config.name = `deepnest-${packageVersion}-${makerArch}-mas`; // new: pkg name for MAS build in local dev
        // Local dev may have embedded.provisionprofile in the _assets directory
        const profilePath = path.join(
          __dirname,
          "_assets",
          "embedded.provisionprofile"
        );
        try {
          if (require("fs").existsSync(profilePath)) {
            maker.config.provisioningProfile = profilePath;
          }
        } catch (e) {
          console.warn("Provisioning profile not found for local MAS build");
        }
      }
    }
  } else {
    for (const maker of config.makers) {
      if (maker.name === "@electron-forge/maker-pkg") {
        maker.config.name = `deepnest-${packageVersion}-${makerArch}-darwin`; // new: pkg name for darwin build in local dev
      }
    }
  }
}


console.log("Final config:", config);
console.log("Final config packagerConfig:", config.packagerConfig);
console.log("Final config makers:", config.makers);
module.exports = config;
