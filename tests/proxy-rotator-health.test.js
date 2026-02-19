import { test, expect } from '@playwright/test';
import ProxyRotator from '../utils/proxy-rotator.js';
import http from 'http';

test('proxy rotator healthCheck returns true for open port and false for closed', async () => {
  // start temporary server
  const srv = http.createServer((req, res) => res.end('ok'));
  await new Promise((res) => srv.listen(0, '127.0.0.1', res));
  const addr = srv.address();
  const port = addr.port;
  const rot = new ProxyRotator([`127.0.0.1:${port}`, '127.0.0.1:59999']);

  const ok = await rot.healthCheck(`127.0.0.1:${port}`, 1000);
  const bad = await rot.healthCheck('127.0.0.1:59999', 200);
  expect(ok).toBe(true);
  expect(bad).toBe(false);

  const all = await rot.checkAll(200);
  expect(all[`127.0.0.1:${port}`]).toBe(true);
  expect(all['127.0.0.1:59999']).toBe(false);

  srv.close();
});