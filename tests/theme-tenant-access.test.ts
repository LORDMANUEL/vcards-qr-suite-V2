import test from 'node:test';import assert from 'node:assert/strict';import { canReadTheme,canWriteTheme } from '../lib/theme-tenant-access';
const ford={admin:false,companyId:'Ford'};
test('scoped designer sees its own themes and active global only',()=>{
 assert.equal(canReadTheme(ford,{companyId:'Ford',category:'VCARD'}),true);
 assert.equal(canReadTheme(ford,{companyId:null,category:'VCARD',isActive:true}),true);
 assert.equal(canReadTheme(ford,{companyId:null,category:'VCARD',isActive:false}),false);
 assert.equal(canReadTheme(ford,{companyId:'GAC',category:'VCARD'}),false);
});
test('scoped designer cannot mutate global or foreign themes',()=>{
 assert.equal(canWriteTheme(ford,{companyId:'GAC',category:'VCARD'}),false);
 assert.equal(canWriteTheme(ford,{companyId:null,category:'VCARD'}),false);
 assert.equal(canWriteTheme(ford,{companyId:'Ford',category:'VCARD'}),true);
});
