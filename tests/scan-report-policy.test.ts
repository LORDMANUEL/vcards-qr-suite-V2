import test from 'node:test';import assert from 'node:assert/strict';import { canReadScanReport } from '../lib/scan-report-policy';
test('admin may analyze any branch',()=>assert.equal(canReadScanReport('IT','sps','tgu'),true));
test('marketing can only read same branch',()=>{assert.equal(canReadScanReport('MARKETING','sps','sps'),true);assert.equal(canReadScanReport('MARKETING','sps','tgu'),false);});
test('unknown branch cannot accidentally grant access to all',()=>{assert.equal(canReadScanReport('SAC',null,null),false);assert.equal(canReadScanReport('SAC','sps',null),false);});
