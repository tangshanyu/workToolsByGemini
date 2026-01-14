import React, { useState } from 'react';
import { TextArea, Button, OutputBox } from '../components/UI';

type ParseMode = 'auto' | 'json' | 'java';
type ViewMode = 'text' | 'table';

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ParseMode>('auto');
  const [detectedMode, setDetectedMode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('text');

  // --- Robust Java Map Parser ---
  const parseJavaMap = (str: string) => {
    let pos = 0;
    str = str.trim();

    const peek = () => (pos < str.length ? str[pos] : null);
    const consume = () => str[pos++];
    
    const consumeWhitespace = () => {
      while (pos < str.length && /\s/.test(str[pos])) pos++;
    };

    const matchChar = (c: string) => {
      consumeWhitespace();
      if (peek() === c) {
        consume();
        return true;
      }
      return false;
    };

    const parseValue: () => any = () => {
      consumeWhitespace();
      const char = peek();
      
      if (char === '[') return parseList();
      if (char === '{') return parseMap();
      
      // Handle explicit null
      if (str.startsWith('null', pos)) {
          // check boundaries
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
      consumeWhitespace();
      
      if (peek() === ']') {
        consume();
        return arr;
      }

      while (pos < str.length) {
        // Try to parse a value
        const val = parseValue();
        arr.push(val);
        
        consumeWhitespace();
        
        // If we see a comma, consume it and look for next item
        if (peek() === ',') {
            consume();
            consumeWhitespace();
            // If next is closing bracket, we are done (allow trailing comma logic if needed, or just loop)
            if (peek() === ']') {
                consume();
                return arr;
            }
            continue;
        }

        // If we see a closing bracket, we are done
        if (peek() === ']') {
            consume();
            return arr;
        }

        // Error recovery / Tolerance:
        // If we are here, we expected ',' or ']' but found something else.
        // It might be garbage between items (like the ' in },' \n { case).
        // Strategy: If we see a start of a new valid item ({ or [), assume a missing comma.
        const nextChar = peek();
        if (nextChar === '{' || nextChar === '[') {
            // Implicit comma, continue loop
            continue;
        }

        // Otherwise, it's likely garbage or a malformed literal. 
        // We force progress to avoid infinite loop.
        // If we just parsed a literal, maybe the literal parser stopped too early?
        // Let's just skip this character and try to continue.
        if (pos < str.length) {
             pos++; 
        }
      }
      return arr;
    };

    const parseMap: () => any = () => {
      consume(); // '{'
      const obj: any = {};
      consumeWhitespace();
      
      if (peek() === '}') {
        consume();
        return obj;
      }

      while (pos < str.length) {
        const key = parseKey();
        consumeWhitespace();
        
        // Expect '='
        if (peek() === '=') {
            consume();
        } else {
            // If no '=', this might be a set or just a weird format. 
            // Treat as key with null value or syntax error? 
            // Let's assume standard map structure for now.
        }

        const val = parseValue();
        obj[key] = val;

        consumeWhitespace();
        if (peek() === ',') {
            consume();
            consumeWhitespace();
            if (peek() === '}') {
                consume();
                return obj;
            }
            continue;
        }

        if (peek() === '}') {
            consume();
            return obj;
        }
        
        // Tolerance for missing commas
        // If we see standard key chars, assume next key
        if (/[a-zA-Z0-9_]/.test(peek() || '')) {
            continue;
        }
        
        // Force progress
        if (pos < str.length) pos++;
      }
      return obj;
    };

    const parseKey = () => {
      consumeWhitespace();
      let start = pos;
      // Read until =, comma, or end of block
      while (pos < str.length) {
          const c = str[pos];
          if (c === '=' || c === ',' || c === '}' || /\s/.test(c)) {
              break;
          }
          pos++;
      }
      return str.substring(start, pos);
    };

    const parseLiteral = () => {
      consumeWhitespace();
      let start = pos;
      
      // Heuristic: Read until standard separators.
      // Valid separators in this context: , } ]
      // Also stop if we hit something that looks like the start of a new map/list if we are lost?
      // No, literals shouldn't contain { or [.
      
      while (pos < str.length) {
          const c = str[pos];
          if (c === ',' || c === '}' || c === ']') {
              break;
          }
          // Special case recovery: if we hit newline, usually a literal doesn't span lines in this toString format
          // unless it's a long string. But for safety, let's include it.
          pos++;
      }
      
      let val = str.substring(start, pos).trim();

      // Clean up common artifacts (like quotes if the user pasted valid JSON strings mixed in)
      // But standard Map.toString() doesn't quote usually. 
      // If the user pasted `...BOND},'` -> the literal might be `'`.

      // Convert Types
      if (val === 'null') return null;
      if (val === 'true') return true;
      if (val === 'false') return false;

      // Try numeric
      // Rule: valid number, not empty, and NOT starting with 0 unless it is exactly "0" or "0.xxx"
      // This preserves "0113" as string.
      if (val !== '' && !isNaN(Number(val))) {
          const isScientific = /e/i.test(val);
          const isLeadingZero = val.length > 1 && val.startsWith('0') && !val.includes('.');
          
          if (!isLeadingZero || isScientific) {
              return Number(val);
          }
      }

      return val;
    };

    return parseValue();
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

      if (mode === 'auto') {
          // Simple heuristics
          const trimmed = input.trim();
          const isJson = (trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.includes('"');
          // Java maps often use = for assignment and unquoted keys
          const isJava = trimmed.includes('=') && !trimmed.includes('":');
          
          if (isJava) usedMode = 'java';
          else usedMode = 'json';
          
          setDetectedMode(usedMode);
      } else {
          setDetectedMode(null);
      }

      if (usedMode === 'java') {
         parsed = parseJavaMap(input);
      } else {
         parsed = JSON.parse(input);
      }

      setParsedData(parsed);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
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
  };

  // --- Render Table ---
  const renderTable = () => {
      if (!parsedData) return <div className="p-8 text-gray-500 text-center text-sm">請先輸入資料並執行解析。</div>;

      let headers: string[] = [];
      let rows: any[] = [];
      let isArrayOfObjects = false;

      // Determine Table Structure
      if (Array.isArray(parsedData)) {
          if (parsedData.length > 0 && typeof parsedData[0] === 'object' && parsedData[0] !== null) {
              // Case: Array of Objects
              isArrayOfObjects = true;
              const keys = new Set<string>();
              parsedData.forEach(item => {
                  if (item && typeof item === 'object') {
                      Object.keys(item).forEach(k => keys.add(k));
                  }
              });
              headers = Array.from(keys);
              rows = parsedData;
          } else {
              // Case: Array of Primitives (or mixed/empty)
              headers = ['Index', 'Value'];
              rows = parsedData.map((val, idx) => ({ Index: idx, Value: val }));
          }
      } else if (typeof parsedData === 'object' && parsedData !== null) {
          // Case: Single Object
          headers = ['Key', 'Value'];
          rows = Object.entries(parsedData).map(([k, v]) => ({ Key: k, Value: v })); 
      } else {
          // Case: Primitive root
          return <div className="p-4 text-gray-500 text-center">此資料類型 ({typeof parsedData}) 不支援表格檢視。</div>;
      }

      if (rows.length === 0) return <div className="p-8 text-gray-500 text-center">無資料可顯示。</div>;

      return (
          <div className="w-full h-full overflow-auto bg-white dark:bg-[#0e0e0f]">
              <table className="min-w-full text-left text-sm whitespace-nowrap border-collapse">
                  <thead className="bg-gray-100 dark:bg-[#1f1f21] sticky top-0 z-10 shadow-sm">
                      <tr>
                           {isArrayOfObjects && (
                               <th className="p-3 border-b border-r border-gray-200 dark:border-[#3c4043] w-12 text-center text-gray-500 dark:text-gray-400 font-mono text-xs select-none">#</th>
                           )}
                           {headers.map(h => (
                               <th key={h} className="p-3 font-semibold text-gray-700 dark:text-[#E8EAED] border-b border-gray-200 dark:border-[#3c4043] min-w-[100px]">
                                   {h}
                               </th>
                           ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#3c4043]/50">
                      {rows.map((row, idx) => (
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
                                  headers.map(h => {
                                      const val = row[h];
                                      let displayVal = val;
                                      const isObj = typeof val === 'object' && val !== null;
                                      if (isObj) displayVal = JSON.stringify(val);
                                      
                                      return (
                                          <td key={h} className="p-3 text-gray-700 dark:text-[#A8C7FA] font-mono">
                                              <div className="max-w-[400px] truncate" title={String(displayVal)}>
                                                  {isObj ? <span className="text-gray-400 italic text-xs">{displayVal}</span> : String(displayVal ?? '')}
                                              </div>
                                          </td>
                                      )
                                  })
                              )}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[#18181a] border border-gray-200 dark:border-[#3c4043] p-4 rounded-xl shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-[#E8EAED] flex items-center gap-2">
                <span className="text-2xl">{}</span> JSON & Map Formatter
            </h2>
            <p className="text-sm text-gray-500 dark:text-[#9AA0A6] mt-1">
                格式化 JSON 或解析 Java <code>Map.toString()</code> (格式如 <code>{`{key=val}`}</code>)。
            </p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-[#202124] p-1 rounded-lg border border-gray-200 dark:border-[#3c4043]">
            {(['auto', 'json', 'java'] as ParseMode[]).map((m) => (
                <button
                    key={m}
                    onClick={() => { setMode(m); setDetectedMode(null); }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        mode === m 
                        ? 'bg-white dark:bg-[#004A77] text-blue-700 dark:text-[#C2E7FF] shadow-sm' 
                        : 'text-gray-500 dark:text-[#9AA0A6] hover:text-gray-800 dark:hover:text-[#E8EAED]'
                    }`}
                >
                    {m === 'auto' ? '⚡ 自動偵測' : m === 'json' ? 'JSON' : 'Java Map'}
                </button>
            ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
         {/* Input */}
         <div className="flex flex-col h-full overflow-hidden">
            <TextArea 
                label={`📥 輸入 (${mode === 'auto' ? '自動偵測' : mode === 'json' ? 'JSON' : 'Java Map'})`}
                placeholder="貼上你的資料..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-full font-mono text-xs" 
            />
         </div>

         {/* Output */}
         <div className="flex flex-col h-full overflow-hidden">
            {/* Custom Header for OutputBox */}
             <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-[#E8EAED]">解析結果</h3>
                    {detectedMode && (
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            已偵測: {detectedMode === 'java' ? 'Java Map' : 'JSON'}
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
             
            <div className={`flex-1 rounded-xl overflow-hidden border flex flex-col ${error ? 'border-red-300 dark:border-red-800' : 'border-green-200 dark:border-[#3c4043]'}`}>
                
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
                    <div className="flex-1 bg-white dark:bg-[#0e0e0f] overflow-hidden flex flex-col">
                         {renderTable()}
                    </div>
                )}
             </div>
         </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center md:justify-start">
        <Button onClick={processFormat} variant="primary">
            🚀 格式化 / 解析
        </Button>
        <Button onClick={handleClear} variant="secondary">
            🗑️ 清空
        </Button>
      </div>
    </div>
  );
};

export default JsonFormatter;