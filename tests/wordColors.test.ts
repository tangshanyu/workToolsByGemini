import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WORD_COLORS, isHexColor, isWordColors } from '../utils/wordColors';
import { readPreference, writePreference } from '../utils/preferences';

test('Word color preferences accept complete hex palettes and reject incomplete or unsafe saved data', () => {
  assert.equal(isWordColors(DEFAULT_WORD_COLORS), true);
  assert.equal(isWordColors({ ...DEFAULT_WORD_COLORS, comment: '#abcdef' }), true);
  assert.equal(isWordColors({ keyword: '#0000FF' }), false);
  assert.equal(isWordColors({ ...DEFAULT_WORD_COLORS, operator: 'red;background:url(x)' }), false);
  assert.equal(isWordColors(null), false);
  assert.equal(isHexColor('#123ABC'), true);
  assert.equal(isHexColor('#123'), false);
});
test('saved Word colors round-trip and corrupted preferences fall back to the reference palette', () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } });
  const colors = { ...DEFAULT_WORD_COLORS, string: '#654321' };
  writePreference('sql-toolkit.word-colors', colors);
  assert.deepEqual(readPreference('sql-toolkit.word-colors', DEFAULT_WORD_COLORS, isWordColors), colors);
  storage.set('sql-toolkit.word-colors', '{broken');
  assert.deepEqual(readPreference('sql-toolkit.word-colors', DEFAULT_WORD_COLORS, isWordColors), DEFAULT_WORD_COLORS);
  storage.set('sql-toolkit.word-colors', JSON.stringify({ ...colors, string: '<script>' }));
  assert.deepEqual(readPreference('sql-toolkit.word-colors', DEFAULT_WORD_COLORS, isWordColors), DEFAULT_WORD_COLORS);
});
