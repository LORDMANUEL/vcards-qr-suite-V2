import assert from 'node:assert/strict';
import test from 'node:test';
import { canDeleteTheme } from '../lib/vcard-theme-deletion';

const empty = { companies: 0, branches: 0, positionRules: 0, accessPoints: 0 };
test('unused design with no references can be deleted', () => assert.equal(canDeleteTheme(empty), true));
test('company publication must block deletion', () => assert.equal(canDeleteTheme({ ...empty, companies: 1 }), false));
test('legacy branch and future company references must block deletion', () => assert.equal(canDeleteTheme({ ...empty, branches: 1 }), false));
test('even disabled position rules protect data references', () => assert.equal(canDeleteTheme({ ...empty, positionRules: 1 }), false));
test('portal access point theme references prevent breaking captive portal', () => assert.equal(canDeleteTheme({ ...empty, accessPoints: 1 }), false));
test('malformed negative/NaN counts never authorize deletion', () => {
  assert.equal(canDeleteTheme({ ...empty, companies: -1 }), false);
  assert.equal(canDeleteTheme({ ...empty, branches: Number.NaN }), false);
});
