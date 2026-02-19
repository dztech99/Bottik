import fs from 'fs';
import path from 'path';

class FingerprintRotator {
  constructor(personas = [], opts = {}) {
    this.personas = personas.map(p => (typeof p === 'string' ? { id: p } : p));
    this.stateFile = opts.stateFile || path.resolve(process.cwd(), '.bottok_fingerprint_state.json');
    this.index = 0;
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const raw = fs.readFileSync(this.stateFile, 'utf8');
        const json = JSON.parse(raw || '{}');
        if (typeof json.index === 'number') this.index = json.index % Math.max(1, this.personas.length);
      }
    } catch (e) {
      // ignore
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify({ index: this.index }), 'utf8');
    } catch (e) {
      // ignore
    }
  }

  next() {
    if (!this.personas || this.personas.length === 0) return null;
    const p = this.personas[this.index % this.personas.length];
    this.index = (this.index + 1) % this.personas.length;
    this._save();
    return p;
  }

  current() {
    if (!this.personas || this.personas.length === 0) return null;
    return this.personas[(this.index) % this.personas.length];
  }
}

export default FingerprintRotator;
export function createRotatorFromPersonas(personas, opts) {
  return new FingerprintRotator(personas, opts);
}
