import { test, expect } from '@playwright/test';
import { startDashboardMode } from '../agents/dashboard.js';
import traceStore from '../agents/trace-store.js';
import { startOrchestratorMode } from '../agents/orchestrator.js';

test('dashboard exposes traces and shows orchestrator trace', async () => {
  traceStore.clear();
  const server = await startDashboardMode({ port: 0 });
  const url = `http://${server.host}:${server.port}`;

  // run orchestrator to push a trace
  const r = await startOrchestratorMode({ flow: 'audit demo', llm: 'none', dryRun: true, extended: true, providerDryRun: true });
  expect(r.ok).toBe(true);

  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`${url}/traces`);
  const arr = await res.json();
  expect(Array.isArray(arr)).toBe(true);
  expect(arr.length).toBeGreaterThanOrEqual(1);
  const t = arr[0];
  expect(t.source).toBe('orchestrator');
  expect(t.trace).toBeDefined();

  // Instead of WebSocket, poll /traces endpoint for new trace
  const r2 = await startOrchestratorMode({ flow: 'audit demo 2', llm: 'none', dryRun: true, extended: true, providerDryRun: true });
  expect(r2.ok).toBe(true);

  // Poll /traces until the new trace appears (max 10 tries)
  let found = false;
  for (let i = 0; i < 10; ++i) {
    const resp = await fetch(`http://localhost:${server.port}/traces?limit=5`);
    const traces = await resp.json();
    if (traces.some(tr => tr.prompt && tr.prompt.includes('audit demo 2'))) {
      found = true;
      break;
    }
    await new Promise(res => setTimeout(res, 200));
  }
  expect(found).toBe(true);
  server.close();
});