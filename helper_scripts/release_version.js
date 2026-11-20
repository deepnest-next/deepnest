// Next release version for the manual release workflow (see RELEASE.md).
// Writes it to package.json/package-lock.json via `npm version` and prints it without "v".
// Usage: node helper_scripts/release_version.js <patch|minor|major|prerelease|custom> [version] [prerelease: true|false]
const { execSync } = require("child_process");

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z]+(\.[0-9A-Za-z]+)*)?$/;

function nextVersion(bump, custom, prerelease, cwd = process.cwd()) {
  const pre = prerelease === true || prerelease === "true";
  let arg;
  if (bump === "custom") {
    arg = (custom || "").trim().replace(/^v/, "");
    // Also keeps the value safe to pass to the shell below.
    if (!SEMVER.test(arg)) throw new Error(`"${custom}" is not a version like 1.6.0 or 1.6.0-beta.1`);
    if (pre && !arg.includes("-")) throw new Error(`${arg} is checked as pre-release but has no suffix, e.g. ${arg}-beta.1`);
  } else if (["patch", "minor", "major"].includes(bump)) {
    arg = pre ? `pre${bump}` : bump; // prepatch/preminor/premajor give e.g. 1.6.0-beta.0
  } else if (bump === "prerelease") {
    arg = "prerelease"; // 1.6.0-beta.0 -> 1.6.0-beta.1
  } else {
    throw new Error(`unknown bump "${bump}"`);
  }
  const out = execSync(`npm version ${arg} --preid beta --no-git-tag-version`, { cwd, encoding: "utf8" });
  return out.trim().split("\n").pop().replace(/^v/, "");
}

module.exports = { nextVersion };

if (require.main === module) {
  try {
    console.log(nextVersion(...process.argv.slice(2)));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
