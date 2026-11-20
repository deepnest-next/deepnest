// helper_scripts/release_version.js: version choices of the manual release workflow (RELEASE.md).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { nextVersion } = require("../helper_scripts/release_version.js");

function bump(from, ...args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deepnest-version-"));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "x", version: from }));
  const v = nextVersion(...args, dir);
  expect(JSON.parse(fs.readFileSync(path.join(dir, "package.json"))).version).toBe(v);
  return v;
}

test("release bumps", () => {
  expect(bump("1.5.6", "patch", "", false)).toBe("1.5.7");
  expect(bump("1.5.6", "minor", "", false)).toBe("1.6.0");
  expect(bump("1.5.6", "major", "", false)).toBe("2.0.0");
  expect(bump("1.6.0-beta.1", "patch", "", false)).toBe("1.6.0"); // final release after betas
});

test("pre-release bumps", () => {
  expect(bump("1.5.6", "minor", "", "true")).toBe("1.6.0-beta.0");
  expect(bump("1.6.0-beta.0", "prerelease", "", "true")).toBe("1.6.0-beta.1");
  expect(bump("1.5.6", "custom", "v1.6.0-rc.1", "false")).toBe("1.6.0-rc.1");
});

test("bad versions are refused", () => {
  expect(() => bump("1.5.6", "custom", "1.6.0.1-beta", false)).toThrow(/not a version/);
  expect(() => bump("1.5.6", "custom", "1.6.0; rm -rf /", false)).toThrow(/not a version/);
  expect(() => bump("1.5.6", "custom", "1.6.0", "true")).toThrow(/no suffix/);
  expect(() => bump("1.5.6", "custom", "", false)).toThrow(/not a version/);
  expect(() => bump("1.5.6", "sideways", "", false)).toThrow(/unknown bump/);
});
