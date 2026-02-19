import { test, expect } from '@playwright/test';

// End-to-end test for TikTok Live join and participation

test('TikTok Live: join and like', async ({ page }) => {
  // Go to TikTok Live page
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
