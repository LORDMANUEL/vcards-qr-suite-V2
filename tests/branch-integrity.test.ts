import assert from 'node:assert/strict';
import test from 'node:test';
import { branchBelongsToCompany, getRequestedCompanyId } from '../lib/branch-integrity';

test('partial theme / branch requests preserve original company linkage', () => {
  assert.equal(getRequestedCompanyId({ vcardThemeId: 'a' }), undefined);
  assert.equal(getRequestedCompanyId({ seasonalVcardThemeId: 'b' }), undefined);
  assert.equal(getRequestedCompanyId({ name: 'SPS', city: 'San Pedro Sula' }), undefined);
});
test('explicit company change must be a real non-empty identifier', () => {
  assert.equal(getRequestedCompanyId({ companyId: ' abc ' }), 'abc');
  assert.throws(() => getRequestedCompanyId({ companyId: null }));
  assert.throws(() => getRequestedCompanyId({ companyId: '' }));
});
test('company of the selected vCard branch must match', () => {
  assert.equal(branchBelongsToCompany({ companyId: 'a' }, 'a'), true);
  assert.equal(branchBelongsToCompany({ companyId: 'a' }, 'b'), false);
  assert.equal(branchBelongsToCompany({ companyId: null }, 'a'), false);
});
