import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMailto, detectVCardBrand, getPositionGroup, isSafePublicUrl } from '../lib/vcard-profile';

test('detects the three supported brands without assigning unknown companies to Ford', () => {
  assert.equal(detectVCardBrand('Ford Yude'), 'ford');
  assert.equal(detectVCardBrand('GAC Yude'), 'gac');
  assert.equal(detectVCardBrand('Quick Lane'), 'quicklane');
  assert.equal(detectVCardBrand('Empresa nueva'), 'generic');
});

test('normalizes accented position names into stable groups', () => {
  assert.equal(getPositionGroup('Técnico de mantenimiento'), 'SERVICE');
  assert.equal(getPositionGroup('Jefe de Repuestos'), 'MANAGEMENT');
  assert.equal(getPositionGroup('Asesor Comercial'), 'SALES');
});

test('builds encoded role and appointment drafts without sending mail', () => {
  const sales = buildMailto('advisor@example.com', 'Ana', 'Ventas');
  const appointment = buildMailto('advisor@example.com', 'Ana', 'Servicio', 'appointment');
  assert.match(sales, /^mailto:advisor@example\.com\?/);
  assert.match(sales, /Consulta%20comercial/);
  assert.match(appointment, /Solicitud%20de%20cita/);
});

test('rejects executable and data URLs', () => {
  assert.equal(isSafePublicUrl('https://example.com'), true);
  assert.equal(isSafePublicUrl('tel:+50422223333'), true);
  assert.equal(isSafePublicUrl('javascript:alert(1)'), false);
  assert.equal(isSafePublicUrl('data:text/html,unsafe'), false);
});
