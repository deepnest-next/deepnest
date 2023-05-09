# Deepnest Changelong
(newest on top)


### Code changes from cmidgley fork

Aside from improving the ability to build (mostly in `binding.gyp`, `package.json`, and
`README.md`), the following changes have also been made:

- Cloned the `plus.svg` file into `add_sheet.svg` (it was missing) for the add-sheet icon.
- Added environment variable `deepnest_debug` to open the browser dev tools (see [Browser dev
  tools](#browser-dev-tools)).
- Checked for thrown errors on a couple paths that would cause expections when closing the
  application while the nest was still running.  A better solution would be to cleanly shutdown the
  workers when the app is closed, but this works for now (but could hide important exceptions).
  The two places are marked with a `// todo:` comment in `main.js`.
- Removed a bunch of unused source files.  There are likely more to be discovered.  There also
  appears to be code that is unused within the source files.
- Eliminated the dependency on a manually downloaded instance of boost (completion of work from
  prior fork, using the `polygon` sub-repo).
- Removed all build artifacts.  This means there is no pre-built binaries in this fork and a build
  is required in order to use this.  Eventually a cleaner release solution, perhaps with ZIP or an installer,
  should be added along with making releases offical in GitHub.
- Bumped the version number to 1.0.6cm (the 'cm' to indicate this has come from the `cmidgley`
  fork).
- Eliminated the dependency on the `c:\nest` directory pre-existing, instead using the os-specific temp directory
  (`os.tmpdir()`) and creating it if it does not exist.  
- Clarified the license is MIT.  Removed an old reference to GPL and added the `license` property to
  `package.json`.  Moved the `LICENSE.txt` file to the root and renamed to `LICENSE`.
