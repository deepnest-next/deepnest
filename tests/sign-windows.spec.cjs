// helper_scripts/sign_windows.js must skip signing unless forceCodeSigning is set (only `npm run build-dist-signed` sets it).
const { test, expect } = require("@playwright/test");
const sign = require("../helper_scripts/sign_windows.js").default;

test("sign hook skips signing without forceCodeSigning", async () => {
  expect(await sign({ path: "x.exe", options: {} })).toBe(true);
});

test("sign hook still signs with forceCodeSigning", async () => {
  // No signtool on the test machine, so reaching the signing path returns false.
  process.env.SIGNTOOL_PATH = "/nonexistent/signtool.exe";
  expect(await sign({ path: "x.exe", options: { forceCodeSigning: true } })).toBe(false);
});
