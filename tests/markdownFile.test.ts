import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownPreview } from '../pages/MarkdownReader';
import { MAX_MARKDOWN_BYTES, readMarkdownFile, validateMarkdownFile } from '../utils/markdownFile';

function markdownFile(name: string, bytes: Uint8Array): File {
  return {
    name,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as File;
}

test('reads UTF-8 Markdown without losing Chinese characters or line breaks', async () => {
  const content = '# 測試\n\n| 欄位 | 值 |\n| --- | --- |\n| 名稱 | 甲 |\n';
  assert.equal(await readMarkdownFile(markdownFile('報告.MD', new TextEncoder().encode(content))), content);
});

test('rejects unsupported extensions, oversized files, and invalid UTF-8', async () => {
  assert.throws(() => validateMarkdownFile({ name: 'note.txt', size: 4 }), /\.md/);
  assert.throws(() => validateMarkdownFile({ name: 'note.md', size: MAX_MARKDOWN_BYTES + 1 }), /10 MB/);
  await assert.rejects(readMarkdownFile(markdownFile('broken.markdown', new Uint8Array([0xff]))), /UTF-8/);
});

test('previews GFM while ignoring HTML and external images', () => {
  const content = '# 標題\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n- [x] 完成\n\n<script>alert(1)</script>\n\n![外部圖](https://example.com/pixel.png)\n\n[危險連結](javascript:alert(1))';
  const html = renderToStaticMarkup(createElement(MarkdownPreview, { content }));
  assert.match(html, /<h1>標題<\/h1>/);
  assert.match(html, /<table>/);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /圖片：外部圖/);
  assert.doesNotMatch(html, /<script|<img|javascript:|example\.com/);
});
