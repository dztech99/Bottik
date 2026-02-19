export function applyPageStealth(page, persona = {}, level = 'full', disabledShims = []) {
  // normalize disabled shims into a Set for quick checks
  const disabled = Array.isArray(disabledShims) ? new Set(disabledShims.map(s => String(s).toLowerCase())) : new Set(String(disabledShims || '').split(',').map(s => s.trim()).filter(Boolean));

  // expose selected stealth level & disabled shims for runtime tests
  page.addInitScript((lvl, disabledArr) => { try { window.__bottok_stealth = lvl; window.__bottok_disabled_shims = disabledArr || []; } catch (e) {} }, level, Array.from(disabled));

  // if level === 'none' we only set the marker and skip shims (unless explicitly disabled is empty)
  if (level === 'none' && disabled.size === 0) return;

  // navigator.webdriver -> false (base shim)
  if (!disabled.has('navigator') && !disabled.has('webdriver')) {
    page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  }

  // languages (support array from persona.locale or persona.languages)
  if (!disabled.has('languages')) {
    const langs = persona.languages || [(persona.locale || 'en-US')];
    page.addInitScript((langsArr) => {
      Object.defineProperty(navigator, 'languages', { get: () => langsArr });
    }, langs);
  }

  // fake plugins and mimeTypes
  if (!disabled.has('plugins') && !disabled.has('mimeTypes')) {
    page.addInitScript(() => {
      const fakePlugins = [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }];
      Object.defineProperty(navigator, 'plugins', { get: () => fakePlugins });
      Object.defineProperty(navigator, 'mimeTypes', { get: () => fakePlugins.map(p => ({ type: p.name })) });
    });
  }

  // hardwareConcurrency & deviceMemory
  if (!disabled.has('hardware') && !disabled.has('hardwareconcurrency') && !disabled.has('devicememory')) {
    const hw = persona.hardwareConcurrency || 4;
    const dm = persona.deviceMemory || 4;
    page.addInitScript((hwc, devMem) => {
      try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => hwc }); } catch (e) {}
      try { Object.defineProperty(navigator, 'deviceMemory', { get: () => devMem }); } catch (e) {}
    }, hw, dm);
  }

  // navigator.connection shim
  if (!disabled.has('connection')) {
    const conn = persona.connection || { type: 'wifi', effectiveType: '4g', downlink: 10, rtt: 50 };
    page.addInitScript((c) => {
      try { Object.defineProperty(navigator, 'connection', { get: () => c }); } catch (e) {}
    }, conn);
  }

  // screen property shim (based on persona.viewport)
  if (!disabled.has('screen')) {
    const sw = (persona.viewport && persona.viewport.width) || 1280;
    const sh = (persona.viewport && persona.viewport.height) || 720;
    page.addInitScript((w, h) => {
      try {
        Object.defineProperty(window, 'screen', { get: () => ({ width: w, height: h, availWidth: w, availHeight: h, colorDepth: 24, pixelDepth: 24 }) });
      } catch (e) {}
    }, sw, sh);
  }

  // mediaDevices.enumerateDevices shim (returns empty list)
  if (!disabled.has('mediadevices') && !disabled.has('media')) {
    page.addInitScript(() => {
      try {
        if (!navigator.mediaDevices) navigator.mediaDevices = {};
        navigator.mediaDevices.enumerateDevices = () => Promise.resolve([]);
      } catch (e) {}
    });
  }

  // basic permissions shim (query)
  if (!disabled.has('permissions')) {
    page.addInitScript(() => {
      const origQuery = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = (parameters) => {
        if (parameters && parameters.name === 'notifications') {
          return Promise.resolve({ state: 'denied' });
        }
        return origQuery(parameters);
      };
    });
  }

  // emulate window.chrome for Chromium personas
  if (!disabled.has('chrome')) {
    page.addInitScript(() => {
      // eslint-disable-next-line no-undef
      if (!window.chrome) window.chrome = { runtime: {} };
    });
  }

  // WebGL vendor/renderer spoof (minimal)
  if (!disabled.has('webgl')) {
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
  }

  // apply deeper shims only for 'full' stealth (and not disabled)
  if (level === 'full') {
    if (!disabled.has('toString')) {
      // Function.prototype.toString masking (prevent detection of patched functions)
      page.addInitScript(() => {
        try {
          const nativeToString = Function.prototype.toString;
          const originalCall = nativeToString.bind(Function.prototype.toString);
          Function.prototype.toString = function () {
            try {
              return originalCall(this);
            } catch (e) {
              return 'function () { [native code] }';
            }
          };
        } catch (e) {}
      });
    }

    if (!disabled.has('canvas')) {
      // Canvas fingerprint noise: slightly alter returned image data
      page.addInitScript(() => {
        try {
          const toDataURL = HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL = function () {
            try {
              const ctx = this.getContext('2d');
              if (ctx) {
                const w = Math.max(1, Math.floor(this.width / 100));
                const h = Math.max(1, Math.floor(this.height / 100));
                const img = ctx.getImageData(0, 0, w, h);
                img.data[0] = (img.data[0] + 1) % 255;
                ctx.putImageData(img, 0, 0);
              }
            } catch (e) {}
            return toDataURL.apply(this, arguments);
          };
        } catch (e) {}
      });
    }

    if (!disabled.has('fonts')) {
      // Font enumeration shim (document.fonts)
      page.addInitScript(() => {
        try {
          if (!document.fonts) {
            Object.defineProperty(document, 'fonts', {
              get: () => ({ check: () => true, forEach: (cb) => { ['Arial', 'Times New Roman', 'Roboto'].forEach(cb); } })
            });
          }
        } catch (e) {}
      });
    }

    if (!disabled.has('audio')) {
      // Audio fingerprint mitigation (stub out audio processing where possible)
      page.addInitScript(() => {
        try {
          const OrigCtx = window.OfflineAudioContext || window.AudioContext;
          if (OrigCtx && OrigCtx.prototype && OrigCtx.prototype.createAnalyser) {
            const origCreateAnalyser = OrigCtx.prototype.createAnalyser;
            OrigCtx.prototype.createAnalyser = function () {
              try {
                const analyser = origCreateAnalyser.apply(this, arguments);
                analyser.getFloatFrequencyData = analyser.getFloatFrequencyData || function () { return new Float32Array(0); };
                return analyser;
              } catch (e) {
                return origCreateAnalyser.apply(this, arguments);
              }
            };
          }
        } catch (e) {}
      });
    }
  }
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
