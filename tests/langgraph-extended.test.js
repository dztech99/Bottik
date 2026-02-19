import { test, expect } from '@playwright/test';
import { runLangGraphFlow } from '../agents/langgraph.js';
import { executeLangGraph } from '../agents/langgraph-runner.js';

test('runLangGraphFlow with extended nodes includes web-scraper and validator', async () => {
  const res = await runLangGraphFlow('fetch example', { extended: true, target: 'https://example.com' });
  expect(res.plan).toBeDefined();
  expect(res.nodes.find(n => n.role === 'web-scraper')).toBeDefined();
  expect(res.nodes.find(n => n.role === 'validator')).toBeDefined();
});

test('executeLangGraph handles web-scraper (providerDryRun) and validator', async () => {
  const res = await executeLangGraph('fetch example', { llm: 'none', dryRun: true, extended: true, providerDryRun: true, target: 'https://example.com', require: ['example'] });
  expect(res.ok).toBe(true);
  const ws = res.trace.nodes.find(n => n.role === 'web-scraper');
  const val = res.trace.nodes.find(n => n.role === 'validator');
  expect(ws).toBeDefined();
  expect(ws.result).toBeDefined();
  expect(val).toBeDefined();
  expect(typeof val.result.valid).toBe('boolean');
});