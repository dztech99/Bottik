import { test, expect } from '@playwright/test';
import cookies from './tiktok-cookies.json' assert { type: "json" };

test('Like and comment on karadzi posts', async ({ context, page }) => {
  await context.addCookies(cookies);
  await page.goto('https://www.tiktok.com/@karadzi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Scroll to load more videos if needed, with debug screenshots
  let videoLinks = [];
  for (let scroll = 0; scroll < 10; ++scroll) {
    videoLinks = await page.$$('a[href*="/video/"]');
    await page.screenshot({ path: `karadzi-profile-scroll${scroll}.png` });
    if (videoLinks.length >= 3) break;
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(4000);
  }
  // Retry if still not found
  for (let retry = 0; retry < 5 && videoLinks.length === 0; ++retry) {
    await page.waitForTimeout(4000);
    videoLinks = await page.$$('a[href*="/video/"]');
    await page.screenshot({ path: `karadzi-profile-retry${retry}.png` });
  }
  expect(videoLinks.length).toBeGreaterThan(0);

  // Like and comment on up to 3 posts
  for (let i = 0; i < Math.min(3, videoLinks.length); ++i) {
    // Use bounding box click to avoid overlays
    const box = await videoLinks[i].boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else {
      await videoLinks[i].click();
    }
    await page.waitForTimeout(7000);
    await page.screenshot({ path: `karadzi-post${i}.png` });

    // Like
    const likeBtn = await page.$('button[aria-label*="Like"], .like-btn, .icon-like');
    if (likeBtn) await likeBtn.click().catch(() => {});
    await page.waitForTimeout(2000);

    // Comment
    const commentInput = await page.$('textarea[placeholder*="Comment"], input[placeholder*="Comment"], .comment-input');
    if (commentInput) {
      await commentInput.type('Great video!');
      const submitBtn = await page.$('button[type="submit"], .submit-btn, .send-btn');
      if (submitBtn) await submitBtn.click().catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Go back to profile
    await page.goBack({ waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
  }

  // Manual fallback: keep browser open for manual interaction if automation fails
  if (videoLinks.length === 0) {
    console.log('No video links found. Please interact manually.');
    await page.waitForTimeout(60000); // 1 minute for manual intervention
  }
});
