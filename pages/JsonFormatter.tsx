import React, { useState, useMemo } from 'react';
import { TextArea, Button, OutputBox, PageHeader } from '../components/UI';

type ParseMode = 'auto' | 'json' | 'java' | 'csv';
type ViewMode = 'text' | 'table';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ParseMode>('auto');
  const [detectedMode, setDetectedMode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('text');

  // Table specific states
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [tableFilter, setTableFilter] = useState('');

  // --- Robust Java Map Parser ---
  const parseJavaMap = (str: string) => {
    let pos = 0;
    str = str.trim();

    const peek = () => (pos < str.length ? str[pos] : null);
    const consume = () => str[pos++];
    
    const consumeWhitespace = () => {
      while (pos < str.length && /\s/.test(str[pos])) pos++;
    };

    const parseValue: () => any = () => {
      consumeWhitespace();
      const char = peek();
      
      if (char === '[') return parseList();
      if (char === '{') return parseMap();
      
      // Handle explicit null
      if (str.startsWith('null', pos)) {
          const nextChar = str[pos + 4];
          if (!nextChar || /[\s,}\]]/.test(nextChar)) {
              pos += 4;
              return null;
          }
      }

      return parseLiteral();
    };

    const parseList: () => any[] = () => {
      consume(); // '['
      const arr = [];
      
      while (pos < str.length) {
        consumeWhitespace();
        
        // Handle empty list or trailing comma case immediately
        if (peek() === ']') {
            consume();
            return arr;
        }

        const val = parseValue();
        arr.push(val);
        
        consumeWhitespace();
        
        if (peek() === ',') {
            consume();
            continue; // Continue to next item (loop will check for ']' again)
        }

        if (peek() === ']') {
            consume();
            return arr;
        }

        // Error recovery: skipping unknown chars to avoid infinite loop
        // We only skip if we didn't find a separator or closer
        if (pos < str.length) {
             const nextChar = peek();
             // If we see a start of new item, implicit comma
             if (nextChar === '{' || nextChar === '[') {
                 continue;
             }
             pos++; 
        }
      }
      return arr;
    };

    const parseMap: () => any = () => {
      consume(); // '{'
      const obj: any = {};
      
      while (pos < str.length) {
        consumeWhitespace();
        if (peek() === '}') {
            consume();
            return obj;
        }

        const key = parseKey();
        consumeWhitespace();
        
        if (peek() === '=') {
            consume();
        }

        const val = parseValue();
        obj[key] = val;

        consumeWhitespace();
        if (peek() === ',') {
            consume();
            continue;
        }

        if (peek() === '}') {
            consume();
            return obj;
        }
        
        // Error recovery
        if (pos < str.length) {
             const nextChar = peek();
             // Check if it looks like a key start
             if (/[a-zA-Z0-9_]/.test(nextChar || '')) {
                 continue;
             }
             pos++;
        }
      }
      return obj;
    };

    const parseKey = () => {
      consumeWhitespace();
      let start = pos;
      while (pos < str.length) {
          const c = str[pos];
          // Stop at separators
          if (c === '=' || c === ',' || c === '}') {
              break;
          }
          pos++;
      }
      return str.substring(start, pos).trim();
    };

    const parseLiteral = () => {
      consumeWhitespace();
      let start = pos;
      let depth = 0; // Track nesting of {}, [], ()
      let inQuote = false;
      let quoteChar = '';

      while (pos < str.length) {
          const c = str[pos];

          if (inQuote) {
              // If inside a quote, ignore everything except the matching closing quote
              // Simple escape handling: skip if preceded by backslash (not perfect but sufficient for simple cases)
              if (c === quoteChar && str[pos - 1] !== '\\') {
                  inQuote = false;
              }
          } else {
              // Not in quote
              if (c === '"' || c === "'") {
                  inQuote = true;
                  quoteChar = c;
              } else if (c === '{' || c === '[' || c === '(') {
                  depth++;
              } else if (c === '}' || c === ']' || c === ')') {
                  if (depth > 0) {
                      depth--;
                  } else {
                      // depth is 0, this closer belongs to the parent container
                      // e.g. parsing a value inside { key=val } -> '}' ends the val AND the map
                      break;
                  }
              } else if (c === ',') {
                  // Only break on comma if we are at top level (not nested)
                  if (depth === 0) {
                      break;
                  }
              }
          }
          pos++;
      }
      
      let val = str.substring(start, pos).trim();

      if (val === 'null') return null;
      if (val === 'true') return true;
      if (val === 'false') return false;

      // Try to parse as number
      if (val !== '' && !isNaN(Number(val)) && !inQuote && (val.match(/^0\d+/) === null)) { 
          // Regex check prevents "0113" (octal-like string) being parsed as number 113 if user wants string
          // But strict isNaN usually handles this. Adding strict check for scientific notation or standard numbers
          const isScientific = /e/i.test(val);
          const isLeadingZero = val.length > 1 && val.startsWith('0') && !val.includes('.');
          
          if (!isLeadingZero || isScientific) {
              return Number(val);
          }
      }

      // If it looks like a quoted string ('...' or "..."), strip quotes
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
          if (val.length >= 2) {
              return val.substring(1, val.length - 1);
          }
      }

      return val;
    };

    return parseValue();
  };

  // --- CSV Parser ---
  const parseCSV = (text: string): any[] => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentVal = '';
      let insideQuote = false;
      
      // Normalize line breaks
      const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      for (let i = 0; i < cleanText.length; i++) {
          const char = cleanText[i];
          const nextChar = cleanText[i + 1];

          if (char === '"') {
              if (insideQuote && nextChar === '"') {
                  // Escaped quote ("")
                  currentVal += '"';
                  i++; // skip next quote
              } else {
                  // Toggle quote state
                  insideQuote = !insideQuote;
              }
          } else if (char === ',' && !insideQuote) {
              // End of field
              currentRow.push(currentVal);
              currentVal = '';
          } else if (char === '\n' && !insideQuote) {
              // End of row
              currentRow.push(currentVal);
              rows.push(currentRow);
              currentRow = [];
              currentVal = '';
          } else {
              currentVal += char;
          }
      }
      
      // Push last field/row if exists
      if (currentVal || currentRow.length > 0) {
          currentRow.push(currentVal);
          rows.push(currentRow);
      }

      // Convert to Objects if headers exist
      if (rows.length < 2) return rows; // Return array of arrays if simple list

      const headers = rows[0].map(h => h.trim());
      const data = [];
      
      for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          // Skip empty trailing rows
          if (row.length === 1 && row[0] === '') continue;
          
          const obj: any = {};
          let hasData = false;
          
          headers.forEach((header, index) => {
              const val = row[index];
              if (val !== undefined) {
                 // Try to convert numbers/booleans if it looks like one, else string
                 const trimmed = val.trim();
                 if (!isNaN(Number(trimmed)) && trimmed !== '') {
                    obj[header] = Number(trimmed);
                 } else if (trimmed.toLowerCase() === 'true') {
                    obj[header] = true;
                 } else if (trimmed.toLowerCase() === 'false') {
                    obj[header] = false;
                 } else {
                    obj[header] = val; // keep spaces for strings if meaningful
                 }
                 hasData = true;
              } else {
                 obj[header] = null;
              }
          });
          
          if (hasData) data.push(obj);
      }
      
      return data;
  };

  const processFormat = () => {
    if (!input.trim()) {
      setOutput('');
      setParsedData(null);
      setError(null);
      setDetectedMode(null);
      return;
    }

    try {
      let parsed;
      let usedMode = mode;
      const trimmed = input.trim();

      if (mode === 'auto') {
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
             usedMode = 'json';
          } else if (trimmed.includes('=') && !trimmed.includes('":') && trimmed.startsWith('{')) {
             usedMode = 'java';
          } else if (trimmed.includes(',') && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
             // Heuristic for CSV: usually has commas and newlines, or at least multiple commas
             usedMode = 'csv';
          } else {
             usedMode = 'json'; // Fallback
          }
          setDetectedMode(usedMode);
      } else {
          setDetectedMode(null);
      }

      if (usedMode === 'java') {
         parsed = parseJavaMap(input);
      } else if (usedMode === 'csv') {
         parsed = parseCSV(input);
      } else {
         // Default JSON
         parsed = JSON.parse(input);
      }

      setParsedData(parsed);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
      
      // Reset table states
      setSortConfig(null);
      setTableFilter('');

    } catch (e: any) {
      setError("解析失敗: " + e.message + "\n\n請檢查所選格式是否正確，或資料是否包含特殊字元。");
      setParsedData(null);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setParsedData(null);
    setError(null);
    setDetectedMode(null);
    setSortConfig(null);
    setTableFilter('');
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- Render Table ---
  const renderTable = () => {
      if (!parsedData) return <div className="p-8 text-gray-500 text-center text-sm">請先輸入資料並執行解析。</div>;

      let headers: string[] = [];
      let rows: any[] = [];
      let isArrayOfObjects = false;

      // Determine Table Structure
      if (Array.isArray(parsedData)) {
          if (parsedData.length > 0) {
              // Check if it looks like an array of objects
              // We check the first non-null item to guess type
              const firstItem = parsedData.find(item => item !== null && item !== undefined);
              
              // Special case for CSV result (which produces Array of Objects) or just JSON array of objects
              if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
                  isArrayOfObjects = true;
                  const keys = new Set<string>();
                  parsedData.forEach(item => {
                      if (item && typeof item === 'object') {
                          Object.keys(item).forEach(k => keys.add(k));
                      }
                  });
                  headers = Array.from(keys);
                  rows = parsedData;
              } else if (Array.isArray(firstItem)) {
                   // Array of Arrays (e.g. simple CSV without headers parsed as rows)
                   // We treat the longest row as the header count source
                   const maxLen = Math.max(...parsedData.map((r: any[]) => r.length));
                   headers = Array.from({length: maxLen}, (_, i) => `Col ${i+1}`);
                   rows = parsedData;
              } else {
                   // Primitives
                   headers = ['Index', 'Value'];
                   rows = parsedData.map((val, idx) => ({ Index: idx, Value: val }));
                   isArrayOfObjects = true; // Treated as object for rendering logic below
              }
          } else {
              // Empty array
              headers = ['Value'];
              rows = [];
          }
      } else if (typeof parsedData === 'object' && parsedData !== null) {
          // Case: Single Object
          headers = ['Key', 'Value'];
          rows = Object.entries(parsedData).map(([k, v]) => ({ Key: k, Value: v })); 
          isArrayOfObjects = true;
      } else {
          // Case: Primitive root
          return <div className="p-4 text-gray-500 text-center">此資料類型 ({typeof parsedData}) 不支援表格檢視。</div>;
      }

      if (rows.length === 0) return <div className="p-8 text-gray-500 text-center">無資料可顯示 (Empty Array)。</div>;

      // --- Processing: Filtering ---
      let displayRows = rows;
      if (tableFilter.trim()) {
          const lowerFilter = tableFilter.toLowerCase();
          displayRows = rows.filter(row => {
              // Search in all fields
              return headers.some(header => {
                  const val = isArrayOfObjects ? row[header] : row[headers.indexOf(header)]; // Handle array of objects vs array of arrays
                  if (val === null || val === undefined) return false;
                  return String(val).toLowerCase().includes(lowerFilter);
              });
          });
      }

      // --- Processing: Sorting ---
      if (sortConfig) {
          displayRows = [...displayRows].sort((a, b) => {
              const valA = isArrayOfObjects ? a[sortConfig.key] : a[headers.indexOf(sortConfig.key)];
              const valB = isArrayOfObjects ? b[sortConfig.key] : b[headers.indexOf(sortConfig.key)];

              if (valA === null || valA === undefined) return 1;
              if (valB === null || valB === undefined) return -1;

              if (typeof valA === 'number' && typeof valB === 'number') {
                  return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
              } else {
                  return sortConfig.direction === 'asc' 
                      ? String(valA).localeCompare(String(valB)) 
                      : String(valB).localeCompare(String(valA));
              }
          });
      }

      return (
          <div className="w-full flex flex-col">
              {/* Filter Input */}
              <div className="p-2 border-b border-gray-100 dark:border-[#3c4043] bg-gray-50 dark:bg-[#18181a]">
                   <input 
                      type="text" 
                      placeholder="🔍 篩選資料..." 
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-[#3c4043] bg-white dark:bg-[#0e0e0f] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                      value={tableFilter}
                      onChange={(e) => setTableFilter(e.target.value)}
                   />
              </div>

              {/* Table Wrapper - No fixed height in table mode to allow page scroll */}
              <div className="w-full overflow-x-auto bg-white dark:bg-[#0e0e0f]">
                  <table className="min-w-full text-left text-sm whitespace-nowrap border-collapse">
                      <thead className="bg-gray-100 dark:bg-[#1f1f21] border-b border-gray-200 dark:border-[#3c4043]">
                          <tr>
                              {isArrayOfObjects && (
                                  <th className="p-3 border-r border-gray-200 dark:border-[#3c4043] w-12 text-center text-gray-500 dark:text-gray-400 font-mono text-xs select-none">
                                      #
                                  </th>
                              )}
                              {headers.map(h => (
                                  <th 
                                    key={h} 
                                    onClick={() => requestSort(h)}
                                    className="p-3 font-semibold text-gray-700 dark:text-[#E8EAED] border-r border-gray-200 dark:border-[#3c4043] min-w-[100px] cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a2b2e] transition-colors select-none group"
                                  >
                                      <div className="flex items-center justify-between gap-2">
                                          <span>{h}</span>
                                          <span className="text-gray-400 text-xs">
                                              {sortConfig?.key === h ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                                          </span>
                                      </div>
                                  </th>
                              ))}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#3c4043]/50">
                          {displayRows.length === 0 ? (
                              <tr>
                                  <td colSpan={headers.length + (isArrayOfObjects ? 1 : 0)} className="p-8 text-center text-gray-400">
                                      沒有符合的資料
                                  </td>
                              </tr>
                          ) : (
                              displayRows.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-[#2a2b2e] transition-colors group">
                                      {isArrayOfObjects ? (
                                          <>
                                              <td className="p-3 text-gray-400 text-xs text-center border-r border-gray-100 dark:border-[#3c4043] bg-gray-50 dark:bg-[#18181a] group-hover:bg-blue-100/50 dark:group-hover:bg-[#303134]">
                                                  {idx + 1}
                                              </td>
                                              {headers.map(header => {
                                                  const val = row[header];
                                                  let displayVal = val;
                                                  const isObj = typeof val === 'object' && val !== null;
                                                  if (isObj) displayVal = JSON.stringify(val);
                                                  
                                                  return (
                                                      <td key={header} className="p-3 text-gray-700 dark:text-[#A8C7FA] font-mono border-r border-transparent dark:border-transparent">
                                                          <div className="max-w-[300px] truncate" title={String(displayVal)}>
                                                              {isObj ? <span className="text-gray-400 italic text-xs">{displayVal}</span> : String(displayVal ?? '')}
                                                          </div>
                                                      </td>
                                                  )
                                              })}
                                          </>
                                      ) : (
                                          // Array of Arrays case
                                          headers.map((_, colIdx) => {
                                              const val = row[colIdx];
                                              let displayVal = val;
                                              const isObj = typeof val === 'object' && val !== null;
                                              if (isObj) displayVal = JSON.stringify(val);
                                              
                                              return (
                                                  <td key={colIdx} className="p-3 text-gray-700 dark:text-[#A8C7FA] font-mono">
                                                      <div className="max-w-[400px] truncate" title={String(displayVal)}>
                                                          {isObj ? <span className="text-gray-400 italic text-xs">{displayVal}</span> : String(displayVal ?? '')}
                                                      </div>
                                                  </td>
                                              )
                                          })
                                      )}
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const getModeLabel = (m: string) => {
      switch(m) {
          case 'java': return 'Java Map';
          case 'json': return 'JSON';
          case 'csv': return 'CSV';
          default: return m;
      }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <PageHeader 
        title="Format Tool (JSON/Map/CSV)"
        icon="{}"
        description={
            <span>格式化 JSON，支援解析 Java <code>Map.toString()</code> (格式如 <code>{`{key=val}`}</code>) 以及 CSV 格式。</span>
        }
        controls={
            <div className="flex bg-gray-100 dark:bg-[#202124] p-1 rounded-lg border border-gray-200 dark:border-[#3c4043]">
                {(['auto', 'json', 'java', 'csv'] as ParseMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => { setMode(m); setDetectedMode(null); }}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            mode === m 
                            ? 'bg-white dark:bg-[#004A77] text-blue-700 dark:text-[#C2E7FF] shadow-sm' 
                            : 'text-gray-500 dark:text-[#9AA0A6] hover:text-gray-800 dark:hover:text-[#E8EAED]'
                        }`}
                    >
                        {m === 'auto' ? '⚡ 自動偵測' : getModeLabel(m)}
                    </button>
                ))}
            </div>
        }
      />

      {/* Input */}
      <div className="flex-1 min-h-[200px] flex flex-col overflow-hidden">
        <TextArea 
            label={`📥 輸入 (${mode === 'auto' ? '自動偵測' : getModeLabel(mode)})`}
            placeholder="貼上你的資料..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-full font-mono text-xs" 
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center shrink-0">
        <Button onClick={processFormat} variant="primary">
            🚀 格式化 / 解析
        </Button>
        <Button onClick={handleClear} variant="secondary">
            🗑️ 清空
        </Button>
      </div>

      {/* Output */}
      {/* If ViewMode is table, allow it to grow indefinitely for page scrolling. If text, keep fixed height scrollable. */}
      <div className={`${viewMode === 'table' ? 'min-h-[200px]' : 'flex-[2] min-h-[200px] flex flex-col overflow-hidden'}`}>
        {/* Custom Header for OutputBox */}
         <div className="flex justify-between items-center mb-2 px-1">
            <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-[#E8EAED]">解析結果</h3>
                {parsedData && Array.isArray(parsedData) && (
                    <span className="text-gray-400 text-xs">({parsedData.length} items)</span>
                )}
                {detectedMode && (
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        已偵測: {getModeLabel(detectedMode)}
                    </span>
                )}
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-200 dark:bg-[#303134] p-0.5 rounded-lg text-xs">
                <button
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1 rounded-md transition-all ${viewMode === 'text' ? 'bg-white dark:bg-[#004A77] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    JSON (Text)
                </button>
                <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-[#004A77] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    Table
                </button>
            </div>
         </div>
         
         {/* Container */}
        <div className={`
            rounded-xl border flex flex-col 
            ${viewMode === 'table' ? 'h-auto overflow-visible bg-white dark:bg-[#0e0e0f]' : 'flex-1 overflow-hidden'}
            ${error ? 'border-red-300 dark:border-red-800' : 'border-green-200 dark:border-[#3c4043]'}
        `}>
            
            {viewMode === 'text' ? (
                <>
                    <div className={`flex justify-between items-center px-4 py-2 border-b ${error ? 'bg-red-50 dark:bg-[#2a1212] border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-[#202124] border-gray-100 dark:border-[#3c4043]'}`}>
                        <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${error ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-[#C4EED0]'}`}>
                            {error ? 'Error' : 'JSON Output'}
                            {!error && <span className="bg-green-100 dark:bg-green-900 text-[10px] px-1.5 py-0.5 rounded-full font-normal text-green-800 dark:text-green-200">Editable</span>}
                        </label>
                        <button 
                            onClick={() => navigator.clipboard.writeText(output)}
                            disabled={!output || !!error}
                            className="text-xs flex items-center gap-1 bg-white dark:bg-[#303134] border border-gray-200 dark:border-[#5f6368] text-gray-700 dark:text-[#E8EAED] px-3 py-1 rounded hover:bg-gray-50 dark:hover:bg-[#3c4043] transition-colors disabled:opacity-50"
                        >
                            <span>📋</span> 複製
                        </button>
                    </div>
                    <div className="flex-1 p-0 relative bg-white dark:bg-[#0e0e0f] h-full">
                        <textarea
                            className={`w-full h-full p-4 bg-transparent font-mono text-sm resize-none focus:outline-none 
                            ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-[#A8C7FA]'}`}
                            placeholder="結果將顯示於此..."
                            value={error ? error : output}
                            onChange={(e) => setOutput(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </>
            ) : (
                // Table Mode
                renderTable()
            )}
         </div>
      </div>
    </div>
  );
};

export default JsonFormatter;