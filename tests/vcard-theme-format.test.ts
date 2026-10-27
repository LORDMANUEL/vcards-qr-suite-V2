import assert from 'node:assert/strict';
import test from 'node:test';
import { themeRuntimeLayout, themeStudioDocument, persistVCardTheme } from '../lib/vcard-theme-format';

const legacy = [{ type: 'Header', id: 'header', props: { bgColor: '#003478' } }];
const doc = {
  name: 'Diseño original', canvas: { width: 375, height: 812, snap: true, showGrid: false },
  media: [], savedWidgets: [],
  elements: [{ id: 'header', kind: 'header', x: 12, y: 33, rotation: 0, locked: true }],
};

test('read legacy array for public V1/V2, preserve existing themes', () => {
  assert.deepEqual(themeRuntimeLayout(legacy), legacy);
  assert.equal(themeStudioDocument(legacy), null);
});
test('save/load editor draft without losing original coordinates, layers or canvas', () => {
  const saved = persistVCardTheme(legacy, doc);
  assert.deepEqual(themeRuntimeLayout(saved), legacy);
  assert.deepEqual(themeStudioDocument(saved), doc);
  assert.equal(themeStudioDocument(saved)?.elements[0]?.x, 12);
});
test('reject malformed config, keep API backward compatible', () => {
  assert.deepEqual(persistVCardTheme(legacy), legacy);
  assert.throws(() => persistVCardTheme({ invalid: true }, doc));
  assert.throws(() => persistVCardTheme(legacy, { canvas: {} }));
  assert.deepEqual(themeRuntimeLayout({ studioDoc: doc }), []);
});
