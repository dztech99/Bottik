import { test, expect } from '@playwright/test';
import cookies from './tiktok-cookies.json' assert { type: "json" };

const actions = [
  { action: 'like', label: 'Like a post' },
  { action: 'share', label: 'Share a post' },
  { action: 'comment', label: 'Comment on a post', commentText: 'Automated comment!' },
  { action: 'react', label: 'React to a post' },
  { action: 'treasure', label: 'Open a Treasure Box' },
  { action: 'goody', label: 'Open a Goody Bag' }
];

actions.forEach(({ action, label, commentText }) => {
  test(`TikTok with session cookies: ${label}`, async ({ context, page }) => {
    await context.addCookies(cookies);
    await page.goto('https://www.tiktok.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Find a video link
    const videoLinks = await page.$$('a[href*="/video/"]');
    expect(videoLinks.length).toBeGreaterThan(0);
    await videoLinks[0].click();
    await page.waitForTimeout(5000);

    // Perform the action
    if (action === 'like') {
      const likeBtn = await page.$('button[aria-label*="Like"], .like-btn, .icon-like');
      if (likeBtn) await likeBtn.click();
    } else if (action === 'share') {
      const shareBtn = await page.$('button[aria-label*="Share"], .share-btn, .icon-share');
      if (shareBtn) await shareBtn.click();
    } else if (action === 'comment') {
      const commentInput = await page.$('textarea[placeholder*="Comment"], input[placeholder*="Comment"], .comment-input');
      if (commentInput) {
        await commentInput.type(commentText || 'Nice video!');
        const submitBtn = await page.$('button[type="submit"], .submit-btn, .send-btn');
        if (submitBtn) await submitBtn.click();
      }
    } else if (action === 'react') {
      const reactBtn = await page.$('button[aria-label*="React"], .react-btn, .icon-react');
      if (reactBtn) await reactBtn.click();
    } else if (action === 'treasure') {
      const treasureBtn = await page.$('button[aria-label*="Treasure"], .treasure-btn, .icon-treasure');
      if (treasureBtn) await treasureBtn.click();
    } else if (action === 'goody') {
      const goodyBtn = await page.$('button[aria-label*="Goody"], .goody-btn, .icon-goody');
      if (goodyBtn) await goodyBtn.click();
    }

    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/video/');
  });
});
