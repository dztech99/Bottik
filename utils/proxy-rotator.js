class ProxyRotator {
  constructor(proxies = [], opts = {}) {
    this.proxies = Array.isArray(proxies) ? proxies.slice() : [];
    this.index = 0;
    this.failed = new Map(); // proxy -> fail count / timestamp
    this.strategy = opts.strategy || 'round-robin';
  }

  _isHealthy(p) {
    const f = this.failed.get(p);
    if (!f) return true;
    const backoffMs = Math.min(60_000, 1000 * Math.pow(2, Math.min(6, f.count || 0)));
    return (Date.now() - (f.at || 0)) > backoffMs;
  }

  next() {
    if (!this.proxies || this.proxies.length === 0) return null;
    const len = this.proxies.length;
    for (let i = 0; i < len; ++i) {
      if (this.strategy === 'random') {
        const candidate = this.proxies[Math.floor(Math.random() * len)];
        if (this._isHealthy(candidate)) return candidate;
      } else {
        const idx = (this.index + i) % len;
        const candidate = this.proxies[idx];
        if (this._isHealthy(candidate)) {
          this.index = (idx + 1) % len;
          return candidate;
        }
      }
    }
    // no healthy proxies
    return null;
  }

  markFailed(proxy) {
    const rec = this.failed.get(proxy) || { count: 0, at: 0 };
    rec.count = (rec.count || 0) + 1;
    rec.at = Date.now();
    this.failed.set(proxy, rec);
  }

  markHealthy(proxy) {
    this.failed.delete(proxy);
  }
}

export default ProxyRotator;
export function createRotatorFromFile(filePath, loaders) {
  // convenience: expects an array of proxies (string)
  return new ProxyRotator(loaders || []);
}
