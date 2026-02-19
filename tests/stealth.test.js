import { test, expect } from '@playwright/test';
import { launchHumanBrowser } from '../human/simulator.js';
import { applyPageStealth } from '../browser/stealth.js';
import os from 'os';
import fs from 'fs';

function playwrightBrowsersInstalled() {
  const home = os.homedir();
  const cacheDir = process.env.PLAYWRIGHT_BROWSERS_PATH || `${home}/.cache/ms-playwright`;
  try {
    if (!fs.existsSync(cacheDir)) return false;
    const entries = fs.readdirSync(cacheDir);
    for (const e of entries) {
      const candidate = `${cacheDir}/${e}/chrome-headless-shell`;
      if (fs.existsSync(candidate)) return true;
      const candidate2 = `${cacheDir}/${e}/chrome`; if (fs.existsSync(candidate2)) return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}

const canRunBrowserTest = playwrightBrowsersInstalled();

if (canRunBrowserTest) {
  test('applyPageStealth sets expected navigator properties', async () => {
    const persona = { id: 'test-persona', locale: 'en-US', hardwareConcurrency: 4, deviceMemory: 4 };
    const { page, browser } = await launchHumanBrowser({ visible: false, persona });

    // apply stealth and navigate to about:blank to evaluate
    await applyPageStealth(page, persona);
    await page.goto('about:blank');

    const webdriver = await page.evaluate(() => navigator.webdriver);
    const languages = await page.evaluate(() => navigator.languages);
    const hc = await page.evaluate(() => navigator.hardwareConcurrency);
    const dm = await page.evaluate(() => navigator.deviceMemory);
    const hasChrome = await page.evaluate(() => !!window.chrome);
    const pluginsLength = await page.evaluate(() => (navigator.plugins && navigator.plugins.length) || 0);

    expect(webdriver).toBe(false);
    expect(Array.isArray(languages)).toBe(true);
    expect(hc).toBe(persona.hardwareConcurrency);
    expect(dm).toBe(persona.deviceMemory);
    expect(hasChrome).toBe(true);
    expect(pluginsLength).toBeGreaterThan(0);

    await browser.close();
  });
} else {
  test.skip('applyPageStealth — skipped because Playwright browsers are not installed on this host', async () => {});
}
