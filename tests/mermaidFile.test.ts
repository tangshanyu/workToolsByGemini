import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_MERMAID_BYTES, normalizeMermaidSource, readMermaidFile, validateMermaidFile } from '../utils/mermaidFile';

test('reads UTF-8 Mermaid files and accepts the supported extensions', async () => {
  for (const name of ['chart.mmd', 'chart.mermaid', 'chart.txt']) {
    const file = new File(['flowchart LR\nA[開始] --> B[完成]'], name);
    assert.equal(await readMermaidFile(file), 'flowchart LR\nA[開始] --> B[完成]');
  }
});

test('rejects unsupported, oversized and invalid UTF-8 files', async () => {
  assert.throws(() => validateMermaidFile({ name: 'chart.html', size: 10 }), /\.mmd/);
  assert.throws(() => validateMermaidFile({ name: 'chart.mmd', size: MAX_MERMAID_BYTES + 1 }), /1 MB/);
  await assert.rejects(readMermaidFile(new File([new Uint8Array([0xff])], 'chart.mmd')), /UTF-8/);
});

test('accepts raw source or a single Mermaid code fence', () => {
  assert.equal(normalizeMermaidSource('  flowchart LR\nA-->B  '), 'flowchart LR\nA-->B');
  assert.equal(normalizeMermaidSource('```mermaid\nflowchart LR\nA-->B\n```'), 'flowchart LR\nA-->B');
  assert.equal(normalizeMermaidSource('```mmd\r\nsequenceDiagram\r\nA->>B: Hi\r\n```'), 'sequenceDiagram\r\nA->>B: Hi');
});
