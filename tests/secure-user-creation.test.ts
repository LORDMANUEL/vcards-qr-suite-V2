import test from 'node:test';import assert from 'node:assert/strict';import {secureUserCreation} from '../lib/secure-user-creation';
const b={email:'Test@Example.com',name:'Asesor',role:'ADVISOR',isSystemUser:false,branchId:'sps'};
test('marketing can only create scoped advisors',()=>{assert.equal(secureUserCreation(b,'MARKETING','sps').ok,true);assert.equal(secureUserCreation({...b,branchId:'tgu'},'MARKETING','sps').ok,false);});
test('admin cannot create super admin',()=>{assert.equal(secureUserCreation({...b,role:'SUPER_ADMIN'},'ADMIN','sps').ok,false);assert.equal(secureUserCreation({...b,role:'SUPER_ADMIN',isSystemUser:true},'SUPER_ADMIN','sps').ok,true);});
test('invalid role and email rejected',()=>{assert.equal(secureUserCreation({...b,email:'no-at'},'SUPER_ADMIN').ok,false);assert.equal(secureUserCreation({...b,role:'ROOT'},'SUPER_ADMIN').ok,false);});
