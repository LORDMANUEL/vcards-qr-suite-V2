import assert from 'node:assert/strict';
import test from 'node:test';
import { isPortalWorkspacePath } from '../lib/portal-workspace';

test('portal administration uses its own sidebar', () => {
  for (const route of ['/portal-admin', '/usuarios', '/temas-portal/editor', '/portales/sucursales', '/ubicaciones']) {
    assert.equal(isPortalWorkspacePath(route), true, route);
  }
});
test('the public portal and vCards remain separate', () => {
  assert.equal(isPortalWorkspacePath('/portal'), false);
  assert.equal(isPortalWorkspacePath('/vcards/theme-builder'), false);
  assert.equal(isPortalWorkspacePath('/vcard/abc'), false);
  assert.equal(isPortalWorkspacePath('/dashboard'), false);
});
