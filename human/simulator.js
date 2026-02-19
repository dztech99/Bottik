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

export async function launchHumanBrowser(args = {}) {
  const persona = choosePersona(args.persona);
  const ctxOpts = contextOptionsFromPersona(persona);

  const launchOpts = { headless: !(args.visible) };
  // proxy support if provided
  const proxies = args.proxies ? loadProxiesFromFile(args.proxies) : [];
  const proxy = args.proxy || pickRandomProxy(proxies);
  if (proxy) launchOpts.proxy = { server: proxy };

  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();

  // apply stealth JS hooks
  await applyPageStealth(page, persona);

  return { page, browser, persona };
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
