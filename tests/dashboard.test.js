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

  // test websocket live update
  const WebSocket = (await import('ws')).default;
  const ws = new WebSocket(`ws://${server.host}:${server.port}/live`);
  let msgReceived = false;
  ws.on('message', (d) => { try { const p = JSON.parse(String(d)); if (p && p.ts) msgReceived = true; } catch(e){} });

  // wait for websocket to open before triggering broadcast to avoid race
  await new Promise((res) => { ws.on('open', res); ws.on('error', res); setTimeout(res, 500); });

  // push another orchestrator run (should broadcast)
  const r2 = await startOrchestratorMode({ flow: 'audit demo 2', llm: 'none', dryRun: true, extended: true, providerDryRun: true });
  expect(r2.ok).toBe(true);

  // wait briefly for ws message
  await new Promise(res => setTimeout(res, 500));
  ws.close();
  expect(msgReceived).toBe(true);

  server.close();
});