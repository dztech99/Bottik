import { test, expect } from '@playwright/test';
import { runLangGraphFlow } from '../agents/langgraph.js';

test('runLangGraphFlow returns plan stub when no llm', async () => {
  const res = await runLangGraphFlow('do X', { dryRun: true });
  expect(res.plan).toBeDefined();
  expect(res.plan.length).toBeGreaterThan(0);
});

test('runLangGraphFlow with llm=ollama in dryRun returns fallback', async () => {
  const res = await runLangGraphFlow('do X', { llm: 'ollama', dryRun: true });
  expect(res.plan).toBeDefined();
});