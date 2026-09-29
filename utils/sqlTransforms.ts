export interface SqlToken { kind: 'code' | 'string' | 'identifier' | 'comment'; text: string; start: number; end: number }

// Preserve source positions and skip SQL literals/identifiers/comments when replacing parameters.
export function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let i = 0, codeStart = 0;
  const emit = (kind: SqlToken['kind'], start: number, end: number) => tokens.push({ kind, start, end, text: sql.slice(start, end) });
  while (i < sql.length) {
    const ch = sql[i];
    const lineComment = sql.startsWith('--', i);
    const blockComment = sql.startsWith('/*', i);
    const quote = ch === "'" || ch === '"' || ch === '[' || ch === '`';
    const dollar = ch === '$' ? sql.slice(i).match(/^\$(?:[A-Za-z_][\w]*)?\$/)?.[0] : undefined;
    if (!lineComment && !blockComment && !quote && !dollar) { i++; continue; }
    if (i > codeStart) emit('code', codeStart, i);
    const start = i;
    if (lineComment) {
      while (i < sql.length && sql[i] !== '\n') i++;
      emit('comment', start, i);
    } else if (blockComment) {
      i += 2; let depth = 1;
      while (i < sql.length && depth) {
        if (sql.startsWith('/*', i)) { depth++; i += 2; }
        else if (sql.startsWith('*/', i)) { depth--; i += 2; }
        else i++;
      }
      emit('comment', start, i);
    } else if (dollar) {
      const end = sql.indexOf(dollar, i + dollar.length);
      i = end < 0 ? sql.length : end + dollar.length;
      emit('string', start, i);
    } else {
      const closer = ch === '[' ? ']' : ch;
      i++;
      while (i < sql.length) {
        if (sql[i] === closer) {
          if (sql[i + 1] === closer) { i += 2; continue; }
          i++; break;
        }
        i++;
      }
      emit(ch === "'" ? 'string' : 'identifier', start, i);
    }
    codeStart = i;
  }
  if (codeStart < sql.length) emit('code', codeStart, sql.length);
  return tokens;
}

