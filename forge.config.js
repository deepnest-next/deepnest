const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { net } = require('electron');

module.exports = {
  packagerConfig: {
    appCategoryType: "public.app-category.productivity",
    appBundleId: "net.deepnest.app",
    appCopyright: "Copyright © 2025 Josef Fröhle - www.deepnest.net",
    asar: true,
    ignore: [
      'tests',
      'examples',
      'debug',
      '.vscode',
      '.github',
      /\.zip$/i,
      /\.exe$/i,
      'playwright.config.ts',
      'renovate.json',
      'forge.config.js',
      /deepnest-v\d+\.\d+\.\d+-[a-z0-9]+-[a-z0-9]+/i,
      // ...ignoredPaths,
    ],
    prune: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
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
    },/* 
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        manufacturer: 'DeineAgentur UG (haftungsbeschränkt)',
        name: 'deepnest-next',
      }
    }, */
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'],
      config: (arch) => ({
        macUpdateManifestBaseUrl: `https://dl.deepnest.app/deepnest-next/darwin/${arch}`
      }),
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        background: './assets/dmg-background.png',
        format: 'ULFO'
      }
    },
    {
      name: '@electron-forge/maker-pkg',
      config: {
        //keychain: 'my-secret-ci-keychain'
        // other configuration options
      }
    },
    {
      name: '@electron-forge/maker-flatpak',
      config: {
        options: {
          categories: ['Education', 'Graphics', 'Utility'],
          mimeType: ['image/x-dxf', 'image/x-dwg', 'image/svg+xml', 'application/postscript', 'image/vnd.dxf', 'image/vnd.dwg'],
        }
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Josef Fröhle',
          homepage: 'https://www.deepnest.net',
          categories: ['Education', 'Graphics', 'Utility'],
          section: 'graphics',
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          homepage: 'https://www.deepnest.net',
          categories: ['Education', 'Graphics', 'Utility'],
        }
      }
    },
    {
      name: '@electron-forge/maker-snap',
      config: {
        features: {
          webgl: true,
          network: true,
        },
        summary: 'Pretty Awesome'
      }
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
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
