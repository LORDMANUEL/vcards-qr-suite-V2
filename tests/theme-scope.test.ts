import assert from 'node:assert/strict';
import test from 'node:test';
import { isSameCompanyScope, isVCardThemeScope, themeSlot } from '../lib/theme-scope';

test('themes must be scoped to company or branch, never implicit global', () => {
  assert.equal(isVCardThemeScope('company'), true);
  assert.equal(isVCardThemeScope('branch'), true);
  assert.equal(isVCardThemeScope('global'), false);
  assert.equal(isVCardThemeScope(null), false);
});
test('seasonal/festive themes use seasonal slot, corporate use default', () => {
  assert.equal(themeSlot('SEASONAL'), 'seasonal');
  assert.equal(themeSlot('FESTIVE'), 'seasonal');
  assert.equal(themeSlot('CORPORATE'), 'corporate');
});
test('theme belongs to at most one company without cloning', () => {
  assert.equal(isSameCompanyScope('a', 'a'), true);
  assert.equal(isSameCompanyScope('a', 'b'), false);
  assert.equal(isSameCompanyScope(null, 'a'), true);
});
