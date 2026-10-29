import test from 'node:test';import assert from 'node:assert/strict';import { scanRequiresValidSignature } from '../lib/scan-signature-policy';import { verifySignedVCard,signVCardId } from '../lib/vcard-signing';
test('QR scans require actual proof linked to public token',()=>{
 const env={NEXTAUTH_SECRET:'test-secret'},sig=signVCardId('token',env);
 assert.equal(scanRequiresValidSignature('QR'),true);
 assert.equal(verifySignedVCard('token',sig,env),true);
 assert.equal(verifySignedVCard('fake',sig,env),false);
});
test('legacy direct/manual traffic remains separately classified',()=>{
 assert.equal(scanRequiresValidSignature('DIRECT'),false);
 assert.equal(scanRequiresValidSignature('MANUAL'),false);
});
