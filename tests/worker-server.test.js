import { test, expect } from '@playwright/test';
import { startWorkerServer } from '../agents/worker-server.js';

test('worker-server /execute handles analyzer and web-scraper', async () => {
  const srv = await startWorkerServer({ port: 0 });
  const url = `http://${srv.host}:${srv.port}`;

  const fetch = (await import('node-fetch')).default;
  const r1 = await fetch(`${url}/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'analyzer', prompt: 'hello world' }) });
  expect(r1.status).toBe(200);
  const j1 = await r1.json();
  expect(j1.wordCount).toBeGreaterThanOrEqual(1);

  const r2 = await fetch(`${url}/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'web-scraper', opts: { target: 'inline:<html><title>WS</title></html>' } }) });
  const j2 = await r2.json();
  expect(j2.title).toBe('WS');

  srv.close();
});