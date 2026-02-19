import { test, expect } from '@playwright/test';
import { runLangGraphFlow } from '../agents/langgraph.js';

test('runLangGraphFlow returns structured multi-step plan (no llm)', async () => {
  const res = await runLangGraphFlow('evaluate X', { dryRun: true });
  expect(res).toBeDefined();
  expect(Array.isArray(res.plan)).toBe(true);
  expect(Array.isArray(res.nodes)).toBe(true);
  expect(res.nodes.length).toBeGreaterThanOrEqual(3);
  expect(res.nodes[0]).toHaveProperty('id');
  expect(res.nodes[0]).toHaveProperty('result');
});

test('runLangGraphFlow with llm=ollama (dryRun) includes llm-dryRun marker', async () => {
  const res = await runLangGraphFlow('evaluate X', { llm: 'ollama', dryRun: true });
  expect(res).toBeDefined();
  expect(res.nodes.find(n => n.id === 'call_llm').result).toBe('ollama-dryRun');
});
