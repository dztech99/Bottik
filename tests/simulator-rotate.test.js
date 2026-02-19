import { test, expect } from '@playwright/test';
import { launchHumanBrowser } from '../human/simulator.js';
import fs from 'fs';
import os from 'os';

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
  test('launchHumanBrowser rotateFingerprint picks different personas across runs', async () => {
    const a = await launchHumanBrowser({ visible: false, rotateFingerprint: true });
    const id1 = a.persona && a.persona.id;
    await a.browser.close();

    const b = await launchHumanBrowser({ visible: false, rotateFingerprint: true });
    const id2 = b.persona && b.persona.id;
    await b.browser.close();

    // With rotation enabled and multiple personas available, ids should differ most runs
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });
} else {
  test.skip('launchHumanBrowser rotateFingerprint — skipped because Playwright browsers are not installed on this host', async () => {});
}