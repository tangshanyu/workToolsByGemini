export const SQL_FORMAT_OPTIONS = {
  indent: '    ', spacesPerTab: 4, maxLineWidth: 999,
  statementBreaks: 2, clauseBreaks: 1,
  expandCommaLists: true, trailingCommas: false, spaceAfterExpandedComma: false,
  expandBooleanExpressions: true, expandCaseStatements: true,
  expandBetweenConditions: true, expandInLists: true, breakJoinOnSections: false,
  uppercaseKeywords: true, keywordStandardization: false,
};
export type SqlFormatOptions = typeof SQL_FORMAT_OPTIONS;
export function isSqlFormatOptions(value: unknown): value is SqlFormatOptions {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Object.entries(SQL_FORMAT_OPTIONS).every(([key, initial]) => {
    if (typeof initial === 'boolean') return typeof v[key] === 'boolean';
    if (key === 'indent') return v[key] === '  ' || v[key] === '    ' || v[key] === '\t';
    if (key === 'spacesPerTab') return v[key] === 2 || v[key] === 4;
    if (key === 'maxLineWidth') return [80, 120, 160, 999].includes(v[key] as number);
    return key === 'statementBreaks' ? v[key] === 1 || v[key] === 2 : v[key] === 1;
  });
}
