import { DIAGNOSE_COOLDOWN_MS, MAX_LIBRARY_ENTRIES } from '@/lib/constants';

describe('Constants', () => {
  test('DIAGNOSE_COOLDOWN_MS should be 1500', () => {
    expect(DIAGNOSE_COOLDOWN_MS).toBe(1500);
  });

  test('MAX_LIBRARY_ENTRIES should be 200', () => {
    expect(MAX_LIBRARY_ENTRIES).toBe(200);
  });
});