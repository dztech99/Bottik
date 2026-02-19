import { test, expect } from '@playwright/test';
import FingerprintRotator from '../utils/fingerprint-rotator.js';
import fs from 'fs';
import path from 'path';

test('FingerprintRotator cycles through personas and persists index', () => {
  const tmpState = path.resolve(process.cwd(), `.bfr_test_${Date.now()}.json`);
  const rot = new FingerprintRotator([{ id: 'a' }, { id: 'b' }, { id: 'c' }], { stateFile: tmpState });
  const p1 = rot.next();
  const p2 = rot.next();
  const p3 = rot.next();
  expect([p1.id, p2.id, p3.id]).toEqual(['a','b','c']);
  // new rotator should pick up saved index
  const rot2 = new FingerprintRotator([{ id: 'a' }, { id: 'b' }, { id: 'c' }], { stateFile: tmpState });
  const p4 = rot2.next();
  expect(p4.id).toBe('a');
  try { fs.unlinkSync(tmpState); } catch (e) {}
});