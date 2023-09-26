<img src="https://deepnest.io/img/logo-large.png" alt="Deepnest" width="250">

## **Deepnest**

A fast nesting tool for laser cutters and other CNC tools

Deepnest is a desktop application originally based on [SVGNest](https://github.com/Jack000/SVGnest)

- New nesting engine with speed critical code written in C
- Merges common lines for laser cuts
- Support for DXF files (via conversion)
- New path approximation feature for highly complex parts

## Fork History

* https://github.com/Jack000/SVGnest (Academic Work References)
* https://github.com/Jack000/Deepnest
  * https://github.com/Dogthemachine/Deepnest
    * https://github.com/cmidgley/Deepnest
      * https://github.com/deepnest-io/Deepnest


## This Fork

The primary goal has been to get Deepnest buildable again, which has been achieved.


## Prerequisites

- **Node 14/16/18/20:** [Node.js](https://nodejs.org). You can use the Node Version Manager (nvm):
  -  [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) to download Node and change versions.
- **Python 3.7.9** You can use the Python Version Manager (pyenv):
  - [pyenv-win](https://github.com/pyenv-win/pyenv-win) to download and change versions.
- **Visual Studio with Desktop Development with C++ extension**
  - Install VS2022 from https://visualstudio.microsoft.com/vs/features/cplusplus/
  - or, as an administrator via `npm install --global windows-build-tools` (older VS version)

For ubuntu (or when you're not sure how to build) look at the build workflow:

https://github.com/deepnest-io/Deepnest/blob/master/.github/workflows/build.yml#L28

### Possible Problems

* On Windows 10 1905 or newer, you might need to **disable the built-in Python launcher** via
  - **Start** > "**Manage App Execution Aliases**" and turning off the "**App Installer" aliases   for Python**"
* close-and-open all command shells and your IDE to activate the latest setup


## Building

```sh
git clone https://github.com/deepnest-io/Deepnest
cd Deepnest
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

### Create a Distribution

```sh
npm run dist

# During development, you can combine `clean-all, build-all and dist` via:
npm run dist-all
```

The resulting files will be located in `.\deepnest-<version>-win32-x64`.

Create a zip file of this folder for a simple distribution.

## Debugging

If the environment variable "deepnest_debug" has a value of "1", Deepnest will open the browser dev tools (debugger/inspector).

## License

The main license is the MIT.

* [LICENSE](LICENSE)

Further Licenses:

* [LICENSES](LICENSES.md)
