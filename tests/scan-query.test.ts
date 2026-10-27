import assert from 'node:assert/strict';
import test from 'node:test';
import { parseScanReportQuery } from '../lib/scan-query';
test('Honduras day is bounded 06 UTC through next 06 UTC',()=>{
 const r=parseScanReportQuery(new URLSearchParams('from=2026-10-26&to=2026-10-26&page=0&limit=20'));
 assert.equal(r.ok,true);
 if(r.ok){ assert.equal(r.from?.toISOString(),'2026-10-26T06:00:00.000Z'); assert.equal(r.to?.toISOString(),'2026-10-27T06:00:00.000Z');}
});
test('reject invalid and inverted calendar ranges',()=>{for(const q of ['from=2026-02-30','to=2026-13-02','from=2026-10-28&to=2026-10-26','page=-1','page=1e5','limit=0','limit=999'])assert.equal(parseScanReportQuery(new URLSearchParams(q)).ok,false,q);});
test('default pagination safe',()=>assert.deepEqual(parseScanReportQuery(new URLSearchParams('')), {ok:true,page:0,limit:20}));
