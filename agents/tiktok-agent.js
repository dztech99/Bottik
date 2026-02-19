import sqlite3 from 'sqlite3';
import config from '../config/default.js';

const db = new sqlite3.Database('./memory.db');

import { generate as ollamaGenerate, isOllamaAvailable } from './ollama.js';

export async function startAgentMode(args = {}) {
  console.log('🤖 startAgentMode — local demo (Ollama optional)');
  const prompt = args.agent || 'demo';

  // minimal local "agent" behavior for tests: store prompt and return analysis
  await new Promise((res) => db.run('CREATE TABLE IF NOT EXISTS logs(id INTEGER PRIMARY KEY, action TEXT)', res));
  await new Promise((res) => db.run('INSERT INTO logs(action) VALUES (?)', prompt, res));

  const messages = [`agent-received: ${prompt}`, 'action-simulated'];

  // optional Ollama integration (only if requested and not dryRun)
  if (args.llm === 'ollama' && !args.dryRun) {
    try {
      const ok = await isOllamaAvailable();
      if (ok) {
        const resp = await ollamaGenerate(prompt, { model: args.model || 'llama2' });
        messages.push(`llm:${String(resp).slice(0,120)}`);
      } else {
        messages.push('llm-not-available');
      }
    } catch (err) {
      messages.push('llm-error');
    }
  } else if (args.llm === 'ollama' && args.dryRun) {
    messages.push('llm-dryRun');
  }

  const reply = { messages };
  console.log('Agent result:', reply.messages);
  return reply;
}
