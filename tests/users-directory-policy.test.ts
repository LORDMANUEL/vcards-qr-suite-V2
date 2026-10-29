import test from 'node:test';import assert from 'node:assert/strict';import {usersDirectoryPolicy} from '../lib/users-directory-policy';
test('marketing cannot enumerate system accounts via default kind=all',()=>{assert.equal(usersDirectoryPolicy('all','MARKETING','sps').ok,false);assert.equal(usersDirectoryPolicy('system','MARKETING','sps').ok,false);});
test('marketing vcard scoped to own branch',()=>assert.deepEqual(usersDirectoryPolicy('vcard','MARKETING','sps'),{ok:true,kind:'vcard',branchId:'sps'}));
test('admin can see all, unknown query rejected',()=>{assert.deepEqual(usersDirectoryPolicy('all','IT',null),{ok:true,kind:'all'});assert.equal(usersDirectoryPolicy('bogus','ADMIN',null).ok,false);});
test('unassigned marketers receive 403',()=>assert.deepEqual(usersDirectoryPolicy('vcard','MARKETING',null).ok,false));
