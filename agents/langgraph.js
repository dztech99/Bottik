// Minimal LangGraph-style flow stub — replace with real LangGraph integration later
import { generate as ollamaGenerate, isOllamaAvailable } from './ollama.js';

export async function runLangGraphFlow(prompt, opts = {}) {
  // For now: if Ollama requested and available, call it; otherwise return a deterministic plan
  if (opts.llm === 'ollama' && !opts.dryRun) {
    const ok = await isOllamaAvailable();
    if (ok) {
      const out = await ollamaGenerate(prompt, { model: opts.model || 'llama2' });
      return { plan: ['llm:call'], llm: String(out).slice(0,200) };
    }
    return { plan: ['fallback-local'], note: 'ollama-not-available' };
  }
  // deterministic sample plan
  return { plan: ['analyze', 'simulate', 'report'], summary: `simulated plan for: ${String(prompt).slice(0,80)}` };
}
