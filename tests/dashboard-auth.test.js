import { test, expect } from '@playwright/test';
import { startDashboardMode } from '../agents/dashboard.js';

test('dashboard enforces token auth for HTTP + WebSocket', async () => {
  const token = 's3cr3t';
  const server = await startDashboardMode({ port: 0, token });
  const url = `http://${server.host}:${server.port}`;
  const fetch = (await import('node-fetch')).default;

  // no auth -> 401
  const r1 = await fetch(`${url}/traces`);
  expect(r1.status).toBe(401);

  // with Authorization header -> OK
  const r2 = await fetch(`${url}/traces`, { headers: { Authorization: `Bearer ${token}` } });
  expect(r2.status).toBe(200);

  // WS without token -> socket destroyed / connection refused
  const WebSocket = (await import('ws')).default;
  let wsOk = false;
  try {
    const ws = new WebSocket(`ws://${server.host}:${server.port}/live`);
     await new Promise((res) => { ws.on('open', () => { wsOk = true; res(); }); ws.on('error', () => res()); setTimeout(res, 300); });
  } catch (e) { /* ignore */ }
  expect(wsOk).toBe(false);

  // WS with token query -> accepts
  const ws2 = new WebSocket(`ws://${server.host}:${server.port}/live?token=${token}`);
  await new Promise((res) => { ws2.on('open', () => res()); ws2.on('error', () => res()); setTimeout(res, 500); });
  expect(ws2.readyState).toBe(ws2.OPEN);
  ws2.close();

  server.close();
});