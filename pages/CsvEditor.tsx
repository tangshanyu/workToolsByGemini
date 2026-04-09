import React, { useState, useRef, useCallback } from 'react';
import { Button, PageHeader } from '../components/UI';

const CsvEditor: React.FC = () => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [csvInput, setCsvInput] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CSV Parser ---
  const parseCSV = useCallback((text: string): { headers: string[]; rows: string[][] } => {
    const result: string[][] = [];
    let currentRow: string[] = [];
    let currentVal = '';
    let insideQuote = false;

    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        currentRow.push(currentVal);
        currentVal = '';
      } else if (char === '\n' && !insideQuote) {
        currentRow.push(currentVal);
        result.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }

    if (currentVal || currentRow.length > 0) {
      currentRow.push(currentVal);
      result.push(currentRow);
    }

    // Filter empty trailing rows
    const filtered = result.filter(r => !(r.length === 1 && r[0] === ''));

    if (filtered.length === 0) return { headers: [], rows: [] };

    const h = filtered[0];
    const r = filtered.slice(1);

    // Normalize: ensure all rows have same number of columns as headers
    const normalized = r.map(row => {
      const padded = [...row];
      while (padded.length < h.length) padded.push('');
      return padded.slice(0, h.length);
    });

    return { headers: h, rows: normalized };
  }, []);

  // --- CSV Serializer ---
  const serializeCSV = useCallback((): string => {
    const escapeField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return '"' + field.replace(/"/g, '""') + '"';
      }
      return field;
    };

    const lines: string[] = [];
    lines.push(headers.map(escapeField).join(','));
    rows.forEach(row => {
      lines.push(row.map(escapeField).join(','));
    });
    return lines.join('\n');
  }, [headers, rows]);

  // --- Import from File ---
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.replace(/\.csv$/i, ''));

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      setCsvInput('');
    };
    reader.readAsText(file, 'UTF-8');

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Import from Text ---
  const handleTextImport = () => {
    if (!csvInput.trim()) return;
    const { headers: h, rows: r } = parseCSV(csvInput);
    setHeaders(h);
    setRows(r);
    setFileName('exported');
  };

  // --- Cell Editing ---
  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    setRows(prev => {
      const copy = prev.map(r => [...r]);
      copy[rowIdx][colIdx] = value;
      return copy;
    });
  };

  const updateHeader = (colIdx: number, value: string) => {
    setHeaders(prev => {
      const copy = [...prev];
      copy[colIdx] = value;
      return copy;
    });
  };

  // --- Add / Delete ---
  const addRow = () => {
    setRows(prev => [...prev, new Array(headers.length).fill('')]);
  };

  const addColumn = () => {
    const newColName = `欄位${headers.length + 1}`;
    setHeaders(prev => [...prev, newColName]);
    setRows(prev => prev.map(r => [...r, '']));
  };

  const deleteRow = (rowIdx: number) => {
    setRows(prev => prev.filter((_, i) => i !== rowIdx));
  };

  const deleteColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders(prev => prev.filter((_, i) => i !== colIdx));
    setRows(prev => prev.map(r => r.filter((_, i) => i !== colIdx)));
  };

  // --- Export ---
  const handleDownload = () => {
    const csv = serializeCSV();
    // UTF-8 BOM for Excel to correctly detect encoding
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (fileName || 'exported') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const [copiedCsv, setCopiedCsv] = useState(false);
  const handleCopyCsv = () => {
    const csv = serializeCSV();
    navigator.clipboard.writeText(csv).then(() => {
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
    });
  };

  // --- Clear ---
  const handleClear = () => {
    setHeaders([]);
    setRows([]);
    setCsvInput('');
    setFileName('');
  };

  const hasTable = headers.length > 0;

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <PageHeader
        title="CSV 編輯器"
        icon="📊"
        description="匯入 CSV 檔案或貼上 CSV 文字，以表格方式編輯後匯出下載。"
        controls={
          hasTable && (
            <div className="flex items-center gap-2 text-sm font-medium bg-gray-100 dark:bg-[#252526] px-4 py-2 rounded-full border border-gray-200 dark:border-[#333]">
              <span className="text-blue-600 dark:text-blue-400">{headers.length} 欄</span>
              <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
              <span className="text-green-600 dark:text-green-400">{rows.length} 筆</span>
            </div>
          )
        }
      />

      {/* Import Section */}
      {!hasTable && (
        <div className="flex flex-col gap-4">
          {/* File Import */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📂 從檔案匯入</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileImport}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-semibold file:cursor-pointer
                  file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                  dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50
                  transition-all"
              />
            </div>
          </div>

          {/* Text Import */}
          <div className="p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📋 或直接貼上 CSV 文字</h3>
            <textarea
              className="w-full p-3 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#333] rounded-lg text-sm font-mono text-gray-800 dark:text-[#D4D4D4] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-0 min-h-[120px] resize-none"
              placeholder={'name,age,city\n王小明,25,台北\n李大華,30,高雄'}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              spellCheck={false}
              style={{ overflow: 'hidden' }}
              onInput={(e) => {
                const ta = e.currentTarget;
                ta.style.height = 'auto';
                ta.style.height = Math.max(120, ta.scrollHeight) + 'px';
              }}
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={handleTextImport} variant="primary" disabled={!csvInput.trim()}>
                📥 匯入
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Editor */}
      {hasTable && (
        <>
          {/* Action Bar */}
          <div className="flex flex-wrap gap-3 items-center shrink-0">
            <Button onClick={addRow} variant="secondary">➕ 新增行</Button>
            <Button onClick={addColumn} variant="secondary">➕ 新增欄</Button>

            <div className="flex-1" />

            <Button onClick={handleCopyCsv} variant="ghost">
              {copiedCsv ? '✅ 已複製' : '📋 複製 CSV'}
            </Button>
            <Button onClick={handleDownload} variant="primary">💾 下載 CSV</Button>
            <Button onClick={handleClear} variant="danger">🗑️ 清空</Button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#141414] shadow-sm">
            <table className="min-w-full text-sm border-collapse">
              {/* Header Row */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 dark:bg-[#252526] border-b border-gray-200 dark:border-[#333]">
                  {/* Row number header */}
                  <th className="p-2 w-10 text-center text-gray-400 dark:text-gray-500 text-xs font-mono select-none border-r border-gray-200 dark:border-[#333]">
                    #
                  </th>
                  {headers.map((h, colIdx) => (
                    <th key={colIdx} className="relative group/th p-0 min-w-[100px] border-r border-gray-200 dark:border-[#333]">
                      <input
                        className="w-full p-2 bg-transparent font-semibold text-gray-700 dark:text-[#E8EAED] text-sm focus:outline-none focus:bg-blue-50 dark:focus:bg-[#004A77]/30 transition-colors"
                        value={h}
                        onChange={(e) => updateHeader(colIdx, e.target.value)}
                        spellCheck={false}
                      />
                      {/* Delete Column Button */}
                      {headers.length > 1 && (
                        <button
                          onClick={() => deleteColumn(colIdx)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none items-center justify-center hidden group-hover/th:flex hover:bg-red-600 transition-all shadow z-20"
                          title="刪除此欄"
                        >
                          ✕
                        </button>
                      )}
                    </th>
                  ))}
                  {/* Actions column */}
                  <th className="p-2 w-10 border-r-0"></th>
                </tr>
              </thead>

              {/* Data Rows */}
              <tbody className="divide-y divide-gray-100 dark:divide-[#333]/50">
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="group/row hover:bg-blue-50/30 dark:hover:bg-[#2D2D2D] transition-colors">
                    {/* Row number */}
                    <td className="p-2 text-center text-gray-400 dark:text-gray-500 text-xs font-mono select-none bg-gray-50 dark:bg-[#1A1A1A] border-r border-gray-100 dark:border-[#333]">
                      {rowIdx + 1}
                    </td>

                    {row.map((cell, colIdx) => (
                      <td key={colIdx} className="p-0 border-r border-gray-100 dark:border-[#333]/50">
                        <input
                          className="w-full p-2 bg-transparent text-gray-700 dark:text-[#D4D4D4] text-sm font-mono focus:outline-none focus:bg-yellow-50 dark:focus:bg-[#2a2a00]/40 transition-colors"
                          value={cell}
                          onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                          spellCheck={false}
                        />
                      </td>
                    ))}

                    {/* Delete Row Button */}
                    <td className="p-1 text-center">
                      <button
                        onClick={() => deleteRow(rowIdx)}
                        className="w-6 h-6 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover/row:opacity-100 text-sm"
                        title="刪除此行"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {rows.length === 0 && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                表格沒有資料，請按「➕ 新增行」新增。
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CsvEditor;
