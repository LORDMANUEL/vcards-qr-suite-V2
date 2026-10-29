import test from 'node:test';
import assert from 'node:assert/strict';
import { foldVcfLine, serializeVcfLines } from '../lib/vcf-format';
test('physical lines do not exceed 75 UTF8 octets',()=>{
 const out=serializeVcfLines(['BEGIN:VCARD','FN:'+ 'José 🌎 '.repeat(40),'END:VCARD']);
 for(const line of out.split('\r\n').filter(Boolean))assert.ok(Buffer.byteLength(line,'utf8')<=75);
 assert.equal(out.endsWith('END:VCARD\r\n'),true);
});
test('long Unicode text survives folding',()=>{
 const source='FN:'+ 'Árbol 🌳 '.repeat(40);
 assert.equal(foldVcfLine(source).split('\r\n ').join(''),source);
});