export function findNamedParams(sql: string): string[] {
  const names = new Set<string>();
  for (const token of tokenizeSql(sql)) {
    if (token.kind !== 'string') continue;
    const match = token.text.match(/^'%?(Parm\d+)%?'$/);
    if (match) names.add(match[1]);
  }
  return [...names].sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
}
export function replaceNamedParams(sql: string, values: Record<string, string>): string {
  return tokenizeSql(sql).map(token => {
    if (token.kind !== 'string') return token.text;
    const match = token.text.match(/^'(%)?(Parm\d+)(%)?'$/);
    if (!match || !Object.hasOwn(values, match[2])) return token.text;
    return "'" + (match[1] || '') + values[match[2]].replace(/'/g, "''") + (match[3] || '') + "'";
  }).join('');
}

export function parseParameterList(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) throw new Error('請使用 [參數1, 參數2] 格式。');
  const body = trimmed.slice(1, -1).trim();
  if (!body) return [];
  const parts: string[] = [];
  let current = '', quote = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) {
      current += c;
      if (c === quote) {
        if (body[i + 1] === quote) { current += body[++i]; }
        else quote = '';
      } else if (c === '\\' && body[i + 1] === quote) current += body[++i];
    } else if ((c === '"' || c === "'") && !current.trim()) { quote = c; current += c; }
    else if (c === ',') { parts.push(current.trim()); current = ''; }
    else current += c;
  }
  if (quote) throw new Error('參數中的引號未閉合。');
  parts.push(current.trim());
  return parts.map(part => {
    if (part.startsWith('"')) {
      try { const value: unknown = JSON.parse(part); if (typeof value === 'string') return value; } catch { /* Explain below. */ }
      throw new Error('雙引號參數請使用 JSON 字串格式，例如 "A,B"。');
    }
    if (part.startsWith("'")) {
      if (!part.endsWith("'")) throw new Error('單引號參數格式不完整。');
      return part.slice(1, -1).replace(/''/g, "'");
    }
    return part;
  });
}
export function replaceQuestionParams(sql: string, parameters: string[], typed = false): string {
  const tokens = tokenizeSql(sql);
  const count = tokens.filter(t => t.kind === 'code').reduce((sum, t) => sum + (t.text.match(/\?/g)?.length || 0), 0);
  if (count !== parameters.length) throw new Error(`SQL 有 ${count} 個參數佔位符，您提供了 ${parameters.length} 個參數。`);
  let index = 0;
  return tokens.map(token => token.kind !== 'code' ? token.text : token.text.replace(/\?/g, () => {
    const value = parameters[index++];
    if (typed && /^null$/i.test(value)) return 'NULL';
    if (typed && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return value;
    return "'" + value.replace(/'/g, "''") + "'";
  })).join('');
}
export function escapeJavaString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\f/g, '\\f').replace(/\u0008/g, '\\b');
}
export function sqlToJava(sql: string): string {
  const lines: string[] = [];
  let buffer = '', expressions: string[] = [];
  const flush = () => { if (buffer) { expressions.push(`"${escapeJavaString(buffer)}"`); buffer = ''; } };
  const finish = () => { buffer += ' '; flush(); lines.push(`sb.append(${expressions.join(' + ')});`); expressions = []; };
  for (const token of tokenizeSql(sql)) {
    if (token.kind === 'string' || token.kind === 'identifier') {
      // A newline inside a quoted value belongs to its value, not its layout.
      // Character expressions preserve it without introducing a \n escape.
      for (const piece of token.text.split(/(\r\n|\r|\n)/)) {
        if (/^[\r\n]+$/.test(piece)) { flush(); for (const character of piece) expressions.push(`(char)${character.charCodeAt(0)}`); }
        else buffer += piece;
      }
      continue;
    }
    // A -- comment would swallow the next clause when lines are joined with spaces.
    const source = token.kind === 'comment' && token.text.startsWith('--')
      ? '/*' + token.text.slice(2).replace(/\/\*|\*\//g, delimiter => delimiter[0] + ' ' + delimiter[1]) + ' */'
      : token.text;
    const pieces = source.split(/\r\n|\r|\n/);
    buffer += pieces[0];
    for (const piece of pieces.slice(1)) { finish(); buffer += piece; }
  }
  if (buffer.trim() || expressions.length) finish();
  return lines.join('\n');
}

function selectRange(sql: string): { start: number; end: number } | null {
  const tokens = tokenizeSql(sql);
  let depth = 0, start = -1, end = sql.length;
  outer: for (const token of tokens) {
    if (token.kind !== 'code') continue;
    const pieces = token.text.matchAll(/\(|\)|\bSELECT\b|\bFROM\b|\bINTO\b/gi);
    for (const piece of pieces) {
      if (piece[0] === '(') depth++;
      else if (piece[0] === ')') depth--;
      else if (depth === 0 && start < 0 && piece[0].toUpperCase() === 'SELECT') start = token.start + piece.index! + 6;
      else if (depth === 0 && start >= 0 && /^(FROM|INTO)$/i.test(piece[0])) { end = token.start + piece.index!; break outer; }
    }
  }
  return start < 0 ? null : { start, end };
}
export function selectFields(sql: string): string[] {
  const range = selectRange(sql);
  if (!range) return [];
  const { start, end } = range;
  const clause = sql.slice(start, end).replace(/^\s*DISTINCT\s+/i, '');
  const fields: string[] = []; let fieldStart = 0, depth = 0;
  for (const token of tokenizeSql(clause)) {
    if (token.kind !== 'code') continue;
    for (let i = 0; i < token.text.length; i++) {
      if (token.text[i] === '(') depth++;
      else if (token.text[i] === ')') depth--;
      else if (token.text[i] === ',' && depth === 0) { fields.push(clause.slice(fieldStart, token.start + i).trim()); fieldStart = token.start + i + 1; }
    }
  }
  fields.push(clause.slice(fieldStart).trim());
  return fields.filter(Boolean);
}
export function addCamelCaseAliases(sql: string): string {
  const fields = selectFields(sql);
  let result = sql, searchStart = selectRange(sql)?.start ?? 0;
  for (const field of fields) {
    // Add aliases only to simple qualified columns, never to expressions.
    const match = field.match(/^([\w]+)\.([A-Za-z_][\w]*)$/);
    if (!match || !match[2].includes('_')) continue;
    const alias = match[2].toLowerCase().replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
    const index = result.indexOf(field, searchStart);
    if (index >= 0) { result = result.slice(0, index) + field + ' AS ' + alias + result.slice(index + field.length); searchStart = index + field.length + alias.length + 4; }
  }
  return result;
}
export function hibernateScalars(sql: string): string {
  const fields = selectFields(sql);
  const names = fields.map(field => {
    const clean = tokenizeSql(field).filter(t => t.kind !== 'comment').map(t => t.text).join('').trim();
    const alias = clean.match(/\s+AS\s+(\w+|\[[^\]]+\]|"[^"]+")\s*$/i);
    if (alias) return alias[1].replace(/^[\["]|[\]"]$/g, '');
    const simple = clean.match(/^(?:\w+\.)?(\w+|\[[^\]]+\]|"[^"]+")$/);
    return simple ? simple[1].replace(/^[\["]|[\]"]$/g, '') : null;
  });
  if (!fields.length || names.some(name => !name)) throw new Error('Hibernate 欄位請使用明確的 AS 別名；不支援 SELECT * 或未命名運算式。');
  return 'List<HibernateScalarHelper> scalarList = new ArrayList<>();\n' + names.map(name => `scalarList.add(new HibernateScalarHelper("${escapeJavaString(name!)}", StandardBasicTypes.STRING));`).join('\n');
}
