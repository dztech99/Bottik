import { test, expect } from '@playwright/test';
import { createWorkerClient } from '../agents/worker-client.js';

test('worker-client local fallback executes analyzer', async () => {
  const client = createWorkerClient({});
  const res = await client.execute({ role: 'analyzer', node: { id: 'analyze' }, prompt: 'unit test analyzer', opts: {} });
  expect(res).toBeDefined();
  expect(res.wordCount).toBeGreaterThanOrEqual(1);
});

test('worker-client local fallback executes web-scraper inline html', async () => {
  const client = createWorkerClient({});
  const res = await client.execute({ role: 'web-scraper', node: { id: 'web-scraper' }, prompt: '', opts: { target: 'inline:<html><title>Hi</title><body>Hello</body></html>', selector: 'title' } });
  expect(res).toBeDefined();
  expect(res.title).toBe('Hi');
});