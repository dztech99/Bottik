import { runLangGraphFlow } from './langgraph.js';
import fs from 'fs';
import path from 'path';

export async function startLangGraphMode(args = {}) {
  const prompt = args.flow || args.prompt || args.agent || 'example workflow';
  const opts = { llm: args.llm, model: args.model, dryRun: !!args.dryRun };

  // write trace to activity.log for auditing
  const logPath = path.resolve(process.cwd(), 'activity.log');
  try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] langgraph_start prompt=${String(prompt).slice(0,80)} llm=${opts.llm || '-'} dryRun=${opts.dryRun}\n`); } catch (e) {}

  const res = await runLangGraphFlow(prompt, opts);

  try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] langgraph_result plan=${(res.plan||[]).join('|')}\n`); } catch (e) {}

  return res;
}
