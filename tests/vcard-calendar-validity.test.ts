import test from 'node:test';import assert from 'node:assert/strict';import { isValidThemeDateRange,isVCardThemeInWindow } from '../lib/vcard-theme-calendar';
test('reject impossible dates regardless of valid-looking ISO prefix',()=>{
 for(const invalid of ['2026-02-30','2026-04-31','2026-13-01','0000-00-00'])assert.equal(isValidThemeDateRange(invalid,null),false,invalid);
});
test('leap day accepted and end date inclusive Honduras',()=>{
 assert.equal(isValidThemeDateRange('2028-02-29','2028-03-01'),true);
 assert.equal(isVCardThemeInWindow({validFrom:'2028-02-29',validTo:'2028-02-29'},new Date('2028-03-01T05:59:59Z')),true);
 assert.equal(isVCardThemeInWindow({validFrom:'2028-02-29',validTo:'2028-02-29'},new Date('2028-03-01T06:00:00Z')),false);
});
