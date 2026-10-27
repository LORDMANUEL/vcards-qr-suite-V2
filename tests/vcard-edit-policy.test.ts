import test from 'node:test';import assert from 'node:assert/strict';import { canEditCard } from '../lib/vcard-edit-policy';
const base={cardActive:true,userActive:true,userCards:1,admin:false,sameBranch:true};
test('branch-scoped editor updates a single active card',()=>assert.equal(canEditCard(base),'ok'));
test('no cross-branch edits even for non-admin authorized user',()=>assert.equal(canEditCard({...base,sameBranch:false}),'denied'));
test('archived card or user cannot be silently reactivated by PUT',()=>{assert.equal(canEditCard({...base,cardActive:false}),'archived');assert.equal(canEditCard({...base,userActive:false}),'archived');});
test('shared user profile cannot be modified through one card',()=>assert.equal(canEditCard({...base,userCards:2,admin:true}),'shared'));
