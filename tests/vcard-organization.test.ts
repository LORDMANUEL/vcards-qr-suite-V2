import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAutoSelection,
  getBranchesForSelection,
  getCitiesForCompany,
  UNASSIGNED_CITY,
} from '../lib/vcard-organization';

const branches = [
  { id: 'sps-2', name: 'Taller', city: 'San Pedro Sula', companyId: 'ford' },
  { id: 'teg-1', name: 'Principal', city: 'Tegucigalpa', companyId: 'ford' },
  { id: 'sps-1', name: 'Principal', city: 'san pedro sula', companyId: 'ford' },
  { id: 'legacy', name: 'Legacy', city: null, companyId: 'ford' },
  { id: 'gac-1', name: 'GAC SPS', city: 'San Pedro Sula', companyId: 'gac' },
];

test('returns unique sorted cities for the selected company', () => {
  assert.deepEqual(getCitiesForCompany(branches, 'ford'), ['San Pedro Sula', 'Tegucigalpa', UNASSIGNED_CITY]);
  assert.deepEqual(getCitiesForCompany(branches, 'gac'), ['San Pedro Sula']);
});

test('filters and sorts branches by company and city', () => {
  assert.deepEqual(
    getBranchesForSelection(branches, 'ford', 'San Pedro Sula').map((branch) => branch.id),
    ['sps-1', 'sps-2'],
  );
  assert.deepEqual(getBranchesForSelection(branches, 'gac', 'San Pedro Sula').map((branch) => branch.id), ['gac-1']);
});

test('supports legacy branches without a city and only autoselects single choices', () => {
  assert.deepEqual(getBranchesForSelection(branches, 'ford', UNASSIGNED_CITY).map((branch) => branch.id), ['legacy']);
  assert.equal(getAutoSelection(['only']), 'only');
  assert.equal(getAutoSelection(['one', 'two']), '');
});
