import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><button id="focus">copy</button></body></html>', { url: 'https://example.test/' });
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true }, document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
});
const { copyText, sanitizeSqlHtml, wordHtml } = await import('../utils/clipboard');
test('SQL preview removes HTML event handlers and active elements', () => {
  const cleaned = sanitizeSqlHtml('<span class="SQLKeyword" onclick="alert(1)">SELECT</span><img src=x onerror=alert(1)><script>alert(1)</script>');
  assert.equal(cleaned, '<span class="SQLKeyword">SELECT</span>');
});
test('Word HTML has fixed colors and Chinese comment fonts independent of UI theme', () => {
  const html = wordHtml('SELECT -- 中文', '<span class="SQLKeyword">SELECT</span> <span class="SQLComment">-- 中文</span>');
  assert.match(html, /color:#0000FF/); assert.match(html, /color:#008000/);
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
  assert.equal(span("'123'").style.color, 'rgb(163, 21, 21)');
  assert.equal(span('+').style.color, 'rgb(0, 0, 0)');
  assert.equal(span('-- 中文 123').style.color, 'rgb(0, 128, 0)');
  assert.deepEqual(spans.filter(element => element.style.color === 'rgb(9, 134, 88)').map(element => element.textContent), ['1.25e2', '0xFF', '.5']);
  assert.doesNotMatch(html, /font-weight:bold/);
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
