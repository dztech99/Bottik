import { test, expect } from '@playwright/test';
import cookies from './tiktok-cookies.json' assert { type: "json" };

test('TikTok with session cookies: join and like a Live', async ({ context, page }) => {
  // Load your TikTok session cookies
  await context.addCookies(cookies);

  // Go to TikTok Live page (should be logged in)
  await page.goto('https://www.tiktok.com/live', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Find a live video link
  const liveLinks = await page.$$('a[href*="/live/"]');
  expect(liveLinks.length).toBeGreaterThan(0);
  await liveLinks[0].click();
  await page.waitForTimeout(5000);

  // Try to like the live
  const likeBtn = await page.$('button[aria-label*="Like"], .like-btn, .icon-like');
  if (likeBtn) {
    await likeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Check that we are still on a live page
  expect(page.url()).toContain('/live/');
});
