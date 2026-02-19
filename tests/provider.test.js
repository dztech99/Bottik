import { test, expect } from '@playwright/test';
import { startIndirectMode, runProviderTask } from '../providers/indirect.js';
import fs from 'fs';
import path from 'path';

test('startIndirectMode dryRun returns ok and includes persona', async () => {
  const personaId = 'mobile_safari_iphone';
  const res = await startIndirectMode({ task: 'Up Views', video: 'https://example.com', dryRun: true, persona: personaId });
  expect(res).toBeDefined();
  expect(res.ok).toBe(true);
  expect(res.mode).toBe('indirect');
  expect(res.persona).toBe(personaId);
});

test('runProviderTask writes activity.log on dryRun', async () => {
  const logPath = path.resolve(process.cwd(), 'activity.log');
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  const res = await runProviderTask({ task: 'test', url: 'https://example.com', args: { dryRun: true } });
  expect(res.ok).toBe(true);
  expect(fs.existsSync(logPath)).toBe(true);
  const content = fs.readFileSync(logPath, 'utf8');
  expect(content).toContain('task=test');
});