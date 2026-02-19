import fetch from 'node-fetch';

const DEFAULT_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

export async function isOllamaAvailable() {
  try {
    const res = await fetch(`${DEFAULT_URL}/v1/models`, { method: 'GET', timeout: 2000 });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function generate(prompt, opts = {}) {
  // Best-effort, non-fatal wrapper around a local Ollama HTTP API.
  // We attempt /v1/generate (common) and /api/generate as fallbacks.
  const payload = { prompt, ...opts };
  const endpoints = [`${DEFAULT_URL}/v1/generate`, `${DEFAULT_URL}/api/generate`];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
      if (!res.ok) continue;
      const json = await res.json();
      // Common field names vary; try to normalise
      if (json.output) return json.output;
      if (json.results && json.results[0] && json.results[0].output) return json.results[0].output;
      return JSON.stringify(json);
    } catch (err) {
      // try next endpoint
    }
  }

  throw new Error('Ollama not available');
}
