<img src="https://deepnest.io/img/logo-large.png" alt="Deepnest" width="250">

## **Deepnest**

A fast, robust nesting tool for laser cutters and other CNC tools

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


## Support, issues and pull requests

The primary goal has been to get Deepnest buildable again, to prevent it to become abandonware as the original author does not seem to be activley involved. The goal of creating the fork under this organization is to create again a centralized repo where development of this program can continue. 
It would be wonderful if more contributors join this organization so we can bring
this project back to life, update it with latest dependencies and start adding features / fixing
issues.


## Prerequisites

- **Node 8/10/12/14:** Use [Node.js](https://nodejs.org) version 8, 10, 12, 14. You can use the Node Version Manager (nvm):
  -  [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) to download Node and change versions.
- **Python 2.7** (Python 3 does not work).  Recommend using Python version manager   [pyenv-win](https://github.com/pyenv-win/pyenv-win) to download and change versions.  Make sure to  close all command shells (including VSCode) after doing this, to get the latest environment variables.  Check with `python --version`.
- **Visual Studio 2019 with Desktop Development wit C++ extension**s - `node-gyp` (the Node to C++ binding environment) requires it.
  - See [this page](https://nodejs.github.io/node-addon-examples/getting-started/tools/#:~:text=It%20is%20not%20necessary%20to,that%20has%20everything%20you%20need.) for a simple to install package that may work
  - manually Install VS2019 with C++ extensions, if the above does not work

### Possible Problems

* if your VCINSTALLDIR points to VS2022, clear it
  * `set VCINSTALLDIR=`
* On Windows 10 1905 or newer, you might need to **disable the built-in Python launcher** via
  - **Start** > "**Manage App Execution Aliases**" and turning off the "**App Installer" aliases   for Python**"
    
## Building

```sh
git clone --recurse-submodules --remote-submodules https://github.com/deepnest-io/Deepnest
cd Deepnest
npm config set msvs_version 2019
npm install
npm run build
npm run start
```

### Rebuild

```sh
# If you change the electron-related files (web files, javascript), a build with 
npm run build

# If you change the the Minkowski files (the `.cc` or `.h` files):
npm run fullbuild
```

## Running

Unless you want to create a [distribution build](#create-a-distribution-build) (a separate set of
executable files that can be run without dependency on the build environment), you can run Deepnest with:

- `npm run start`

## Clean builds

Two clean options:
- For regular clean of build artifacts, use `npm run clean` and then `npm run build`.
- To remove everything, including `node_modules` use `npm run fullclean`, then [build](#building) again.

## Create a distribution build

To build a distribution set of files, run:

- `npm run dist`

The resulting files will be located in `.\deepnest-win32-x64`.  All files need to be distributed,
meaning a ZIP file or writing a simple installer would be needed to avoid handling a larger number
of files.

## Browser dev tools

If the environment variable "deepnest_debug" has a value of "1", Deepnest will open the browser
dev tools (debugger/inspector).

## License

The main license is the MIT.

| Unit | License | Copyright|
| - | - | - |
| /main | MIT | Copyright (c) 2015 Jack Qiao |
| /main/svgnest.js | MIT  | ? |
| /main/svgparser.js | MIT | ? |
| /main/deepnest.js | GPLv3 | ? |
| /main/uitil/filesaver.js | MIT |  By Eli Grey, http://eligrey.com |
| /main/util/interact.js | MIT | Copyright (c) 2012-2015 Taye Adeyemi |
| /main/util/clipper | Boost | Copyright :  Angus Johnson 2010-2014 |
| /main/util/clippernode.js | Boost | Copyright :  Angus Johnson 2010-2014 |
| minkowski.cc, minkowski.h | Boost | Copyright 2010 Intel Corporation</br>Copyright 2015 Jack Qiao |
| /polygon | Boost |  Copyright 2018 Glen Joseph Fernandes |
