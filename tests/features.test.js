import { test, expect } from '@playwright/test';
import { loadProxiesFromFile } from '../utils/proxy.js';
import { contextOptionsFromPersona } from '../browser/stealth.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

test('proxy loader parses proxy file', () => {
  const tmp = path.join(os.tmpdir(), `proxies-${Date.now()}.txt`);
  fs.writeFileSync(tmp, '1.2.3.4:8080\nuser:pass@host:3128\n\n', 'utf8');
  const proxies = loadProxiesFromFile(tmp);
  expect(proxies.length).toBeGreaterThanOrEqual(2);
  fs.unlinkSync(tmp);
});

test('contextOptionsFromPersona returns userAgent from persona', () => {
  const persona = { userAgent: 'FAKE-UA', viewport: { width: 100, height: 200 }, locale: 'en-GB', timezone: 'Europe/London' };
  const opts = contextOptionsFromPersona(persona);
  expect(opts.userAgent).toBe('FAKE-UA');
  expect(opts.viewport.width).toBe(100);
});