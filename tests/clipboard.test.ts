import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><button id="focus">copy</button></body></html>', { url: 'https://example.test/' });
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true }, document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
});
const { copyText, sanitizeSqlHtml, wordHtml } = await import('../utils/clipboard');
const { DEFAULT_WORD_COLORS } = await import('../utils/wordColors');
test('SQL preview removes HTML event handlers and active elements', () => {
  const cleaned = sanitizeSqlHtml('<span class="SQLKeyword" onclick="alert(1)">SELECT</span><img src=x onerror=alert(1)><script>alert(1)</script>');
  assert.equal(cleaned, '<span class="SQLKeyword">SELECT</span>');
});
test('Word HTML has fixed colors and Chinese comment fonts independent of UI theme', () => {
  const html = wordHtml('SELECT -- 中文', '<span class="SQLKeyword">SELECT</span> <span class="SQLComment">-- 中文</span>');
  assert.match(html, /color:#0000FF/); assert.match(html, /color:#008080/);
  assert.match(html, /Courier New/); assert.match(html, /標楷體/); assert.match(html, /white-space:pre/);
  assert.doesNotMatch(html, /class=/);
});
test('Word plain text is escaped without interpreting pasted markup', () => {
  const html = wordHtml('<img src=x> & "value"');
  assert.match(html, /&lt;img/); assert.match(html, /&amp;/); assert.doesNotMatch(html, /<img/);
});
test('Toad Word palette preserves SQL and only highlights actual numeric literals', () => {
  const sql = "SELECT SUM([amount123]) + 1.25e2, 0xFF, .5, @p123, col123, [123], '123' -- 中文 123\nFROM t";
  const highlighted = '<span class="SQLKeyword">SELECT</span> <span class="SQLFunction">SUM</span>([amount123]) <span class="SQLOperator">+</span> 1.25e2, 0xFF, .5, @p123, col123, [123], <span class="SQLString">\'123\'</span> <span class="SQLComment">-- 中文 123</span>\n<span class="SQLKeyword">FROM</span> t';
  const html = wordHtml(sql, highlighted);
  const document = new JSDOM(html).window.document;
  assert.equal(document.body.textContent, sql);
  const spans = [...document.querySelectorAll('span')];
  const span = (value: string) => spans.find(element => element.textContent === value)!;
  assert.equal(span('SUM').style.color, 'rgb(128, 0, 128)');
  assert.equal(span("'123'").style.color, 'rgb(255, 0, 0)');
  assert.equal(span('+').style.color, 'rgb(128, 128, 128)');
  assert.equal(span('-- 中文 123').style.color, 'rgb(0, 128, 128)');
  assert.deepEqual(spans.filter(element => element.style.color === 'rgb(9, 134, 88)').map(element => element.textContent), ['1.25e2', '0xFF', '.5']);
  assert.doesNotMatch(html, /font-weight:bold/);
});
test('reference colors distinguish AND/OR/ON/NULL while preserving compound keywords and literals', () => {
  const sql = "SELECT x FROM t INNER JOIN c ON x = c.x WHERE x IS NULL AND y = 'AND OR NULL' OR z = 1";
  const highlighted = '<span class="SQLKeyword">SELECT</span> x <span class="SQLKeyword">FROM</span> t <span class="SQLKeyword">INNER JOIN</span> c <span class="SQLKeyword">ON</span> x <span class="SQLOperator">=</span> c.x <span class="SQLKeyword">WHERE</span> x <span class="SQLKeyword">IS NULL</span> <span class="SQLKeyword">AND</span> y <span class="SQLOperator">=</span> <span class="SQLString">\'AND OR NULL\'</span> <span class="SQLKeyword">OR</span> z <span class="SQLOperator">=</span> 1';
  const document = new JSDOM(wordHtml(sql, highlighted)).window.document;
  assert.equal(document.body.textContent, sql);
  const spans = [...document.querySelectorAll('span')];
  for (const word of ['ON', 'NULL', 'AND', 'OR']) assert.equal(spans.find(span => span.textContent === word)?.style.color, 'rgb(128, 128, 128)');
  assert.equal(spans.find(span => span.textContent === 'INNER JOIN')?.style.color, 'rgb(0, 0, 255)');
  assert.equal(spans.find(span => span.textContent === 'IS NULL')?.style.color, 'rgb(0, 0, 255)');
  assert.equal(spans.find(span => span.textContent === "'AND OR NULL'")?.style.color, 'rgb(255, 0, 0)');
});
test('custom Word colors affect all categories and invalid CSS colors fall back safely', () => {
  const colors = { ...DEFAULT_WORD_COLORS, keyword: '#123456', condition: '#234567', comment: '#345678', identifier: '#456789' };
  const html = wordHtml('SELECT x AND y -- test', '<span class="SQLKeyword">SELECT</span> x <span class="SQLKeyword">AND</span> y <span class="SQLComment">-- test</span>', colors);
  for (const color of ['#123456', '#234567', '#345678', '#456789']) assert.ok(html.includes(`color:${color}`));
  const invalid = wordHtml('SELECT x', '<span class="SQLKeyword">SELECT</span> x', { ...colors, keyword: 'red;position:fixed' });
  assert.doesNotMatch(invalid, /position:fixed/); assert.match(invalid, /color:#0000FF/);
});
test('Word punctuation follows general text while comparison operators use their own color', () => {
  const colors = { ...DEFAULT_WORD_COLORS, identifier: '#123456', operator: '#654321' };
  const html = wordHtml('(t.x) = 1;', '<span class="SQLOperator">(</span>t<span class="SQLOperator">.</span>x<span class="SQLOperator">)</span> <span class="SQLOperator">=</span> 1<span class="SQLOperator">;</span>', colors);
  const document = new JSDOM(html).window.document;
  const spans = [...document.querySelectorAll('span')];
  for (const mark of ['(', '.', ')', ';']) assert.equal(spans.find(span => span.textContent === mark)?.style.color, 'rgb(18, 52, 86)');
  assert.equal(spans.find(span => span.textContent === '=')?.style.color, 'rgb(101, 67, 33)');
  assert.equal(document.body.textContent, '(t.x) = 1;');
});
test('rich clipboard writes both text/plain and text/html', async () => {
  let payload: any[] = [];
  class TestClipboardItem { constructor(public data: Record<string, Blob>) {} }
  Object.defineProperty(globalThis, 'ClipboardItem', { value: TestClipboardItem, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { write: async (items: any[]) => { payload = items; } }, configurable: true });
  await copyText('SELECT 1', wordHtml('SELECT 1'));
  assert.equal(await payload[0].data['text/plain'].text(), 'SELECT 1');
  assert.match(await payload[0].data['text/html'].text(), /Courier New/);
});
test('copy failure reports an error and does not count execCommand alone as success', async () => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } }, configurable: true });
  Object.defineProperty(document, 'execCommand', { value: () => true, configurable: true });
  await assert.rejects(copyText('SELECT 1'), /無法複製/);
  assert.equal(document.querySelectorAll('textarea').length, 0);
});
