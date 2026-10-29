import test from 'node:test';import assert from 'node:assert/strict';import { signVCardId,verifySignedVCard } from '../lib/vcard-signing';
test('legacy HMAC keeps original signature valid',()=>{
 const old={NEXTAUTH_SECRET:'old-secret'};const code=signVCardId('qr-token',old);
 assert.equal(verifySignedVCard('qr-token',code,old),true);
 assert.equal(verifySignedVCard('another',code,old),false);
});
test('new dedicated key signs future QR while verifying historical tokens',()=>{
 const env={VCARD_SIGNING_SECRET:'new-key',NEXTAUTH_SECRET:'auth-key',VCARD_LEGACY_SIGNING_SECRET:'old-secret'};
 assert.equal(verifySignedVCard('a',signVCardId('a',env),env),true);
 assert.equal(verifySignedVCard('a',signVCardId('a',{NEXTAUTH_SECRET:'old-secret'}),env),true);
});
test('malformed signature fails closed even without keys',()=>{
 assert.equal(verifySignedVCard('a','nothex',{}),false);
 assert.equal(verifySignedVCard('a','a'.repeat(64),{}),false);
 assert.throws(()=>signVCardId('id',{}));
});
