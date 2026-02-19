import EventEmitter from 'events';
import fs from 'fs';

class TraceStore extends EventEmitter {
  constructor(limit = 200, opts = {}) {
    super();
    this.limit = limit;
    this.traces = [];
    this.filePath = opts.filePath || null; // if set, supports persistence
    if (this.filePath) this._loadFromFile();
  }

  pushTrace(item) {
    const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, ts: Date.now(), ...item };
    this.traces.unshift(record);
    if (this.traces.length > this.limit) this.traces.length = this.limit;
    this.emit('push', record);
    if (this.filePath) this._saveToFile();
    return record;
  }

  getTraces({ limit = 50 } = {}) {
    return this.traces.slice(0, Math.min(limit, this.traces.length));
  }

  clear() {
    this.traces = [];
    this.emit('clear');
    if (this.filePath) this._saveToFile();
  }

  _saveToFile() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.traces.slice(0, this.limit)), 'utf8');
    } catch (e) {
      // ignore save errors but emit an event for visibility
      this.emit('error', e);
    }
  }

  _loadFromFile() {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const arr = JSON.parse(raw || '[]');
      if (Array.isArray(arr)) this.traces = arr.slice(0, this.limit);
    } catch (e) {
      this.emit('error', e);
    }
  }

  saveToFile(path) {
    this.filePath = path || this.filePath;
    if (!this.filePath) throw new Error('no-path-specified');
    this._saveToFile();
  }

  loadFromFile(path) {
    this.filePath = path || this.filePath;
    if (!this.filePath) throw new Error('no-path-specified');
    this._loadFromFile();
  }
}

const store = new TraceStore();
export default store;