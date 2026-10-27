import test from 'node:test';import assert from 'node:assert/strict';import { isUnusedCompanyTheme } from '../lib/company-theme-policy';
const t={id:'x',category:'VCARD',companyId:null};
test('only unused VCARD theme can be used for new company',()=>assert.equal(isUnusedCompanyTheme([t],['x'],0,0),true));
test('reject themes owned by or assigned to another company',()=>{
 assert.equal(isUnusedCompanyTheme([{...t,companyId:'FORD'}],['x'],0,0),false);
 assert.equal(isUnusedCompanyTheme([t],['x'],1,0),false);
 assert.equal(isUnusedCompanyTheme([t],['x'],0,1),false);
 assert.equal(isUnusedCompanyTheme([{...t,category:'PORTAL'}],['x'],0,0),false);
 assert.equal(isUnusedCompanyTheme([],['x'],0,0),false);
});
