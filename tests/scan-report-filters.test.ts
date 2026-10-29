import test from 'node:test';import assert from 'node:assert/strict';import { scanReportWhere } from '../lib/scan-report-filters';
test('same inclusive/exclusive date window for all aggregations',()=>{
 const from=new Date('2026-10-28T06:00:00Z'),to=new Date('2026-10-29T06:00:00Z');
 assert.deepEqual(scanReportWhere({from,to}),{from,to});
});
test('reject invalid reversed date window',()=>assert.throws(()=>scanReportWhere({from:new Date('2026-10-30'),to:new Date('2026-10-29')})));
