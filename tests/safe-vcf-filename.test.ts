import test from 'node:test';
import assert from 'node:assert/strict';
import { safeVcfFilename } from '../lib/safe-vcf-filename';
test('safe ASCII filenames with accents',()=>assert.equal(safeVcfFilename('José María Rivera'),'Jose-Maria-Rivera.vcf'));
test('CRLF, path and quotes never reach download header',()=>{
 for(const v of ['Test\r\nSet-Cookie: admin=true','../../etc/passwd','name"; attachment', '\u0000']) {
   const out=safeVcfFilename(v);assert.match(out,/^[a-zA-Z0-9_-]+\.vcf$/); assert.ok(out.length<=68);
 }
});
test('empty names get stable safe default',()=>assert.equal(safeVcfFilename(''),'contacto.vcf'));
