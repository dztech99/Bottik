export default [
  {
    id: 'desktop_chrome_1',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
    timezone: 'America/Los_Angeles',
    minWatch: 8,
    maxWatch: 22
  },
  {
    id: 'mobile_safari_iphone',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    locale: 'en-US',
    timezone: 'America/New_York',
    minWatch: 12,
    maxWatch: 45
  },
  {
    id: 'tablet_android',
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 800, height: 1280 },
    locale: 'en-GB',
    timezone: 'Europe/London',
    minWatch: 5,
    maxWatch: 30
  }
];
