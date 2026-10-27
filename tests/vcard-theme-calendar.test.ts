import assert from 'node:assert/strict';
import test from 'node:test';
import { hondurasDate, isValidThemeDateRange, isVCardThemeInWindow } from '../lib/vcard-theme-calendar';

test('Tegucigalpa day changes at 06:00 UTC, not at midnight UTC', () => {
  assert.equal(hondurasDate(new Date('2026-10-27T05:59:59Z')), '2026-10-26');
  assert.equal(hondurasDate(new Date('2026-10-27T06:00:00Z')), '2026-10-27');
});
test('inclusive from/to calendar dates are stable on both edges', () => {
  const theme = { validFrom: '2026-10-26T00:00:00.000Z', validTo: '2026-10-26T00:00:00.000Z' };
  assert.equal(isVCardThemeInWindow(theme, new Date('2026-10-26T06:00:00Z')), true);
  assert.equal(isVCardThemeInWindow(theme, new Date('2026-10-27T05:59:59Z')), true);
  assert.equal(isVCardThemeInWindow(theme, new Date('2026-10-27T06:00:00Z')), false);
  assert.equal(isVCardThemeInWindow(theme, new Date('2026-10-26T05:59:59Z')), false);
});
test('reversed or malformed dates must be rejected', () => {
  assert.equal(isValidThemeDateRange('2026-10-27', '2026-10-26'), false);
  assert.equal(isValidThemeDateRange('bad', '2026-10-26'), false);
  assert.equal(isValidThemeDateRange(null, null), true);
});
