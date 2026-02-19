import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

test('CLI normalization and dryRun writes activity.log', async () => {
  const tmpProxy = path.join(os.tmpdir(), `proxies-${Date.now()}.txt`);
  fs.writeFileSync(tmpProxy, '127.0.0.1:8080\n', 'utf8');

  const logPath = path.resolve(process.cwd(), 'activity.log');
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

  const cmd = `node core/cli.js --persona mobile_safari_iphone --proxy-file ${tmpProxy} --dryRun --stealth none --stealth-disable canvas,toString`;
  const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe', timeout: 20000 });
  // ensure process exited and activity.log was written
  expect(fs.existsSync(logPath)).toBe(true);
  const content = fs.readFileSync(logPath, 'utf8');
  expect(content).toContain('persona=mobile_safari_iphone');
  expect(content).toContain('stealth=none');
  expect(content).toContain('stealthDisable=canvas;toString');
  fs.unlinkSync(tmpProxy);
});