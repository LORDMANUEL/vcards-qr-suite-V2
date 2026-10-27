import assert from 'node:assert/strict';
import test from 'node:test';
import { CARD_WIDTH_MM, CARD_HEIGHT_MM, MIN_QR_WIDTH_MM, qrWidthMm, isStoredQrImage } from '../lib/print-studio';

test('print format is ISO CR80, not editor pixels', () => {
  assert.equal(CARD_WIDTH_MM, 85.6);
  assert.equal(CARD_HEIGHT_MM, 54);
  assert.equal(qrWidthMm(250, 1050) >= MIN_QR_WIDTH_MM, true);
  assert.equal(qrWidthMm(190, 1050) < MIN_QR_WIDTH_MM, true);
});
test('only stored PNG QR data is accepted, never raw UUID or email', () => {
  assert.equal(isStoredQrImage('data:image/png;base64,AAAA'), true);
  assert.equal(isStoredQrImage('a-fake-vcard-uuid'), false);
  assert.equal(isStoredQrImage('someone@example.com'), false);
  assert.equal(isStoredQrImage('https://example.com/qr.png'), false);
});
