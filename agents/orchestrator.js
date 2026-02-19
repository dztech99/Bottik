import fs from 'fs';
import path from 'path';
import { openTraceDB, insertTrace } from './trace-sqlite.js';
import EventEmitter from 'events';
import { runLangGraphFlow } from './langgraph.js';
import { analyzerWorker, webScraperWorker, llmWorker, validatorWorker, simulatorWorker, reporterWorker } from './langgraph-executors.js';
import ProxyRotator, { createRotatorFromFile } from '../utils/proxy-rotator.js';
import { createRotatorFromPersonas } from '../utils/fingerprint-rotator.js';
import personas from '../config/personas.js';
import { createWorkerClient } from './worker-client.js';

// Lightweight in-process orchestrator (pipeline topology)
export class Orchestrator {
  constructor(opts = {}) {
    this.opts = opts;
    this.bus = new EventEmitter();
    this.proxyRotator = null;
    this.fingerprintRotator = createRotatorFromPersonas(personas, { stateFile: opts.stateFile });
    this._running = false;
    this._proxyInterval = null;
    this.workerClient = null; // optional worker client (remote or local adapter)
  }

  async _startProxyMonitor(list = []) {
    this.proxyRotator = new ProxyRotator(list || []);
    // run one immediate check and schedule periodic checks while orchestrator is active
    try { await this.proxyRotator.checkAll(500); } catch (e) {}
    this._proxyInterval = setInterval(async () => {
      try { await this.proxyRotator.checkAll(1000); this.bus.emit('proxy.check', { ok: true }); } catch (e) { this.bus.emit('proxy.check', { ok: false, error: String(e) }); }
    }, 3000);
  }

  _stopProxyMonitor() {
    if (this._proxyInterval) { clearInterval(this._proxyInterval); this._proxyInterval = null; }
  }

  async runPipeline(prompt, opts = {}) {
    this._running = true;
    const planObj = await runLangGraphFlow(prompt, opts);
    const nodes = (planObj.nodes || []).map(n => ({ ...n }));
    const trace = { plan: planObj.plan || nodes.map(n => n.id), nodes: [], summary: planObj.summary || '' };

    for (const node of nodes) {
      // delegate to configured worker client when available, otherwise call in-process workers
      try {
        const useClient = this.workerClient && typeof this.workerClient.execute === 'function';
        if (useClient) {
          const res = await this.workerClient.execute({ role: node.role, node, prompt, opts });
          node.result = res;
        } else {
          if (node.role === 'analyzer') {
            node.result = await analyzerWorker(prompt, node, opts);

          } else if (node.role === 'web-scraper') {
            node.result = await webScraperWorker(node, opts);

          } else if (node.role === 'llm') {
            // orchestrator will use mock/dry-run LLM by default if opts.llm is falsy
            node.result = await llmWorker(node, prompt, opts);

          } else if (node.role === 'validator') {
            node.result = await validatorWorker(node, nodes, prompt, opts);

          } else if (node.role === 'simulator') {
            // pick rotated persona if requested
            if (opts.rotateFingerprint) opts.persona = this.fingerprintRotator.next();
            node.result = await simulatorWorker(node, opts);

          } else if (node.role === 'reporter') {
            node.result = await reporterWorker(node, nodes, prompt, opts);

          } else {
            node.result = 'noop';
          }
        }

        trace.nodes.push({ id: node.id, role: node.role, result: node.result });
        this.bus.emit('node.complete', { id: node.id, role: node.role, result: node.result });
      } catch (err) {
        node.error = String(err?.message || err);
        trace.nodes.push({ id: node.id, role: node.role, error: node.error });
        this.bus.emit('node.error', { id: node.id, role: node.role, error: node.error });
        this._running = false;
        this._stopProxyMonitor();
        return { ok: false, error: node.error, trace };
      }
    }

    this._running = false;
    this._stopProxyMonitor();
    return { ok: true, trace };
  }
}

export async function startOrchestratorMode(args = {}) {
  const prompt = args.flow || args.prompt || args.agent || 'orchestrator flow';
  const opts = { llm: args.llm || 'mock', model: args.model, dryRun: !!args.dryRun, extended: !!(args.extended || args['flow-extended'] || args.flowExtended), providerDryRun: !!args.providerDryRun, require: args.require, target: args.target, selector: args.selector, rotateFingerprint: !!args.rotateFingerprint };

  const orchestrator = new Orchestrator({ stateFile: args.stateFile });
  // configure worker client (remote URL via --worker-url or env BOTTOK_WORKER_URL)
  const workerUrl = args.workerUrl || process.env.BOTTOK_WORKER_URL || null;
  orchestrator.workerClient = createWorkerClient({ url: workerUrl });

  // start proxy monitor if proxies provided
  if (args.proxies) {
    const list = Array.isArray(args.proxies) ? args.proxies : String(args.proxies || '').split(',').map(s => s.trim()).filter(Boolean);
    await orchestrator._startProxyMonitor(list);
  }

  try {
    const res = await orchestrator.runPipeline(prompt, opts);
    try { fs.appendFileSync(path.resolve(process.cwd(), 'activity.log'), `[${new Date().toISOString()}] orchestrator_result ok=${res.ok} nodes=${(res.trace?.nodes||[]).length}\n`); } catch (e) {}

    // push into SQLite for cross-process visibility
    let db;
    try {
      const dbPath = args.persistFile || process.env.BOTTOK_TRACES_FILE || path.resolve(process.cwd(), '.bottok_traces.sqlite');
      db = await openTraceDB(dbPath);
      const rec = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, ts: Date.now(), source: 'orchestrator', prompt, trace: res.trace, ok: res.ok };
      await insertTrace(db, rec);
      await db.close();
    } catch (e) {
      if (db) {
        try { await db.close(); } catch (closeErr) { console.error('Error closing DB:', closeErr); }
      }
      console.error('SQLite DB error in orchestrator:', e);
    }

    return res;
  } finally {
    orchestrator._stopProxyMonitor();
  }
}
