import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEME_COLORS, isThemePreference, themeTokens } from '../utils/theme';
import { isSqlFormatOptions, SQL_FORMAT_OPTIONS } from '../utils/sqlOptions';
function luminance(hex: string) {
  const rgb = hex.match(/[0-9a-f]{2}/gi)!.map(value => parseInt(value, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
test('theme preference and format settings reject invalid saved values', () => {
  assert.equal(isThemePreference({ mode: 'system', seed: '#123abc' }), true);
  assert.equal(isThemePreference({ mode: 'unknown', seed: '#123abc' }), false);
  assert.equal(isThemePreference({ mode: 'light', seed: 'broken' }), false);
  assert.equal(isSqlFormatOptions(SQL_FORMAT_OPTIONS), true);
  assert.equal(isSqlFormatOptions({ ...SQL_FORMAT_OPTIONS, indent: '<script>' }), false);
  assert.equal(isSqlFormatOptions({ ...SQL_FORMAT_OPTIONS, maxLineWidth: -1 }), false);
});
test('all presets and extreme custom seeds have readable primary and surface text', () => {
  for (const seed of [...THEME_COLORS.map(color => color.value), '#ffffff', '#000000', '#ff0000']) {
    for (const dark of [true, false]) {
      const tokens = themeTokens(seed, dark);
      for (const [bg, fg] of [['primary', 'on-primary'], ['primary-container', 'on-primary-container'], ['surface', 'on-surface'], ['surface-container-low', 'on-surface-variant']]) {
        assert.ok(contrast(tokens[bg], tokens[fg]) >= 4.5, `${seed}, dark=${dark}, ${bg}`);
      }
    }
  }
});
