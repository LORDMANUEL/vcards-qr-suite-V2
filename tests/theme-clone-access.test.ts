import test from 'node:test';import assert from 'node:assert/strict';import { canCloneThemeInCompany } from '../lib/theme-clone-access';
test('scoped marketer can clone company and global templates, never foreign',()=>{
 assert.equal(canCloneThemeInCompany(false,'Ford','Ford'),true);
 assert.equal(canCloneThemeInCompany(false,'Ford',null),true);
 assert.equal(canCloneThemeInCompany(false,'Ford','GAC'),false);
});
test('unassigned cannot clone and admin has explicit right',()=>{assert.equal(canCloneThemeInCompany(false,null,null),false);assert.equal(canCloneThemeInCompany(true,null,'GAC'),true);});
