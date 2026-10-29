import test from 'node:test';import assert from 'node:assert/strict';import {redactScanDetails} from '../lib/scan-privacy';
const scan={id:'a',ipAddress:'192.0.2.5',userAgent:'private-device',deviceType:'mobile'};
test('scoped managers see device and totals but not client network identifiers',()=>{
 assert.deepEqual(redactScanDetails(scan,false),{...scan,ipAddress:null,userAgent:null});
});
test('admin investigations retain fields',()=>assert.deepEqual(redactScanDetails(scan,true),scan));
