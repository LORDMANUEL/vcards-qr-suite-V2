import test from 'node:test';import assert from 'node:assert/strict';import {safeSignatureAudit} from '../lib/security-audit-redaction';
test('suspicious signatures are never persisted in audit details',()=>{
 const event=safeSignatureAudit('HMAC_MISMATCH');
 assert.equal(event.reason,'signature_invalid');
 assert.ok(!JSON.stringify(event).includes('attemptedSignature'));
});
test('missing signature has minimal event',()=>assert.deepEqual(safeSignatureAudit('SIGNATURE_REQUIRED'),{type:'SIGNATURE_REQUIRED',reason:'missing_signature'}));
