import test from 'node:test';import assert from 'node:assert/strict';import { scopedDirectoryBranchId,isScopedDirectoryAllowed } from '../lib/directory-scope';
test('admin has access to global company directory',()=>{assert.equal(scopedDirectoryBranchId('IT','sps'),undefined);assert.equal(isScopedDirectoryAllowed(undefined),true);});
test('marketing sees only assigned branch even if user knows other IDs',()=>assert.equal(scopedDirectoryBranchId('MARKETING','sps'),'sps'));
test('unassigned and unknown role cannot browse global company catalog',()=>assert.equal(isScopedDirectoryAllowed(scopedDirectoryBranchId('MARKETING',null)),false));
