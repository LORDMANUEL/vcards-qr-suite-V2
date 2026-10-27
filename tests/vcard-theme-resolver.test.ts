import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveVCardTheme } from '../lib/vcard-theme-resolver';

const now = new Date('2026-10-26T20:00:00.000Z');
const active = (id: string, extras: Record<string, unknown> = {}) => ({ id, isActive: true, ...extras });
test('company fallback wins over disabled, expired or future branch theme', () => {
  const chosen = resolveVCardTheme({
    branchCorporate: active('expired', { validTo: '2026-10-25' }),
    companyCorporate: active('company'),
    global: active('global'),
  }, now);
  assert.equal(chosen?.id, 'company');
});
test('disabled role is ignored and correctly scheduled branch seasonal wins', () => {
  const chosen = resolveVCardTheme({
    role: { id: 'role-disabled', isActive: false },
    branchSeasonal: active('seasonal', { validFrom: '2026-10-26', validTo: '2026-10-26' }),
    branchCorporate: active('branch'),
  }, now);
  assert.equal(chosen?.id, 'seasonal');
});
test('role has precedence when active and inside date range', () => {
  const chosen = resolveVCardTheme({
    role: active('role', { validFrom: '2026-10-26' }),
    branchSeasonal: active('seasonal'),
  }, now);
  assert.equal(chosen?.id, 'role');
});
test('inactive branch does not suppress a valid global theme or valid legacy fallback', () => {
  assert.equal(resolveVCardTheme({ branchCorporate: { id: 'draft', isActive: false }, global: active('global') }, now)?.id, 'global');
  assert.equal(resolveVCardTheme({ global: { id: 'disabled', isActive: false }, legacy: active('legacy') }, now)?.id, 'legacy');
});
test('no active candidate means no published theme, even with old layout config', () => {
  assert.equal(resolveVCardTheme({ branchCorporate: { id: 'draft', isActive: false } }, now), null);
  assert.equal(resolveVCardTheme({}, now), null);
});
test('expired corporate rule is evaluated like scheduled seasonal themes', () => {
  const chosen = resolveVCardTheme({
    role: active('expired-role', { validTo: '2026-10-25' }),
    branchCorporate: active('active-corporate', { validTo: '2026-10-28' }),
  }, now);
  assert.equal(chosen?.id, 'active-corporate');
});
