import { test, expect } from '@playwright/test';
import { startAgentMode } from '../agents/tiktok-agent.js';

test('startAgentMode with llm=ollama in dryRun does not call network', async () => {
  const res = await startAgentMode({ agent: 'hello', llm: 'ollama', dryRun: true });
  expect(res).toBeDefined();
  expect(res.messages).toContain('llm-dryRun');
});

test('startAgentMode without llm behaves normally', async () => {
  const res = await startAgentMode({ agent: 'unit-test' });
  expect(res).toBeDefined();
  expect(res.messages[0]).toContain('agent-received');
});