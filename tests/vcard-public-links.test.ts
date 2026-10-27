import assert from 'node:assert/strict';
import test from 'node:test';
import { publicVCardApiPath, resolvePublicVCardBaseUrl } from '../lib/vcard-public-links';

test('canonical URL comes from explicit configuration, never browser-controlled Host headers', () => {
  assert.equal(resolvePublicVCardBaseUrl({
    NEXTAUTH_URL: 'https://old.example.com/',
    NEXT_PUBLIC_VCARD_BASE_URL: 'https://vcard.grupoyc.com/',
  }), 'https://vcard.grupoyc.com');
});
test('NEXTAUTH_URL fallback can keep existing port for private deployments', () => {
  assert.equal(resolvePublicVCardBaseUrl({ NEXTAUTH_URL: 'http://127.0.0.1:9306' }), 'http://127.0.0.1:9306');
});
test('reject missing, unsafe, credentialed, and path-contaminated base URLs', () => {
  assert.throws(() => resolvePublicVCardBaseUrl({}));
  assert.throws(() => resolvePublicVCardBaseUrl({ NEXTAUTH_URL: 'javascript:alert(1)' }));
  assert.throws(() => resolvePublicVCardBaseUrl({ NEXTAUTH_URL: 'https://admin:secret@example.com/' }));
  assert.throws(() => resolvePublicVCardBaseUrl({ NEXTAUTH_URL: 'https://example.com/steal' }));
  assert.throws(() => resolvePublicVCardBaseUrl({ NEXTAUTH_URL: 'https://example.com/?redirect=x' }));
});
test('signed QR context is carried to API read and .vcf download', () => {
  assert.equal(publicVCardApiPath('qr-123','profile','?sig=a1b2c3'), '/api/vcard/qr-123?sig=a1b2c3');
  assert.equal(publicVCardApiPath('qr-123','download','?sig=a1b2c3'), '/api/vcard/qr-123/download?sig=a1b2c3');
  assert.equal(publicVCardApiPath('qr-123','download','?foo=bar'), '/api/vcard/qr-123/download');
  assert.equal(publicVCardApiPath('qr-123','profile','?sig=a+b'), '/api/vcard/qr-123?sig=a%20b');
});
