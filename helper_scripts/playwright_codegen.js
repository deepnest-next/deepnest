const { _electron: electron } = require('playwright');

(async () => {
  const browser = await electron.launch({ args: ['.'] });
  const context = await browser.context();
  await context.route('**/*', route => route.continue());

  await require('node:timers/promises').setTimeout(3000); // wait for the window to load
  await browser.windows()[0].pause(); // .pause() opens the Playwright-Inspector for manual recording
})();
