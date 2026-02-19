import sqlite3 from 'sqlite3';
import config from '../config/default.js';

const db = new sqlite3.Database('./memory.db');

export async function startAgentMode(args = {}) {
  console.log('🤖 startAgentMode — local demo (Ollama optional)');
  const prompt = args.agent || 'demo';

  // minimal local "agent" behavior for tests: store prompt and return analysis
  await new Promise((res) => db.run('CREATE TABLE IF NOT EXISTS logs(id INTEGER PRIMARY KEY, action TEXT)', res));
  await new Promise((res) => db.run('INSERT INTO logs(action) VALUES (?)', prompt, res));

  const reply = { messages: [`agent-received: ${prompt}`, 'action-simulated'] };
  console.log('Agent result:', reply.messages);
  return reply;
}
