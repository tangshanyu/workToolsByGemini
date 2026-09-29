import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addCamelCaseAliases, findNamedParams, hibernateScalars, parseParameterList, replaceNamedParams, replaceQuestionParams, selectFields, sqlToJava, tokenizeSql } from '../utils/sqlTransforms';

test('question parameters skip literals, identifiers and nested comments', () => {
  const sql = `SELECT '?' AS [a?], "b?", ? -- ?\n/* ? /* ? */ ? */ WHERE x=?`;
  assert.equal(replaceQuestionParams(sql, ['a?', "O'Reilly"]), `SELECT '?' AS [a?], "b?", 'a?' -- ?\n/* ? /* ? */ ? */ WHERE x='O''Reilly'`);
});
test('question replacement preserves dollar patterns, commas and inserted question marks', () => {
  assert.deepEqual(parseParameterList('[a?, "O\'Reilly, Inc.", $&, 00123]'), ['a?', "O'Reilly, Inc.", '$&', '00123']);
  assert.equal(replaceQuestionParams('SELECT ?, ?, ?', ['a?', '$&', '$1']), "SELECT 'a?', '$&', '$1'");
});
test('legacy unquoted values, SQL-quoted values, JSON escapes and empty list', () => {
  assert.deepEqual(parseParameterList("[O'Reilly, 'it''s fine', \"a\\\"b\", 02, 2024/06/04]"), ["O'Reilly", "it's fine", 'a"b', '02', '2024/06/04']);
  assert.deepEqual(parseParameterList('[]'), []);
  assert.throws(() => parseParameterList('["unclosed]'), /引號未閉合/);
  assert.throws(() => replaceQuestionParams('SELECT ?, ?', ['one']), /2 個/);
});
test('typed option does not lose leading zeros or large integer precision', () => {
  assert.equal(replaceQuestionParams('SELECT ?, ?, ?, ?', ['00123', '9007199254740993', 'null', '-12.5'], true), "SELECT '00123', 9007199254740993, NULL, -12.5");
  assert.equal(replaceQuestionParams('SELECT ?', ['null']), "SELECT 'null'");
});
test('named replacement ignores comments, preserves wildcards and supports empty values', () => {
  const sql = "SELECT 'Parm1', '%Parm2%', 'Parm3', 'Parm10' -- 'Parm99'\n/* 'Parm88' */";
  assert.deepEqual(findNamedParams(sql), ['Parm1', 'Parm2', 'Parm3', 'Parm10']);
  assert.equal(replaceNamedParams(sql, { Parm1: '$&', Parm2: "O'Reilly", Parm3: '', Parm10: "'Parm1'" }), "SELECT '$&', '%O''Reilly%', '', '''Parm1''' -- 'Parm99'\n/* 'Parm88' */");
});
test('Java strings round-trip SQL quotes, backslashes, tabs and line comments', () => {
  const sql = 'SELECT "NAME", \'C:\\tools\' -- keep this comment\n\tFROM T';
  const java = sqlToJava(sql);
  const reconstructed = java.split('\n').map(line => JSON.parse(line.slice('sb.append('.length, -2))).join('');
  assert.equal(reconstructed, sql + '\n');
  assert.match(java, /\\"NAME\\"/);
  assert.match(java, /C:\\\\tools/);
});
test('SELECT field extraction skips CTEs, subqueries, quoted commas and function arguments', () => {
  const sql = "WITH x AS (SELECT a,b FROM t) SELECT x.USER_ID, COALESCE(x.A, x.B) AS amount, 'a,b' AS literal, (SELECT max(z) FROM q) AS value FROM x";
  assert.deepEqual(selectFields(sql), ['x.USER_ID', 'COALESCE(x.A, x.B) AS amount', "'a,b' AS literal", '(SELECT max(z) FROM q) AS value']);
  assert.match(hibernateScalars(sql), /"amount"/);
  assert.equal(hibernateScalars(sql).split('\n').length, 5);
});
test('Camel aliases only change simple column references', () => {
  assert.equal(addCamelCaseAliases('SELECT c.USER_ID, COALESCE(c.A, c.B) AS value FROM c'), 'SELECT c.USER_ID AS userId, COALESCE(c.A, c.B) AS value FROM c');
  assert.throws(() => hibernateScalars('SELECT * FROM t'), /AS 別名/);
  assert.equal(addCamelCaseAliases('WITH x AS (SELECT c.USER_ID FROM c) SELECT c.USER_ID FROM c'), 'WITH x AS (SELECT c.USER_ID FROM c) SELECT c.USER_ID AS userId FROM c');
});
test('Tokenizer reassembles the exact source and treats dollar literals as literals', () => {
  const sql = "SELECT $$?$$, $tag$?$tag$, 'it''s?', [weird]]?], ?";
  assert.equal(tokenizeSql(sql).map(token => token.text).join(''), sql);
  assert.equal(replaceQuestionParams(sql, ['ok']), "SELECT $$?$$, $tag$?$tag$, 'it''s?', [weird]]?], 'ok'");
});
