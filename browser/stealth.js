export function applyPageStealth(page, persona = {}) {
  // navigator.webdriver -> false
  page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // languages (support array from persona.locale or persona.languages)
  const langs = persona.languages || [(persona.locale || 'en-US')];
  page.addInitScript((langsArr) => {
    Object.defineProperty(navigator, 'languages', { get: () => langsArr });
  }, langs);

  // fake plugins and mimeTypes
  page.addInitScript(() => {
    const fakePlugins = [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }];
    Object.defineProperty(navigator, 'plugins', { get: () => fakePlugins });
    Object.defineProperty(navigator, 'mimeTypes', { get: () => fakePlugins.map(p => ({ type: p.name })) });
  });

  // hardwareConcurrency & deviceMemory
  const hw = persona.hardwareConcurrency || 4;
  const dm = persona.deviceMemory || 4;
  page.addInitScript((hwc, devMem) => {
    try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => hwc }); } catch (e) {}
    try { Object.defineProperty(navigator, 'deviceMemory', { get: () => devMem }); } catch (e) {}
  }, hw, dm);

  // basic permissions shim (query)
  page.addInitScript(() => {
    const origQuery = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (parameters) => {
      if (parameters && parameters.name === 'notifications') {
        return Promise.resolve({ state: 'denied' });
      }
      return origQuery(parameters);
    };
  });

  // emulate window.chrome for Chromium personas
  page.addInitScript(() => {
    // eslint-disable-next-line no-undef
    if (!window.chrome) window.chrome = { runtime: {} };
  });

  // WebGL vendor/renderer spoof (minimal)
  page.addInitScript(() => {
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (param) {
        // 37445 = UNMASKED_VENDOR_WEBGL, 37446 = UNMASKED_RENDERER_WEBGL
        if (param === 37445) return 'Intel Inc.';
        if (param === 37446) return 'ANGLE (Intel, Intel(R) UHD Graphics 750, OpenGL 4.1)';
        return getParameter.call(this, param);
      };
    } catch (e) {}
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
