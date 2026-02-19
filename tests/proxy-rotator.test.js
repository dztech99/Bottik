import { test, expect } from '@playwright/test';
import ProxyRotator from '../utils/proxy-rotator.js';

test('round-robin rotates proxies and respects failures', () => {
  const r = new ProxyRotator(['a:1','b:2','c:3']);
  const seen = [r.next(), r.next(), r.next()];
  expect(seen).toEqual(['a:1','b:2','c:3']);

  // simulate failure on second proxy
  r.markFailed('b:2');
  const next = r.next();
  expect(next).not.toBe('b:2');
});
