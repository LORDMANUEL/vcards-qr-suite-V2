import test from 'node:test';import assert from 'node:assert/strict';import { validateUserPrivilegeChange } from '../lib/user-privilege-policy';
const e={actorId:'admin',actorRole:'ADMIN',targetId:'user',currentRole:'ADVISOR',currentSystem:false};
test('admin cannot grant super admin or edit protected accounts',()=>{
 assert.match(validateUserPrivilegeChange({...e,requestedRole:'SUPER_ADMIN'})||'',/SUPER_ADMIN/);
 assert.match(validateUserPrivilegeChange({...e,currentRole:'IT'})||'',/SUPER_ADMIN/);
});
test('self lockout and invalid role rejected',()=>{
 assert.ok(validateUserPrivilegeChange({...e,actorId:'user',requestedActive:false}));
 assert.ok(validateUserPrivilegeChange({...e,requestedRole:'ROOT'}));
});
test('valid scoped profile update keeps role',()=>assert.equal(validateUserPrivilegeChange(e),null));
test('super admin can manage others, not self-lockout',()=>{
 assert.equal(validateUserPrivilegeChange({...e,actorRole:'SUPER_ADMIN',requestedRole:'ADMIN'}),null);
});
