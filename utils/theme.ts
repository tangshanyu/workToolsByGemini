import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';

export const THEME_COLORS = [
  { name: '紫藤', value: '#6750a4' }, { name: '海藍', value: '#386a9e' },
  { name: '薄荷', value: '#006a60' }, { name: '玫瑰', value: '#984061' },
  { name: '橄欖', value: '#626b2f' }, { name: '陶土', value: '#a04c32' },
] as const;
export type ThemeMode = 'light' | 'dark' | 'system';
export interface ThemePreference { mode: ThemeMode; seed: string }
export const DEFAULT_THEME: ThemePreference = { mode: 'light', seed: '#6750a4' };
export function isThemePreference(value: unknown): value is ThemePreference {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ThemePreference>;
  return ['light', 'dark', 'system'].includes(v.mode || '') && /^#[0-9a-f]{6}$/i.test(v.seed || '');
}
export function themeTokens(seed: string, dark: boolean): Record<string, string> {
  const theme = themeFromSourceColor(argbFromHex(seed));
  const scheme = (dark ? theme.schemes.dark : theme.schemes.light).toJSON();
  const tokens = Object.fromEntries(Object.entries(scheme).map(([key, value]) => [key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()), hexFromArgb(value)]));
  const neutral = theme.palettes.neutral;
  tokens.surface = hexFromArgb(neutral.tone(dark ? 6 : 98));
  tokens['surface-container-low'] = hexFromArgb(neutral.tone(dark ? 10 : 96));
  tokens['surface-container'] = hexFromArgb(neutral.tone(dark ? 12 : 94));
  tokens['surface-container-high'] = hexFromArgb(neutral.tone(dark ? 17 : 92));
  tokens['surface-container-highest'] = hexFromArgb(neutral.tone(dark ? 22 : 90));
  return tokens;
}
export function applyThemePreference(preference: ThemePreference): void {
  const dark = preference.mode === 'dark' || (preference.mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(themeTokens(preference.seed, dark))) root.style.setProperty('--md-' + key, value);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', root.style.getPropertyValue('--md-surface'));
}
