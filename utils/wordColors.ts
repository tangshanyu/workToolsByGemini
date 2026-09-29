export const DEFAULT_WORD_COLORS = {
  keyword: '#0000FF', condition: '#808080', function: '#800080', string: '#FF0000',
  comment: '#008080', number: '#098658', operator: '#808080', identifier: '#000000',
};
export type WordColors = typeof DEFAULT_WORD_COLORS;
export const WORD_COLOR_FIELDS: { key: keyof WordColors; label: string; example: string }[] = [
  { key: 'keyword', label: '關鍵字', example: 'SELECT / FROM / WHERE / IS' },
  { key: 'condition', label: '條件與 NULL', example: 'AND / OR / ON / NULL' },
  { key: 'function', label: '函數', example: 'SUM / COUNT' },
  { key: 'string', label: '字串', example: "'Parm1' / '900'" },
  { key: 'comment', label: '註解', example: '-- 契約主檔' },
  { key: 'number', label: '數字', example: '123 / 1.25' },
  { key: 'operator', label: '運算符', example: '= / >= / + / -' },
  { key: 'identifier', label: '一般文字', example: '資料表 / 欄位 / 標點' },
];
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
}
export function isWordColors(value: unknown): value is WordColors {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const colors = value as Record<string, unknown>;
  return Object.keys(DEFAULT_WORD_COLORS).every(key => isHexColor(colors[key]));
}
