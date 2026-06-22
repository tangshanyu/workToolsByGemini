import React, { useState, useMemo } from 'react';
import { PageHeader, Button } from '../components/UI';

// --- Helper Functions ---
function parseTsv(text: string): string[][] {
  if (!text) return [];
  return text.split('\n')
    .map(line => line.replace(/\r$/, ''))
    .filter(line => line.trim().length > 0)
    .map(line => line.split('\t'));
}

function generateTsv(data: string[][]): string {
  return data.map(row => row.join('\t')).join('\n');
}

function getColumnLabel(index: number): string {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

interface LookupCondition {
  targetIdx: number;
  sourceIdx: number;
}

const VLookup: React.FC = () => {
  // Input State
  const [targetInput, setTargetInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');

  // Configuration State
  const [targetHasHeader, setTargetHasHeader] = useState(true);
  const [sourceHasHeader, setSourceHasHeader] = useState(true);
  const [conditions, setConditions] = useState<LookupCondition[]>([{ targetIdx: 0, sourceIdx: 0 }]);
  const [selectedSourceCols, setSelectedSourceCols] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  // Parse Data
  const targetData = useMemo(() => parseTsv(targetInput), [targetInput]);
  const sourceData = useMemo(() => parseTsv(sourceInput), [sourceInput]);

  const targetHeaders = useMemo(() => {
    if (targetData.length === 0) return [];
    if (targetHasHeader) return targetData[0];
    return targetData[0].map((_, i) => getColumnLabel(i));
  }, [targetData, targetHasHeader]);

  const sourceHeaders = useMemo(() => {
    if (sourceData.length === 0) return [];
    if (sourceHasHeader) return sourceData[0];
    return sourceData[0].map((_, i) => getColumnLabel(i));
  }, [sourceData, sourceHasHeader]);

  // Reset conditions when headers change significantly
  React.useEffect(() => {
    if (targetHeaders.length > 0 && sourceHeaders.length > 0) {
      setConditions([{ targetIdx: 0, sourceIdx: 0 }]);
      setSelectedSourceCols([]);
    }
  }, [targetHeaders.length, sourceHeaders.length]);

  // Handle source column selection toggle
  const toggleSourceCol = (idx: number) => {
    setSelectedSourceCols(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Select all source columns (except those used in conditions)
  const selectAllSourceCols = () => {
    const conditionSourceIdxs = new Set(conditions.map(c => c.sourceIdx));
    const allExceptKeys = sourceHeaders.map((_, i) => i).filter(i => !conditionSourceIdxs.has(i));
    setSelectedSourceCols(allExceptKeys);
  };

  // Clear source columns selection
  const clearSourceCols = () => {
    setSelectedSourceCols([]);
  };

  // Handle Condition Changes
  const addCondition = () => {
    setConditions(prev => [...prev, { targetIdx: 0, sourceIdx: 0 }]);
  };

  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: 'targetIdx' | 'sourceIdx', value: number) => {
    setConditions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // Remove the newly selected source key from selected return columns
    if (field === 'sourceIdx') {
      setSelectedSourceCols(prev => prev.filter(i => i !== value));
    }
  };

  // Process VLookup
  const resultData = useMemo(() => {
    if (targetData.length === 0) return [];
    if (sourceData.length === 0 || selectedSourceCols.length === 0 || conditions.length === 0) return targetData;

    // Build HashMap for source data
    const sourceMap = new Map<string, string[]>();
    const sourceStartIdx = sourceHasHeader ? 1 : 0;
    for (let i = sourceStartIdx; i < sourceData.length; i++) {
      const row = sourceData[i];
      // Generate composite key
      const key = conditions.map(c => row[c.sourceIdx] || '').join('|');
      if (key && !sourceMap.has(key)) {
        sourceMap.set(key, row);
      }
    }

    // Prepare Result
    const results: string[][] = [];
    
    // Add Header
    const newHeader = [...targetHeaders];
    selectedSourceCols.forEach(idx => {
      newHeader.push(sourceHeaders[idx] || `Column ${idx + 1}`);
    });
    results.push(newHeader);

    // Process Data Rows
    const targetStartIdx = targetHasHeader ? 1 : 0;
    for (let i = targetStartIdx; i < targetData.length; i++) {
      const row = [...targetData[i]];
      // Generate composite key
      const key = conditions.map(c => row[c.targetIdx] || '').join('|');
      const sourceRow = sourceMap.get(key);

      selectedSourceCols.forEach(idx => {
        if (sourceRow && sourceRow.length > idx) {
          row.push(sourceRow[idx]);
        } else {
          row.push(''); // No match or missing data
        }
      });
      results.push(row);
    }

    return results;
  }, [targetData, sourceData, conditions, selectedSourceCols, targetHasHeader, sourceHasHeader, targetHeaders, sourceHeaders]);

  const handleCopy = () => {
    const tsv = generateTsv(resultData);
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const tsv = generateTsv(resultData);
    // Add BOM for Excel compatibility with UTF-8 CSV/TSV
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, tsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vlookup_result.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full gap-5 pb-20">
      <PageHeader
        title="VLookup 查詢合併"
        icon="🔍"
        description="貼上目標與來源表格，選擇比對欄位（支援多條件），快速帶入需要的資料，並直接匯出結果。"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Target Table Input */}
        <div className="flex flex-col gap-3 p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              目標表格 (Target)
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <input type="checkbox" className="rounded border-gray-300 dark:border-[#555] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#141414]" checked={targetHasHeader} onChange={(e) => setTargetHasHeader(e.target.checked)} />
                第一列為表頭
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {targetData.length > 0 ? `共 ${targetData.length - (targetHasHeader ? 1 : 0)} 筆` : '尚未貼上資料'}
              </span>
            </div>
          </div>
          <textarea
            className="w-full h-32 p-3 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#333] rounded-lg text-sm font-mono text-gray-800 dark:text-[#D4D4D4] focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-0 resize-none whitespace-pre"
            placeholder="請從 Excel 或 Word 複製並貼上您的主表..."
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Source Table Input */}
        <div className="flex flex-col gap-3 p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              來源表格 (Source)
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-green-600 dark:hover:text-green-400 transition-colors">
                <input type="checkbox" className="rounded border-gray-300 dark:border-[#555] text-green-600 focus:ring-green-500 bg-white dark:bg-[#141414]" checked={sourceHasHeader} onChange={(e) => setSourceHasHeader(e.target.checked)} />
                第一列為表頭
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {sourceData.length > 0 ? `共 ${sourceData.length - (sourceHasHeader ? 1 : 0)} 筆` : '尚未貼上資料'}
              </span>
            </div>
          </div>
          <textarea
            className="w-full h-32 p-3 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#333] rounded-lg text-sm font-mono text-gray-800 dark:text-[#D4D4D4] focus:outline-none focus:border-green-400 dark:focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-0 resize-none whitespace-pre"
            placeholder="請從 Excel 或 Word 複製並貼上您的參考表..."
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Conditions Setting */}
      {targetData.length > 0 && sourceData.length > 0 && (
        <div className="p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
              設定比對條件 (Lookup Keys)
            </h3>
            <Button onClick={addCondition} variant="secondary" className="text-xs py-1 px-3 h-auto">
              ➕ 新增條件
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            {conditions.map((cond, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-lg border border-gray-200 dark:border-[#333]">
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">目標欄位 (Target)</label>
                    <select
                      className="w-full p-2 text-sm bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-400 cursor-pointer"
                      value={cond.targetIdx}
                      onChange={(e) => updateCondition(index, 'targetIdx', Number(e.target.value))}
                    >
                      {targetHeaders.map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden sm:block text-gray-400 mt-4 text-sm">🟰</div>
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">來源欄位 (Source)</label>
                    <select
                      className="w-full p-2 text-sm bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-400 cursor-pointer"
                      value={cond.sourceIdx}
                      onChange={(e) => updateCondition(index, 'sourceIdx', Number(e.target.value))}
                    >
                      {sourceHeaders.map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {conditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(index)}
                    className="w-8 h-8 flex items-center justify-center mt-0 sm:mt-5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                    title="移除條件"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Select Columns to bring over */}
      {targetData.length > 0 && sourceData.length > 0 && (
        <div className="p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
            選擇要帶入的來源欄位 (多選)
          </h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={selectAllSourceCols} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D2D] dark:hover:bg-[#3D3D3D] text-gray-700 dark:text-gray-300 rounded transition-colors">全選 (不含比對鍵值)</button>
            <button onClick={clearSourceCols} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D2D] dark:hover:bg-[#3D3D3D] text-gray-700 dark:text-gray-300 rounded transition-colors">清除</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sourceHeaders.map((h, i) => {
              const conditionSourceIdxs = new Set(conditions.map(c => c.sourceIdx));
              if (conditionSourceIdxs.has(i)) return null; // Don't allow bringing over the key itself usually
              const isSelected = selectedSourceCols.includes(i);
              return (
                <div
                  key={i}
                  onClick={() => toggleSourceCol(i)}
                  className={`cursor-pointer px-4 py-2 rounded-lg border text-sm transition-all duration-200 flex items-center gap-2 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium shadow-sm'
                      : 'border-gray-200 dark:border-[#444] bg-white dark:bg-[#252526] text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${
                    isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300 dark:border-[#555]'
                  }`}>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </div>
                  {h || `Column ${i + 1}`}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result Preview */}
      {resultData.length > 1 && selectedSourceCols.length > 0 && (
        <div className="p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span>
              結果預覽 ({resultData.length - 1} 筆資料)
            </h3>
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="secondary" className="text-sm py-1.5 px-4 h-auto">
                {copied ? '✅ 已複製！' : '📋 複製表格'}
              </Button>
              <Button onClick={handleDownload} variant="primary" className="text-sm py-1.5 px-4 h-auto">
                ⬇️ 下載 CSV
              </Button>
            </div>
          </div>
          <div className="overflow-auto rounded-lg border border-gray-200 dark:border-[#333] max-h-[400px]">
            <table className="min-w-max text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 dark:bg-[#252526] border-b border-gray-200 dark:border-[#333]">
                  <th className="p-2 px-3 text-xs text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-[#333] w-12 bg-gray-100 dark:bg-[#252526] sticky left-0 z-20">#</th>
                  {resultData[0].map((h, i) => {
                    const isNewCol = i >= targetHeaders.length;
                    return (
                      <th
                        key={i}
                        className={`p-2 px-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-[#333] whitespace-nowrap ${
                          isNewCol ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400' : ''
                        }`}
                      >
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#333]/50">
                {resultData.slice(1, 101).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-[#2D2D2D] transition-colors">
                    <td className="p-2 px-3 text-center text-xs text-gray-400 font-mono border-r border-gray-200 dark:border-[#333] sticky left-0 z-10 bg-white dark:bg-[#1E1E1E] group-hover:bg-gray-50 dark:group-hover:bg-[#2D2D2D]">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, cellIdx) => {
                      const isNewCol = cellIdx >= targetHeaders.length;
                      const isEmpty = cell.trim() === '';
                      
                      let bgClass = '';
                      if (isEmpty) {
                        bgClass = 'bg-red-50 dark:bg-red-900/20'; // Highlight missing data
                      } else if (isNewCol) {
                        bgClass = 'bg-purple-50/30 dark:bg-purple-900/5';
                      }

                      return (
                        <td
                          key={cellIdx}
                          className={`p-2 px-3 border-r border-gray-100 dark:border-[#333]/50 whitespace-nowrap ${bgClass} ${
                            isEmpty ? 'text-red-400 dark:text-red-500/70 italic' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resultData.length > 101 && (
             <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
               ...僅顯示前 100 筆，請點擊「複製表格」或「下載 CSV」取得完整資料。
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VLookup;
