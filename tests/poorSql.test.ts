import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';
import { SQL_FORMAT_OPTIONS } from '../utils/sqlOptions';

// Execute the real public worker and the real vendored formatter, without a DOM.
const messages: any[] = [];
const context = vm.createContext({ URL, performance, console });
context.self = context;
context.location = { href: 'https://example.test/toolkit/poorsql.worker.js' };
context.postMessage = (value: unknown) => messages.push(value);
context.importScripts = (url: string) => {
  assert.equal(url, 'https://example.test/toolkit/poorsql.js');
  vm.runInContext(readFileSync(new URL('../public/poorsql.js', import.meta.url), 'utf8'), context, { timeout: 10000 });
};
vm.runInContext(readFileSync(new URL('../public/poorsql.worker.js', import.meta.url), 'utf8'), context, { timeout: 10000 });
function format(sql: string, options = SQL_FORMAT_OPTIONS) {
  const id = messages.length;
  context.onmessage({ data: { id, sql, options } });
  const response = messages.at(-1);
  assert.equal(response.id, id); assert.equal(response.error, undefined);
  return response.result;
}
test('PoorSQL worker loads without window and follows a subdirectory deployment path', () => {
  assert.equal(messages[0].type, 'ready');
});
test('real PoorSQL produces matching text and syntax-highlighted HTML', () => {
  const result = format("select a,b from t where x='O''Reilly' -- 中文註解\nand id in (1,2)");
  assert.match(result.text, /SELECT/); assert.match(result.text, /\nFROM/);
  assert.match(result.html, /SQLKeyword/); assert.match(result.html, /SQLComment/);
  assert.match(result.html, /O/); assert.equal(result.errorFound, false);
});
test('PoorSQL honors comma placement, indentation and keyword options', () => {
  const before = format('select a,b from t').text;
  const after = format('select a,b from t', { ...SQL_FORMAT_OPTIONS, trailingCommas: true, indent: '  ', uppercaseKeywords: false }).text;
  assert.match(before, /\n\s*,b/); assert.match(after, /a,\n/); assert.match(after, /select/);
});
test('formatter escapes HTML in SQL strings', () => {
  const result = format("SELECT '<img src=x onerror=alert(1)>' AS payload");
  assert.doesNotMatch(result.html, /<img/); assert.match(result.html, /&lt;img/);
});
test('formatting the result again preserves its text', () => {
  const first = format('select a, sum(b) as total from t group by a order by total');
  assert.equal(format(first.text).text, first.text);
});
test('parse error information is returned instead of claiming success', () => {
  assert.equal(format("SELECT 'unclosed").errorFound, true);
});
