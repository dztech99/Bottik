import { test, expect } from '@playwright/test';
import net from 'net';
import { spawnSync } from 'child_process';

test('CLI prints helpful warning when requested dashboard port is already in use', async () => {
  // occupy an ephemeral port
  const srv = net.createServer(() => {});
  await new Promise((res) => srv.listen(0, '127.0.0.1', res));
  const port = srv.address().port;

  const cp = spawnSync('node', ['core/cli.js', '--dashboard', '--port', String(port)], { encoding: 'utf8', timeout: 5000 });
  // CLI should exit non-zero and print friendly message
  expect(cp.status).not.toBe(0);
  const out = (cp.stdout || '') + (cp.stderr || '');
  expect(out).toContain('already in use');
  expect(out).toMatch(/--port 0|Try an ephemeral port/);

  srv.close();
});