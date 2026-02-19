import { test, expect } from '@playwright/test';
import { startDashboardMode } from '../agents/dashboard.js';

test('POST /run executes orchestrator flow and returns result', async () => {
  const server = await startDashboardMode({ port: 0 });
  const url = `http://${server.host}:${server.port}`;
  const fetch = (await import('node-fetch')).default;

  const body = { flow: 'run endpoint test', dryRun: true, extended: true, providerDryRun: true };
  const res = await fetch(`${url}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  expect(res.status).toBe(200);
  const j = await res.json();
  expect(j.ok).toBe(true);
  expect(j.result).toBeDefined();

  server.close();
});

test('Dashboard UI run button posts to /run (smoke)', async ({ page }) => {
  const server = await startDashboardMode({ port: 0 });
  await page.goto(`http://${server.host}:${server.port}`);
  await page.fill('#runFlowInput', 'ui run test');
  await page.click('#runFlowBtn');
  // status should update to started or clear shortly
  await page.waitForTimeout(800);
  server.close();
});