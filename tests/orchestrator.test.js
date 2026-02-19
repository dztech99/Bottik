import { test, expect } from '@playwright/test';
import { startOrchestratorMode } from '../agents/orchestrator.js';

test('orchestrator runs full pipeline in dryRun (no external calls)', async () => {
  const res = await startOrchestratorMode({ flow: 'audit user', llm: 'none', dryRun: true, extended: true, providerDryRun: true });
  expect(res.ok).toBe(true);
  expect(res.trace).toBeDefined();
  const roles = res.trace.nodes.map(n => n.role);
  expect(roles).toEqual(expect.arrayContaining(['analyzer','web-scraper','validator','simulator','reporter']));
});

test('orchestrator uses fingerprint rotator for simulator when rotateFingerprint=true', async () => {
  const res = await startOrchestratorMode({ flow: 'check fp', llm: 'none', dryRun: true, extended: true, providerDryRun: true, rotateFingerprint: true });
  expect(res.ok).toBe(true);
  const sim = res.trace.nodes.find(n => n.role === 'simulator');
  expect(sim).toBeDefined();
  // simulator result should include dry-run indicator and persona may be present
  expect(sim.result).toBeDefined();
  expect(sim.result.dryRun).toBeDefined();
});