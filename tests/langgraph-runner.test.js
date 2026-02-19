import { test, expect } from '@playwright/test';
import { executeLangGraph } from '../agents/langgraph-runner.js';

test('executeLangGraph runs full flow in dryRun (no external calls)', async () => {
  const res = await executeLangGraph('check account', { llm: 'none', dryRun: true });
  expect(res.ok).toBe(true);
  expect(res.trace).toBeDefined();
  expect(res.trace.nodes.length).toBeGreaterThanOrEqual(3);
  const sim = res.trace.nodes.find(n => n.id === 'simulate');
  expect(sim).toBeDefined();
  expect(sim.result).toBeDefined();
  expect(sim.result.ok).toBeDefined();
});

test('executeLangGraph with llm=ollama in dryRun sets llm-dryRun', async () => {
  const res = await executeLangGraph('check account', { llm: 'ollama', dryRun: true });
  expect(res.ok).toBe(true);
  const llmNode = res.trace.nodes.find(n => n.role === 'llm');
  expect(llmNode.result).toBe('ollama-dryRun');
});
