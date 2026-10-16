import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RETIRED_CAPTIVE_API_PREFIXES,
  RETIRED_CAPTIVE_UI_PATHS,
  matchesPathPrefix,
} from '../lib/runtime-mode';

test('retires captive portal UI without matching the portal node administration page', () => {
  assert.equal(matchesPathPrefix('/portal', RETIRED_CAPTIVE_UI_PATHS), true);
  assert.equal(matchesPathPrefix('/temas-portal/editor/abc', RETIRED_CAPTIVE_UI_PATHS), true);
  assert.equal(matchesPathPrefix('/portales', RETIRED_CAPTIVE_UI_PATHS), false);
  assert.equal(matchesPathPrefix('/vcards', RETIRED_CAPTIVE_UI_PATHS), false);
});

test('retires captive portal APIs without affecting vcard APIs', () => {
  assert.equal(matchesPathPrefix('/api/portal/register', RETIRED_CAPTIVE_API_PREFIXES), true);
  assert.equal(matchesPathPrefix('/api/access-points/node-1', RETIRED_CAPTIVE_API_PREFIXES), true);
  assert.equal(matchesPathPrefix('/api/vcards', RETIRED_CAPTIVE_API_PREFIXES), false);
});
