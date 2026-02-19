export function applyPageStealth(page, persona = {}) {
  // Remove webdriver flag
  page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // languages
  const languages = (persona.locale || 'en-US').split('-')[0];
  page.addInitScript((langs) => {
    Object.defineProperty(navigator, 'languages', { get: () => [langs] });
  }, languages);

  // plugins (fake)
  page.addInitScript(() => {
    // eslint-disable-next-line no-undef
    Object.defineProperty(navigator, 'plugins', { get: () => [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }] });
  });

  // apply viewport/userAgent via context when launching the browser (handled elsewhere)
}

export function contextOptionsFromPersona(persona = {}) {
  return {
    viewport: persona.viewport || { width: 1280, height: 720 },
    userAgent: persona.userAgent ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    locale: persona.locale || 'en-US',
    timezoneId: persona.timezone || 'UTC'
  };
}
