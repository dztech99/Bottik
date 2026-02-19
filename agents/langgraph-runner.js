import { runLangGraphFlow } from './langgraph.js';
import { generate as ollamaGenerate, isOllamaAvailable } from './ollama.js';
import { runProviderTask } from '../providers/indirect.js';

export async function executeLangGraph(prompt, opts = {}) {
  // pass opts through so runLangGraphFlow can include extended nodes
  const planObj = await runLangGraphFlow(prompt, opts);
  const nodes = (planObj.nodes || []).map(n => ({ ...n }));
  const trace = { plan: planObj.plan || nodes.map(n => n.id), nodes: [], summary: planObj.summary || '' };

  for (const node of nodes) {
    try {
      if (node.role === 'analyzer') {
        // lightweight analysis: count words and extract simple keywords
        const text = String(prompt || '');
        const words = text.split(/\s+/).filter(w => w.length > 3);
        node.result = { keywords: words.slice(0, 6), wordCount: words.length };

      } else if (node.role === 'web-scraper') {
        // optional web-scraper: can be simulated via providerDryRun or opts.dryRun
        const target = opts.target || 'about:blank';
        if (opts.providerDryRun || opts.dryRun) {
          node.result = { url: target, content: `SIMULATED_CONTENT for ${target}` };
        } else {
          // real fetch (network) - use node-fetch (dependency present)
          try {
            const fetch = (await import('node-fetch')).default; // lazy import
            const resp = await fetch(target, { timeout: 5000 });
            const text = await resp.text();
            node.result = { url: target, status: resp.status, snippet: String(text).slice(0, 512) };
          } catch (e) {
            node.result = { url: target, error: String(e) };
          }
        }

      } else if (node.role === 'llm') {
        if (opts.llm === 'ollama') {
          if (opts.dryRun) {
            node.result = 'ollama-dryRun';
          } else {
            const ok = await isOllamaAvailable();
            if (!ok) throw new Error('ollama-not-available');
            const out = await ollamaGenerate(prompt, { model: opts.model || 'llama2' });
            node.result = String(out).slice(0, 200);
          }
        } else {
          node.result = 'llm-simulated';
        }

      } else if (node.role === 'validator') {
        // validator inspects previous results and returns a pass/fail without throwing
        const llmNode = nodes.find(n => n.role === 'llm');
        const scraped = nodes.find(n => n.role === 'web-scraper');
        const hay = [llmNode?.result, scraped?.result?.content, prompt].filter(Boolean).join(' ');
        const required = Array.isArray(opts.require) ? opts.require : (opts.require ? [opts.require] : []);
        const missing = required.filter(r => String(hay).toLowerCase().indexOf(String(r).toLowerCase()) === -1);
        node.result = { valid: missing.length === 0, missing };

      } else if (node.role === 'simulator') {
        // call provider to perform simulation; providerDryRun overrides
        const providerArgs = { dryRun: !!(opts.providerDryRun ?? opts.dryRun) };
        const res = await runProviderTask({ task: 'simulate', url: opts.target || 'about:blank', args: providerArgs });
        node.result = res;

      } else if (node.role === 'reporter') {
        // collate previous node outputs into a short report
        node.result = {
          summary: trace.summary || `Report for ${String(prompt).slice(0, 80)}`,
          nodes: nodes.map(n => ({ id: n.id, result: n.result }))
        };
      } else {
        node.result = 'noop';
      }

      trace.nodes.push({ id: node.id, role: node.role, result: node.result });
    } catch (err) {
      node.error = String(err?.message || err);
      trace.nodes.push({ id: node.id, role: node.role, error: node.error });
      return { ok: false, error: node.error, trace };
    }
  }

  return { ok: true, trace };
}
