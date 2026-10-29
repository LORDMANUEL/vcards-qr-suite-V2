import test from 'node:test';import assert from 'node:assert/strict';import {vcfCompanyName} from '../lib/vcf-company';
test('VCF exports organization by corporate brand',()=>assert.equal(vcfCompanyName({companyName:'GAC Yude',name:'GAC SPS'}),'GAC Yude'));
test('orphan legacy branches and no branch fall back safely',()=>{assert.equal(vcfCompanyName({name:'Quick Lane SPS'}),'Quick Lane SPS');assert.equal(vcfCompanyName(null),'Contacto digital');});
