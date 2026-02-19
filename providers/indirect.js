import fs from 'fs';
import path from 'path';
import { launchHumanBrowser, simulateHumanActions } from '../human/simulator.js';

/**
 * providers/indirect.js
 *
 * Playwright-based compatible provider implementation (safe reimplementation).
 * - honors `args.persona`, `args.proxies`/`args.proxy`, and `args.dryRun`
 * - writes activity.log entries for auditing
 * - keeps behavior simple and testable (use `dryRun` in CI/tests)
 */

export async function startIndirectMode(args = {}) {
  console.log('Indirect mode — Playwright-compatible provider (reimplementation).');
  const task = args.task || args.t || 'Up Views';
  const url = args.video || args.l || args.link || (args._ && args._[0]) || 'https://www.tiktok.com/';
  return runProviderTask({ task, url, args });
}

export async function runProviderTask({ task, url, args = {} }) {
  const result = {
    ok: false,
    mode: 'indirect',
    task,
    url,
    persona: args.persona || null,
    dryRun: !!args.dryRun
  };

  const logPath = path.resolve(process.cwd(), 'activity.log');
  try {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] task=${task} url=${url} persona=${result.persona || '-'} dryRun=${result.dryRun}\n`, 'utf8');
  } catch (err) {
    // best-effort logging
  }

  // Allow fast unit/CI testing without launching browsers
  if (result.dryRun || process.env.CI === 'true' || args.noBrowser) {
    result.ok = true;
    result.note = 'dry-run — no browser launched';
    return result;
  }

  try {
    const { page, browser, persona } = await launchHumanBrowser(args);

    // navigate to target and do lightweight human-like interactions
    await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
    await simulateHumanActions(page, args);

    await page.close();
    await browser.close();

    result.ok = true;
    result.actions = ['navigated', 'simulated'];
    result.persona = result.persona || (persona && (persona.id || persona));

    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] status=success task=${task}\n`, 'utf8');
    } catch (err) {}

    return result;
  } catch (err) {
    try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] status=error task=${task} error=${String(err).slice(0,200)}\n`, 'utf8'); } catch (e) {}
    result.ok = false;
    result.error = err?.message || String(err);
    return result;
  }
}
