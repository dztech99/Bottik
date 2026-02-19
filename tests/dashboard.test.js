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

  server.close();
});