import test from 'node:test';import assert from 'node:assert/strict';
import { parseScanReportQuery } from '../lib/scan-query';
import { scanReportWhere } from '../lib/scan-report-filters';
import { signVCardId, verifySignedVCard } from '../lib/vcard-signing';
import { scanRequiresValidSignature } from '../lib/scan-signature-policy';
import { themeAssignmentAllowed } from '../lib/branch-theme-ownership';
import { isValidThemeDateRange } from '../lib/vcard-theme-calendar';
import { canReadTheme, canWriteTheme } from '../lib/theme-tenant-access';
import { validateUserPrivilegeChange } from '../lib/user-privilege-policy';
import { canCloneThemeInCompany } from '../lib/theme-clone-access';

test('integrated reports reuse Honduras calendar interval',()=>{
  const query=parseScanReportQuery(new URLSearchParams('from=2026-10-29&to=2026-10-29'));
  assert.equal(query.ok,true);
  if(query.ok) {
    assert.deepEqual(scanReportWhere(query),{from:query.from,to:query.to});
    assert.equal(query.from?.toISOString(),'2026-10-29T06:00:00.000Z');
  }
});
test('integrated signatures identify QR scans and preserve legacy verification',()=>{
  const keys={VCARD_SIGNING_SECRET:'fresh',NEXTAUTH_SECRET:'auth',VCARD_LEGACY_SIGNING_SECRET:'historic'};
  const newSig=signVCardId('token',keys);
  assert.equal(scanRequiresValidSignature('QR'),true);
  assert.equal(verifySignedVCard('token',newSig,keys),true);
  assert.equal(verifySignedVCard('token',signVCardId('token',{NEXTAUTH_SECRET:'historic'}),keys),true);
  assert.equal(verifySignedVCard('wrong',newSig,keys),false);
});
test('integrated theme scopes prevent cross-brand read, clone and branch assignment',()=>{
  const actor={admin:false,companyId:'Ford'};
  assert.equal(canReadTheme(actor,{companyId:'GAC',category:'VCARD'}),false);
  assert.equal(canWriteTheme(actor,{companyId:'GAC',category:'VCARD'}),false);
  assert.equal(canCloneThemeInCompany(false,'Ford','GAC'),false);
  assert.equal(themeAssignmentAllowed([{id:'gac',companyId:'GAC',category:'VCARD'}],[{id:'gac',category:'VCARD'}],'Ford'),false);
});
test('calendar and privileges are jointly constrained before publication',()=>{
  assert.equal(isValidThemeDateRange('2026-02-30',null),false);
  assert.ok(validateUserPrivilegeChange({
    actorId:'it',actorRole:'IT',targetId:'x',currentRole:'ADVISOR',
    currentSystem:false,requestedRole:'SUPER_ADMIN',
  }));
});
