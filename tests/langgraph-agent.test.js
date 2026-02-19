import { test, expect } from '@playwright/test';
import { startLangGraphMode } from '../agents/langgraph-agent.js';

test('startLangGraphMode returns plan stub when dryRun', async () => {
  const res = await startLangGraphMode({ flow: 'analyze X', dryRun: true });
  expect(res).toBeDefined();
  expect(res.plan).toBeDefined();
  expect(res.plan.length).toBeGreaterThan(0);
});

test('startLangGraphMode with llm=ollama in dryRun returns plan without network', async () => {
  const res = await startLangGraphMode({ flow: 'analyze X', llm: 'ollama', dryRun: true });
  expect(res).toBeDefined();
  expect(res.plan).toBeDefined();
});