export default [
  {
    id: 'desktop_chrome_1',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
    timezone: 'America/Los_Angeles',
    hardwareConcurrency: 8,
    deviceMemory: 8,
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
    hardwareConcurrency: 6,
    deviceMemory: 2,
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
    hardwareConcurrency: 4,
    deviceMemory: 3,
    minWatch: 5,
    maxWatch: 30
  },
  {
    id: 'desktop_firefox_windows',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezone: 'America/Chicago',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    minWatch: 6,
    maxWatch: 24
  },
  {
    id: 'android_pixel_6',
    userAgent:
      'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    locale: 'en-US',
    timezone: 'America/Los_Angeles',
    hardwareConcurrency: 8,
    deviceMemory: 4,
    minWatch: 10,
    maxWatch: 50
  },
  {
    id: 'ipad_safari_landscape',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 1024, height: 768 },
    locale: 'en-GB',
    timezone: 'Europe/London',
    hardwareConcurrency: 4,
    deviceMemory: 4,
    minWatch: 8,
    maxWatch: 40
  }
];
