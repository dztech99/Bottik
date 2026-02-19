// LangGraph-style flow (enhanced stub)
import { generate as ollamaGenerate, isOllamaAvailable } from './ollama.js';

export async function runLangGraphFlow(prompt, opts = {}) {
  const summary = `Plan for: ${String(prompt).slice(0,120)}`;

  // node-level plan (simple graph of steps)
  const nodes = [
    { id: 'analyze', role: 'analyzer', description: `Analyze input: ${String(prompt).slice(0,80)}` },
    { id: 'call_llm', role: 'llm', description: 'Generate guidance / instructions' },
    { id: 'simulate', role: 'simulator', description: 'Simulate actions' },
    { id: 'report', role: 'reporter', description: 'Produce final report' }
  ];

  // extended nodes (optional)
  if (opts.extended) {
    // place web-scraper after analyzer, validator after llm
    nodes.splice(1, 0, { id: 'web-scraper', role: 'web-scraper', description: 'Fetch target URL for context' });
    nodes.splice(3, 0, { id: 'validator', role: 'validator', description: 'Validate intermediate outputs' });
  }

  // If Ollama requested and available, call it (unless dryRun)
  if (opts.llm === 'ollama') {
    if (opts.dryRun) {
      nodes[1].result = 'ollama-dryRun';
      return { plan: nodes.map(n => n.id), nodes, summary, llm: nodes[1].result };
    }

    const ok = await isOllamaAvailable();
    if (ok) {
      const out = await ollamaGenerate(prompt, { model: opts.model || 'llama2' });
      nodes[1].result = String(out).slice(0,400);
      // continue with simulated downstream steps
      nodes[0].result = 'analysis-complete';
      nodes[2].result = 'simulation-complete';
      nodes[3].result = 'report-ready';
      return { plan: nodes.map(n => n.id), nodes, summary, llm: nodes[1].result };
    }

    nodes[1].result = 'ollama-not-available';
    return { plan: nodes.map(n => n.id), nodes, summary, note: 'ollama-not-available' };
  }

  // default deterministic local plan
  nodes[0].result = 'analysis-complete';
  nodes[1].result = 'llm-simulated';
  nodes[2].result = 'simulation-complete';
  nodes[3].result = 'report-ready';

  return { plan: nodes.map(n => n.id), nodes, summary };
}
