import { chromium } from 'playwright';
import config from '../config/default.js';
import personas from '../config/personas.js';
import { contextOptionsFromPersona, applyPageStealth } from '../browser/stealth.js';
import { loadProxiesFromFile, pickRandomProxy } from '../utils/proxy.js';

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function choosePersona(id) {
  if (!id) return personas[Math.floor(Math.random() * personas.length)];
  const p = personas.find((x) => x.id === id);
  return p || personas[0];
}

// small helper: ensure UA version changes deterministically during jitter
function _jitterNumber(n, min = 0) {
  const delta = Math.floor(Math.random() * 3) - 1; // -1,0,1
  return Math.max(min, n + (delta === 0 ? 1 : delta));
}

function jitterChromeUA(ua) {
  try {
    const m = ua.match(/Chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
    if (!m) return ua;
    const major = parseInt(m[1], 10);
    const minor = _jitterNumber(parseInt(m[2], 10));
    const build = parseInt(m[3], 10);
    const patch = parseInt(m[4], 10);
    return ua.replace(/Chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/, `Chrome/${major}.${minor}.${build}.${patch}`);
  } catch (e) {
    return ua;
  }
}

function jitterFirefoxUA(ua) {
  try {
    const m = ua.match(/Firefox\/(\d+)\.(\d+)/);
    if (!m) return ua;
    const major = parseInt(m[1], 10);
    const minor = _jitterNumber(parseInt(m[2], 10));
    return ua.replace(/Firefox\/(\d+)\.(\d+)/, `Firefox/${major}.${minor}`);
  } catch (e) {
    return ua;
  }
}

export async function launchHumanBrowser(args = {}) {
  const persona = choosePersona(args.persona);
  // clone so defaults remain unchanged
  const sessionPersona = { ...persona };

  const noJitter = args.noJitter || args['no-jitter'] || false;
  if (!noJitter) {
    if (sessionPersona.hardwareConcurrency) {
      sessionPersona.hardwareConcurrency = Math.max(1, sessionPersona.hardwareConcurrency + (Math.floor(Math.random() * 3) - 1));
    }
    if (sessionPersona.deviceMemory) {
      sessionPersona.deviceMemory = Math.max(1, sessionPersona.deviceMemory + (Math.floor(Math.random() * 3) - 1));
    }

    if (sessionPersona.userAgent && /Chrome\//.test(sessionPersona.userAgent)) {
      sessionPersona.userAgent = jitterChromeUA(sessionPersona.userAgent);
    } else if (sessionPersona.userAgent && /Firefox\//.test(sessionPersona.userAgent)) {
      sessionPersona.userAgent = jitterFirefoxUA(sessionPersona.userAgent);
    }
  }

  const ctxOpts = contextOptionsFromPersona(sessionPersona);

  const launchOpts = { headless: !(args.visible) };
  // proxy support if provided
  const proxies = args.proxies ? loadProxiesFromFile(args.proxies) : [];
  const proxy = args.proxy || pickRandomProxy(proxies);
  if (proxy) launchOpts.proxy = { server: proxy };

  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();

  // apply stealth JS hooks
  await applyPageStealth(page, sessionPersona);

  return { page, browser, persona: sessionPersona };
}

export async function simulateHumanActions(page, args = {}) {
  // accept persona passed in args
  const passes = args.passes || rand(3, 6);
  for (let i = 0; i < passes; ++i) {
    const scrollBy = rand(300, 1000);
    await page.mouse.wheel(0, scrollBy);
    await page.waitForTimeout(rand(800, 3000));
  }

  // short random interactions
  try {
    // random click occasionally
    if (Math.random() < 0.3) {
      const els = await page.$$('a, button');
      if (els.length) {
        const el = els[Math.floor(Math.random() * els.length)];
        await el.click().catch(() => {});
      }
    }
  } catch (err) {
    // ignore errors in demo
  }

  console.log('✅ simulateHumanActions completed (persona-demo).');
  return true;
}
