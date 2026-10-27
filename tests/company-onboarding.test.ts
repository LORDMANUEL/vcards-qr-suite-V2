import assert from 'node:assert/strict';
import test from 'node:test';
import { explicitCompanyBranches } from '../lib/company-onboarding';

test('create company without branches never creates company-as-branch', () => {
  assert.deepEqual(explicitCompanyBranches(undefined, 'Ford Yude'), []);
  assert.deepEqual(explicitCompanyBranches([], 'Ford Yude'), []);
});
test('create only branches explicitly supplied with city', () => {
  const result = explicitCompanyBranches([{ city: 'San Pedro Sula' }, { city: 'Tegucigalpa', name: 'Ford TGU' }], 'Ford Yude');
  assert.equal(result.length, 2);
  assert.equal(result[0].name, 'Ford Yude - San Pedro Sula');
  assert.equal(result[1].name, 'Ford TGU');
  assert.equal(result[1].city, 'Tegucigalpa');
});
test('duplicate city identifiers in one company are not silently inserted', () => {
  assert.throws(() => explicitCompanyBranches([{ city: 'La Ceiba' }, { city: 'La Ceiba' }], 'Quick Lane'));
  assert.deepEqual(explicitCompanyBranches([{ city: '' }], 'GAC'), []);
});
