import test from 'node:test';
import assert from 'node:assert/strict';
import { validClickEvent } from '../lib/vcard-click-policy';
import { usersDirectoryPolicy } from '../lib/users-directory-policy';
import { secureUserCreation } from '../lib/secure-user-creation';
import { vcfCompanyName } from '../lib/vcf-company';
import { foldVcfLine,serializeVcfLines } from '../lib/vcf-format';
import { redactScanDetails } from '../lib/scan-privacy';
import { themeAssignmentAllowed } from '../lib/branch-theme-ownership';
import { isThemeKind } from '../lib/vcard-theme-type';
import { safeSignatureAudit } from '../lib/security-audit-redaction';

test('public click analytics and scoped directory have strict contracts',()=>{
 assert.equal(validClickEvent({vcardId:'id-123456',actionType:'email'}).ok,true);
 assert.equal(validClickEvent({vcardId:'id-123456',actionType:'email;evil'}).ok,false);
 assert.equal(usersDirectoryPolicy('all','MARKETING','sps').ok,false);
 assert.equal(usersDirectoryPolicy('vcard','MARKETING','sps').ok,true);
});
test('user creation prevents cross-sede promotions',()=>{
 assert.equal(secureUserCreation({name:'Asesor',email:'a@example.com',role:'SUPER_ADMIN',isSystemUser:true,branchId:'tgu'},'MARKETING','sps').ok,false);
});
test('GAC contacts retain company and valid UTF-8 vCard serialization',()=>{
 assert.equal(vcfCompanyName({companyName:'GAC Yude',name:'GAC SPS'}),'GAC Yude');
 const text=serializeVcfLines(['BEGIN:VCARD','ORG:'+'GAC 🚗 '.repeat(25),'END:VCARD']);
 for(const row of text.split('\r\n').filter(Boolean))assert.ok(Buffer.byteLength(row,'utf8')<=75);
 assert.equal(foldVcfLine('ORG:'+'GAC 🚗 '.repeat(25)).split('\r\n ').join(''),'ORG:'+'GAC 🚗 '.repeat(25));
});
test('tenant, visitor privacy and security audits remain separated',()=>{
 assert.equal(themeAssignmentAllowed([{id:'x',companyId:'GAC',category:'PORTAL'}],[{id:'x',category:'VCARD'}],'Ford'),false);
 assert.equal(isThemeKind('PORTAL'),false);
 assert.equal(redactScanDetails({id:'x',ipAddress:'192.0.2.1',userAgent:'phone'},false).ipAddress,null);
 assert.equal('attemptedSignature' in safeSignatureAudit('HMAC_MISMATCH'),false);
});
