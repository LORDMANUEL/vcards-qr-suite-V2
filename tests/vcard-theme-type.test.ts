import test from 'node:test';import assert from 'node:assert/strict';import {isThemeKind} from '../lib/vcard-theme-type';
test('accept supported Prisma theme types only',()=>{for(const t of ['CORPORATE','FESTIVE','SEASONAL'])assert.equal(isThemeKind(t),true);});
test('reject unknown payloads before Prisma writes',()=>{for(const t of ['PORTAL',null,{},0,'corporate',''])assert.equal(isThemeKind(t),false);});
