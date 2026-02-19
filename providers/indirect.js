import fs from 'fs';
import path from 'path';
import { launchHumanBrowser, simulateHumanActions, joinAndParticipateInTikTokLive } from '../human/simulator.js';
import { solveCaptcha } from '../utils/captcha.js';

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
    const stealthLog = args.stealth || args['stealth'] || 'full';
    const disabled = args.stealthDisable || args['stealth-disable'] || [];
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] task=${task} url=${url} persona=${result.persona || '-'} stealth=${stealthLog} stealthDisable=${Array.isArray(disabled)?disabled.join(';'):disabled} dryRun=${result.dryRun}\n`, 'utf8');
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
    // optional captcha simulation: if args.simulateCaptcha is true we try to solve
    if (args.simulateCaptcha) {
      const solved = await solveCaptcha(null, { simulate: true });
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] captcha_solved=${solved}\n`, 'utf8');
      // attach solved to result for test visibility
      result.captcha = solved;
    }

    if (task === 'live') {
      // Join and participate in TikTok Live
      const ok = await joinAndParticipateInTikTokLive({ action: args.action || 'like', commentText: args.commentText, visible: !!args.visible, persona: args.persona, proxies: args.proxies });
      result.ok = ok;
      result.actions = ['joined_live', args.action || 'like'];
      try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] status=success task=live\n`, 'utf8'); } catch (err) {}
      return result;
    }

    const { page, browser, persona } = await launchHumanBrowser(args);

    // navigate to target and do lightweight human-like interactions
    await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});

    // Map task to TikTok action for simulation
    let simArgs = { ...args };
    if (["like","share","comment","react","treasure","goody"].includes(String(task).toLowerCase())) {
      simArgs.action = String(task).toLowerCase();
      if (task === 'comment' && !simArgs.commentText) simArgs.commentText = 'Nice video!';
    }
    await simulateHumanActions(page, simArgs);

    await page.close();
    await browser.close();

    result.ok = true;
    result.actions = ['navigated', 'simulated', simArgs.action || 'generic'];
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
