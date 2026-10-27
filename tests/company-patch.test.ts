import assert from 'node:assert/strict';import test from 'node:test';import { companyPatch } from '../lib/company-patch';
test('never invent branches or delete missing theme pointers',()=>assert.deepEqual(companyPatch({name:'GAC Yude',branches:[{city:'SPS'}],defaultVcardThemeId:null}),{name:'GAC Yude'}));
test('validates color/name while preserving omission semantics',()=>{
 assert.equal(companyPatch({primaryColor:'red'}),null);
 assert.deepEqual(companyPatch({primaryColor:'#003478'}),{primaryColor:'#003478'});
 assert.equal(companyPatch({}),null);
 assert.deepEqual(companyPatch({logoUrl:null}),{logoUrl:null});
});
