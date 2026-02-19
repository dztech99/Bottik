import fs from 'fs';
import path from 'path';

/**
 * providers/indirect.js
 *
 * Compatibility adapter for the original Bottok provider logic (Zefoy/Freer).
 * This file intentionally contains an adapter + helper functions so you can
 * safely port the original `bottok.js` logic into this module without
 * modifying the core CLI. The original implementation is not included here
 * (copyright). Paste or port the provider-specific code into `runProviderTask()`.
 */

export async function startIndirectMode(args = {}) {
  console.log('Indirect mode adapter — use providers.runProviderTask() to plug original logic.');
  console.log('Args:', args);
  // Minimal flow for tests/demo: validate inputs and return a stub result
  const task = args.task || args.t || 'Up Views';
  const url = args.video || args.l || args.link || args._ && args._[0] || 'https://www.tiktok.com/';
  return runProviderTask({ task, url, args });
}

export async function runProviderTask({ task, url, args }) {
  // TODO: port bottok.js provider internals here (Puppeteer + captcha + cloudflare handling)
  // For now we return a safe stub so the CLI can exercise the provider path.
  console.log(`(stub) running provider task=${task} url=${url}`);

  // simulate work and write an activity log
  try {
    const logLine = `[${new Date().toISOString()}] task=${task} url=${url} status=stubbed` + '\n';
    const logPath = path.resolve(process.cwd(), 'activity.log');
    fs.appendFileSync(logPath, logLine, { encoding: 'utf8' });
  } catch (err) {
    // ignore logging failures in demo mode
  }

  return { ok: true, mode: 'indirect', task, url };
}
