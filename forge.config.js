const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { rmSync } = require('fs');
const { globSync } = require('glob');
const path = require('path');



let includeFiles = [
  // we need to make sure the project root directory is included
  '.',
  'main.js',
  'presets.js',
  'notification-service.js',
  ...globSync('main/**'),
  'LICENSE',
  'LICENSE.md',
  'package.json',
  // per electron-packager's docs, a set of files in the node_modules directory are always ignored
  // unless we are providing an IgnoreFunction. Because we want to ignore a lot more files than
  // packager does by default, we need to ensure that we're including the relevant node_modules
  // while ignoring what packager normally would.
  // See https://electron.github.io/electron-packager/main/interfaces/electronpackager.options.html#ignore.
  ...globSync('node_modules/**', {
    ignore: [
      'node_modules/.bin/**',
      'node_modules/electron/**',
      'node_modules/electron-prebuilt/**',
      'node_modules/electron-prebuilt-compile/**',
      'node_modules/@deepnest/calculate-nfp/rust-minkowski/**',
      'node_modules/@deepnest/calculate-nfp/prebuilt/**',
    ],
  }),
];
// Fix: Use startsWith instead of includes to match node_modules paths
//console.log('Include files:', includeFiles.filter((f) => f.startsWith('node_modules')));
module.exports = {
  hooks: {
    packageAfterPrune: async (config, buildPath, electronVersion, platform, arch) => {
      const cwd = path.resolve(buildPath, 'node_modules', '@deepnest', 'calculate-nfp');
      const includeFiles = [
        'rust-minkowski',
        'bin',
        'src',
        'build',
        'node_modules',
      ];
      //console.log('packageAfterPrune', cwd);
      
      // Use for...of loop instead of forEach for async operations
      for (const file of includeFiles) {
        const filePath = path.join(cwd, file);
        //console.log('includeFiles', filePath);
        rmSync(filePath, { recursive: true, force: true });
      }
      
      //console.log('includeFiles', includeFiles);
      //console.log('ignoreFiles', ignoreFiles);
      const delay = ms => new Promise(res => setTimeout(res, ms));
      await delay(2000);
      return void 0;
    },
  },
  packagerConfig: {
    appCategoryType: "public.app-category.productivity",
    appBundleId: "net.deepnest.app",
    appCopyright: "Copyright © 2025 Josef Fröhle - www.deepnest.net",
    asar: true,
    ignore: (p) => {
      if (p === '') {
        return false;
      }
      let pResult = !includeFiles.includes(path.normalize(p.replace('/', '')));
      // if (pResult) {
      //   console.log('Checking path:', '"' + p.replace('/', '') + '"', '"' + path.normalize(p.replace('/', '')) + '"', pResult);
      // }
      return pResult;
    },
    prune: true,
  },
  rebuildConfig: {
    force: false
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },/*
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
