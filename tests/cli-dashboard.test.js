import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';

test('CLI `--dashboard --port 0` binds to an ephemeral port and prints listening URL', async () => {
  const proc = spawn('node', ['core/cli.js', '--dashboard', '--port', '0'], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let out = '';
  const collect = (d) => { out += String(d); };
  proc.stdout.on('data', collect);
  proc.stderr.on('data', collect);

  // wait for listening message or timeout
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('dashboard-start-timeout')), 5000);
    proc.stdout.on('data', (d) => {
      if (/Dashboard listening at http:\/\//i.test(String(d))) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  // ensure message contains host:port
  expect(/Dashboard listening at http:\/\/[\d\.]+:\d+\//.test(out)).toBe(true);

  // cleanup
  proc.kill();
});