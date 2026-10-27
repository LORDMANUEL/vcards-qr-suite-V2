import test from 'node:test';
import assert from 'node:assert/strict';
import { validateScanEvent } from '../lib/scan-event';
test('QR accepted by default, preserving case normalization',()=>{
 assert.deepEqual(validateScanEvent({vcardId:'cl123456789'}),{ok:true,vcardId:'cl123456789',scanMethod:'QR'});
 assert.deepEqual(validateScanEvent({vcardId:'cl123456789',scanMethod:'manual'}),{ok:true,vcardId:'cl123456789',scanMethod:'MANUAL'});
});
test('invalid scanner cannot silently fall back to QR',()=>{
 for(const p of [null,[],{}, {vcardId:'x'}, {vcardId:'cl123456789',scanMethod:'click_thing'}, {vcardId:'cl123456789',scanMethod:12},{vcardId:'cl123456789',scanMethod:'false'}]) assert.equal(validateScanEvent(p).ok,false);
});
