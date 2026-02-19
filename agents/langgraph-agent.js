// import { runLangGraphFlow } from './langgraph.js';
import fs from 'fs';
import path from 'path';

export async function startLangGraphMode(args = {}) {
  const prompt = args.flow || args.prompt || args.agent || 'example workflow';
  const opts = { llm: args.llm, model: args.model, dryRun: !!args.dryRun, extended: !!(args['flow-extended'] || args.flowExtended), providerDryRun: !!args.providerDryRun, require: args.require };

  // write trace to activity.log for auditing
  const logPath = path.resolve(process.cwd(), 'activity.log');
  try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] langgraph_start prompt=${String(prompt).slice(0,80)} llm=${opts.llm || '-'} dryRun=${opts.dryRun}\n`); } catch (e) {}

  // Execute the LangGraph plan (step-by-step)
  const { executeLangGraph } = await import('./langgraph-runner.js');
  const execRes = await executeLangGraph(prompt, opts);

  try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] langgraph_result ok=${execRes.ok} nodes=${(execRes.trace?.nodes||[]).length}\n`); } catch (e) {}

  try {
    const store = await import('./trace-store.js');
    store.default.pushTrace({ source: 'langgraph', prompt, trace: execRes.trace, ok: execRes.ok });
    const persistPath = args.persistFile || process.env.BOTTOK_TRACES_FILE || path.resolve(process.cwd(), '.bottok_traces.json');
    const rec = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, ts: Date.now(), source: 'langgraph', prompt, trace: execRes.trace, ok: execRes.ok };
    try { store.appendTraceToFile(persistPath, rec); } catch (e) { /* ignore */ }
  } catch (e) {}

  return execRes;
}
