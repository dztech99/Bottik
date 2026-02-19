import { test, expect } from '@playwright/test';
import { startLangGraphMode } from '../agents/langgraph-agent.js';

test('startLangGraphMode returns trace when dryRun', async () => {
  const res = await startLangGraphMode({ flow: 'analyze X', dryRun: true });
  expect(res).toBeDefined();
  // runner returns { ok, trace }
  expect(res.trace).toBeDefined();
  expect(Array.isArray(res.trace.nodes)).toBe(true);
  expect(res.trace.nodes.length).toBeGreaterThan(0);
});

test('startLangGraphMode with llm=ollama in dryRun returns llm-dryRun marker', async () => {
  const res = await startLangGraphMode({ flow: 'analyze X', llm: 'ollama', dryRun: true });
  expect(res).toBeDefined();
  expect(res.trace).toBeDefined();
  const llmNode = res.trace.nodes.find(n => n.role === 'llm');
  expect(llmNode).toBeDefined();
  expect(llmNode.result).toBe('ollama-dryRun');
});