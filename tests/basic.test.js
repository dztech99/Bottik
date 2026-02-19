import { test, expect } from '@playwright/test';
import { launchHumanBrowser } from '../human/simulator.js';
import { startAgentMode } from '../agents/tiktok-agent.js';

import { execSync } from 'child_process';

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
  test('Browser Launch (headless)', async () => {
    const { browser, page } = await launchHumanBrowser({ visible: false });
    expect(browser).toBeTruthy();
    await page.close();
    await browser.close();
  });
} else {
  test.skip('Browser Launch (headless) — skipped because Playwright browsers are not installed on this host', async () => {});
}

test('Agent Invoke (local DB)', async () => {
  const res = await startAgentMode({ agent: 'unit-test' });
  expect(res).toBeDefined();
  expect(res.messages[0]).toContain('agent-received');
});
