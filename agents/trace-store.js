import EventEmitter from 'events';

class TraceStore extends EventEmitter {
  constructor(limit = 200) {
    super();
    this.limit = limit;
    this.traces = [];
  }

  pushTrace(item) {
    const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, ts: Date.now(), ...item };
    this.traces.unshift(record);
    if (this.traces.length > this.limit) this.traces.length = this.limit;
    this.emit('push', record);
    return record;
  }

  getTraces({ limit = 50 } = {}) {
    return this.traces.slice(0, Math.min(limit, this.traces.length));
  }

  clear() {
    this.traces = [];
    this.emit('clear');
  }
}

const store = new TraceStore();
export default store;