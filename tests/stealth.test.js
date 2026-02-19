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
    const persona = { id: 'test-persona', locale: 'en-US', hardwareConcurrency: 4, deviceMemory: 4, viewport: { width: 800, height: 600 } };
    const { page, browser } = await launchHumanBrowser({ visible: false, persona });

    // apply stealth and navigate to about:blank to evaluate (default full)
    await applyPageStealth(page, persona, 'full');
    await page.goto('about:blank');

    const stealthMarker = await page.evaluate(() => window.__bottok_stealth);
    const webdriver = await page.evaluate(() => navigator.webdriver);
    const languages = await page.evaluate(() => navigator.languages);
    const hc = await page.evaluate(() => navigator.hardwareConcurrency);
    const dm = await page.evaluate(() => navigator.deviceMemory);
    const hasChrome = await page.evaluate(() => !!window.chrome);
    const pluginsLength = await page.evaluate(() => (navigator.plugins && navigator.plugins.length) || 0);
    const connType = await page.evaluate(() => (navigator.connection && navigator.connection.effectiveType) || null);
    const devicesLen = await page.evaluate(() => navigator.mediaDevices.enumerateDevices().then(d => d.length));
    const screenW = await page.evaluate(() => screen.width);
    const canvasData = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 300; c.height = 150;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ff0000'; ctx.fillRect(0,0,10,10);
      return c.toDataURL().slice(0,30);
    });
    const fnToString = await page.evaluate(() => Function.prototype.toString.call(Array.prototype.push));
    const fontsAvailable = await page.evaluate(() => typeof document.fonts !== 'undefined');

    expect(stealthMarker).toBe('full');
    expect(webdriver).toBe(false);
    expect(Array.isArray(languages)).toBe(true);
    expect(hc).toBe(persona.hardwareConcurrency);
    expect(dm).toBe(persona.deviceMemory);
    expect(hasChrome).toBe(true);
    expect(pluginsLength).toBeGreaterThan(0);
    expect(connType).toBeTruthy();
    expect(devicesLen).toBe(0);
    expect(screenW).toBe(persona.viewport.width);
    expect(typeof canvasData).toBe('string');
    expect(fnToString).toContain('native code');
    expect(fontsAvailable).toBe(true);

    await browser.close();
  });

  test('applyPageStealth respects stealth levels (none | lite | full)', async () => {
    const personaId = 'desktop_chrome_1';

    const full = await launchHumanBrowser({ visible: false, persona: personaId, stealth: 'full' });
    const fullMarker = await full.page.evaluate(() => window.__bottok_stealth);
    await full.browser.close();

    const lite = await launchHumanBrowser({ visible: false, persona: personaId, stealth: 'lite' });
    const liteMarker = await lite.page.evaluate(() => window.__bottok_stealth);
    await lite.browser.close();

    const none = await launchHumanBrowser({ visible: false, persona: personaId, stealth: 'none' });
    const noneMarker = await none.page.evaluate(() => window.__bottok_stealth);
    await none.browser.close();

    expect(fullMarker).toBe('full');
    expect(liteMarker).toBe('lite');
    expect(noneMarker).toBe('none');
  });

  test('applyPageStealth respects disabled shims (canvas/toString)', async () => {
    const personaId = 'desktop_chrome_1';

    const full = await launchHumanBrowser({ visible: false, persona: personaId, stealth: 'full' });
    const canvasFull = await full.page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 300; c.height = 150;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ff0000'; ctx.fillRect(0,0,10,10);
      return c.toDataURL().slice(0,30);
    });
    await full.browser.close();

    const disabled = await launchHumanBrowser({ visible: false, persona: personaId, stealth: 'full', stealthDisable: 'canvas,toString' });
    const canvasDisabled = await disabled.page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 300; c.height = 150;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ff0000'; ctx.fillRect(0,0,10,10);
      return c.toDataURL().slice(0,30);
    });
    const disabledList = await disabled.page.evaluate(() => window.__bottok_disabled_shims || []);
    await disabled.browser.close();

    // when canvas shim is disabled the canvas output should differ from full (which injects noise),
    // and the disabled marker should be set
    expect(canvasFull).not.toBe(canvasDisabled);
    expect(disabledList).toContain('canvas');
  });

  test('launchHumanBrowser applies session jitter to userAgent when enabled', async () => {
    // ensure jitter changes UA deterministically in implementation
    const personaId = 'desktop_chrome_1';
    const a = await launchHumanBrowser({ visible: false, persona: personaId });
    const ua1 = await a.page.evaluate(() => navigator.userAgent);
    await a.browser.close();

    const b = await launchHumanBrowser({ visible: false, persona: personaId });
    const ua2 = await b.page.evaluate(() => navigator.userAgent);
    await b.browser.close();

    expect(typeof ua1).toBe('string');
    expect(typeof ua2).toBe('string');
    expect(ua1).not.toBe(ua2);

    // with noJitter they should match
    const n1 = await launchHumanBrowser({ visible: false, persona: personaId, noJitter: true });
    const nu1 = await n1.page.evaluate(() => navigator.userAgent);
    await n1.browser.close();

    const n2 = await launchHumanBrowser({ visible: false, persona: personaId, noJitter: true });
    const nu2 = await n2.page.evaluate(() => navigator.userAgent);
    await n2.browser.close();

    expect(nu1).toBe(nu2);
  });
} else {
  test.skip('applyPageStealth — skipped because Playwright browsers are not installed on this host', async () => {});
}
