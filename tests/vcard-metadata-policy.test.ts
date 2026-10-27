import test from 'node:test';import assert from 'node:assert/strict';import { mayReadVCardMetadata } from '../lib/vcard-metadata-policy';
test('anonymous and invalid signatures never disclose personally identifying metadata',()=>assert.equal(mayReadVCardMetadata(false,true,true),false));
test('inactive cards/users must not be exposed in metadata',()=>{assert.equal(mayReadVCardMetadata(true,false,true),false);assert.equal(mayReadVCardMetadata(true,true,false),false);});
test('valid signed live card can display professional metadata',()=>assert.equal(mayReadVCardMetadata(true,true,true),true));
