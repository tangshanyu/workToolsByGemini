/**
 * 共用的 PoorSQL 格式化選項
 * 設定與 PoorSQL 網頁版一致
 */
export const SQL_FORMAT_OPTIONS = {
  indent: '    ',
  spacesPerTab: 4,
  maxLineWidth: 999,
  statementBreaks: 2,
  clauseBreaks: 1,
  expandCommaLists: true,
  trailingCommas: false,         // 逗號前置風格
  spaceAfterExpandedComma: false,
  expandBooleanExpressions: true,
  expandCaseStatements: true,
  expandBetweenConditions: true,
  expandInLists: true,           // 展開 IN() 列表
  breakJoinOnSections: false,
  uppercaseKeywords: true,
  keywordStandardization: false,
  coloring: false,               // text 模式不需要
};

/** 取得帶 HTML 著色的選項 */
export const SQL_FORMAT_OPTIONS_HTML = {
  ...SQL_FORMAT_OPTIONS,
  coloring: true,
  includeHtml: true,
};

/**
 * 格式化 SQL（純文字）
 */
export function formatSqlText(sql: string): string {
  if (typeof window.PoorSQL !== 'undefined' && window.PoorSQL.format) {
    return window.PoorSQL.format(sql, SQL_FORMAT_OPTIONS);
  }
  return sql;
}

/**
 * 格式化 SQL（含 HTML 著色）
 */
export function formatSqlHtml(sql: string): string {
  if (typeof window.PoorSQL !== 'undefined' && window.PoorSQL.formatHtml) {
    return window.PoorSQL.formatHtml(sql, SQL_FORMAT_OPTIONS_HTML);
  }
  return '';
}
