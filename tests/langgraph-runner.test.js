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

test('web-scraper parses inline HTML and validator finds required text', async () => {
  const html = 'inline:<html><head><title>Inline Title</title><meta name="description" content="An inline description"></head><body>Example Domain</body></html>';
  const res = await executeLangGraph('fetch inline', { llm: 'none', dryRun: true, extended: true, target: html, require: ['Inline Title', 'Example Domain'] });
  expect(res.ok).toBe(true);
  const ws = res.trace.nodes.find(n => n.role === 'web-scraper');
  expect(ws).toBeDefined();
  expect(ws.result).toBeDefined();
  expect(ws.result.title).toBe('Inline Title');
  const val = res.trace.nodes.find(n => n.role === 'validator');
  expect(val.result.valid).toBe(true);
});

test('web-scraper parses inline JSON and validator applies JSON schema (positive case)', async () => {
  const js = 'inline:{"user":{"id":1,"name":"Alice"}}';
  const res = await executeLangGraph('fetch inline json', { llm: 'none', dryRun: true, extended: true, target: js, schema: { type: 'json', required: ['user.id','user.name'] } });
  expect(res.ok).toBe(true);
  const ws = res.trace.nodes.find(n => n.role === 'web-scraper');
  expect(ws.result.contentType).toBe('json');
  expect(ws.result.parsed.user.name).toBe('Alice');
  const val = res.trace.nodes.find(n => n.role === 'validator');
  expect(val.result.valid).toBe(true);
  expect(val.result.missing.length).toBe(0);
});

test('validator JSON schema negative case reports missing fields', async () => {
  const js = 'inline:{"user":{"id":1}}';
  const res = await executeLangGraph('fetch inline json', { llm: 'none', dryRun: true, extended: true, target: js, schema: { type: 'json', required: ['user.id','user.email'] } });
  expect(res.ok).toBe(true);
  const val = res.trace.nodes.find(n => n.role === 'validator');
  expect(val.result.valid).toBe(false);
  expect(val.result.missing).toContain('user.email');
});

test('web-scraper supports css selector on inline html', async () => {
  const html = 'inline:<html><body><h1 class="hero">Hello CSS</h1></body></html>';
  const res = await executeLangGraph('css test', { llm: 'none', dryRun: true, extended: true, target: html, selector: 'css:h1.hero' });
  expect(res.ok).toBe(true);
  const ws = res.trace.nodes.find(n => n.role === 'web-scraper');
  expect(ws.result.selection).toBe('Hello CSS');
});

test('web-scraper supports css attribute extraction', async () => {
  const html = 'inline:<html><body><a class="link" href="/go">Go</a></body></html>';
  const res = await executeLangGraph('css attr test', { llm: 'none', dryRun: true, extended: true, target: html, selector: 'css:a.link@href' });
  expect(res.ok).toBe(true);
  const ws = res.trace.nodes.find(n => n.role === 'web-scraper');
  expect(ws.result.selection).toBe('/go');
});

test('web-scraper supports jsonpath selector on inline json', async () => {
  const js = 'inline:{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]}';
  const res = await executeLangGraph('jsonpath test', { llm: 'none', dryRun: true, extended: true, target: js, selector: 'jsonpath:$.users[?(@.id==2)].name' });
  expect(res.ok).toBe(true);
  const ws = res.trace.nodes.find(n => n.role === 'web-scraper');
  expect(ws.result.contentType).toBe('json');
  expect(ws.result.parsed.users[1].name).toBe('Bob');
  expect(ws.result.selection).toBe('Bob');
});
