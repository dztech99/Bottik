import { test, expect } from '@playwright/test';
import { solveCaptcha } from '../utils/captcha.js';

test('solveCaptcha simulate returns SIMULATED', async () => {
  const txt = await solveCaptcha(null, { simulate: true });
  expect(txt).toBe('SIMULATED');
});
