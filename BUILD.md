# Build


## Prerequisites

### General

- **Node 24:** [Node.js](https://nodejs.org) 24.x, the same major Electron 45 ships and the only version CI uses. You can use the Node Version Manager (nvm):
  - [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) to download Node and change versions.
- **Python 3.7.9 and up** You can use the Python Version Manager (pyenv):
  - [pyenv-win](https://github.com/pyenv-win/pyenv-win) to download and change versions.
- **RUST** setup rust via https://rustup.rs/ - mainly for used for plugins - currently not used in this repo.

### WINDOWS

- **Visual Studio with Desktop Development with C++ extension**
  - Install VS2022 from https://visualstudio.microsoft.com/vs/features/cplusplus/
  - or, as an administrator via `npm install --global windows-build-tools` (older VS version)

### MACOS

[Install Homebrew](https://docs.brew.sh/Installation)
```shell
xcode-select --install
brew install boost
```

### LINUX

Have a look in the workflow file:
https://github.com/deepnest-next/deepnest/blob/main/.github/workflows/build.yml#L28

- gcc
- clang
- libboost-dev

### Possible Problems

- On Windows 10 1905 or newer, you might need to **disable the built-in Python launcher** via
  - **Start** > "**Manage App Execution Aliases**" and turning off the "**App Installer" aliases for Python**"
- close-and-open all command shells and your IDE to activate the latest setup

## Building

```sh
git clone https://github.com/deepnest-next/deepnest
cd deepnest
npm install
npm run build
npm run start
```

### Rebuild

```sh
# If you change the electron-related files (web files, javascript), a build with
npm run build

# If you change the the Minkowski files (the `.cc` or `.h` files):
npm run build-all
```

### Running

- `npm run start`

### Clean builds

```sh
npm run clean  && npm run build

# full clean, incl. `node_modules`
npm run clean-all && npm install && npm run build
```

### Running the tests

The tests drive the Electron app itself, so Playwright's own Chromium is not needed. One-time setup:

```sh
# Playwright's ffmpeg build, used to record the test video
npx playwright install ffmpeg

# Linux only: the system libraries Electron needs (uses sudo)
npx playwright install-deps chromium
```

Without ffmpeg, the test fails at launch with an error asking you to install it.

Then, simply run `npm run test`.

### Add tests via playwright codegen

To create new tests you can run:

```sh
npm run pw:codegen
```

or

Linux/MacOS:
```sh
node ./helper_scripts/playwright_codegen.js
```

or

Windows:
```sh
node .\helper_scripts\playwright_codegen.js
```

### Create a Distribution

```sh
npm run dist

# During development, you can combine `clean-all, build-all and dist` via:
npm run dist-all
```

The resulting files will be located in `.\deepnest-<version>-win32-x64`.

Create a zip file of this folder for a simple distribution.

## Debugging

If the environment variable "deepnest_debug" has a value of "1", deepnest will open the browser dev tools (debugger/inspector).
