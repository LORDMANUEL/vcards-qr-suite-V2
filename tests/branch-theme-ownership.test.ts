import test from 'node:test';import assert from 'node:assert/strict';import { themeAssignmentAllowed } from '../lib/branch-theme-ownership';
const rec={id:'theme',category:'VCARD',companyId:'Ford'};
test('same-company themes allowed',()=>assert.equal(themeAssignmentAllowed([rec],[{id:'theme',category:'VCARD'}],'Ford'),true));
test('reject cross-company, missing IDs and cross-category portal themes',()=>{
 assert.equal(themeAssignmentAllowed([rec],[{id:'theme',category:'VCARD'}],'GAC'),false);
 assert.equal(themeAssignmentAllowed([],[{id:'theme',category:'VCARD'}],'Ford'),false);
 assert.equal(themeAssignmentAllowed([rec],[{id:'theme',category:'PORTAL'}],'Ford'),false);
});
