import { chromium } from 'playwright';
import config from '../config/default.js';

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export async function launchHumanBrowser(args = {}) {
  const browser = await chromium.launch({ headless: !(args.visible) });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: args.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  return { page, browser };
}

export async function simulateHumanActions(page, args = {}) {
  // lightweight human-like scrolling + interactions demonstration
  await page.goto('https://www.tiktok.com/', { waitUntil: 'networkidle' }).catch(()=>{});

  // simulate short FYP scrolling session
  const passes = args.passes || 4;
  for (let i = 0; i < passes; ++i) {
    const scrollBy = rand(400, 900);
    await page.mouse.wheel(0, scrollBy);
    await page.waitForTimeout(rand(800, 2600));
  }

  // optional demo typing into search box (if present)
  try {
    const search = await page.$('input[placeholder]');
    if (search) {
      await search.click();
      const text = args.demoText || 'nice video';
      for (const c of text) {
        await page.keyboard.type(c, { delay: rand(40, 160) });
      }
      await page.waitForTimeout(rand(300, 700));
    }
  } catch (err) {
    // ignore — demo only
  }
  console.log('✅ simulateHumanActions completed (demo).');
  return true;
}
