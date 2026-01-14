import React, { useState, useEffect } from 'react';
import { TextArea, Button } from '../components/UI';

type Mode = 'snakeToCamel' | 'camelToSnake';

const CamelCaseConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('snakeToCamel');
  const [autoConvert, setAutoConvert] = useState(true);

  // Core Logic
  const snakeToCamel = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/_([a-z0-9])/g, (_, group1) => group1.toUpperCase());
  };

  const camelToSnake = (str: string): string => {
    // Looks for capital letters, inserts underscore before them, then uppercases the whole thing
    return str
      .replace(/([A-Z0-9])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, ''); // Remove leading underscore if it started with uppercase
  };

  const processConversion = (currentInput: string, currentMode: Mode) => {
    if (!currentInput) {
      setOutput('');
      return;
    }

    const lines = currentInput.split('\n');
    const convertedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Detect indentation
      const indentMatch = line.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : '';
      
      let result = '';
      if (currentMode === 'snakeToCamel') {
        result = snakeToCamel(trimmed);
      } else {
        result = camelToSnake(trimmed);
      }
      
      return indent + result;
    });

    setOutput(convertedLines.join('\n'));
  };

  // Effect for auto-convert
  useEffect(() => {
    if (autoConvert) {
      processConversion(input, mode);
    }
  }, [input, mode, autoConvert]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  const toggleMode = () => {
      const newMode = mode === 'snakeToCamel' ? 'camelToSnake' : 'snakeToCamel';
      setMode(newMode);
      // Optional: Swap input/output if output exists, for fluid workflow
      if (output) {
          setInput(output);
          processConversion(output, newMode);
      }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header / Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#18181a] border border-gray-200 dark:border-[#3c4043] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-[#E8EAED] flex items-center gap-2">
            <span className="text-2xl">🐪</span> 
            物件命名轉換器
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#9AA0A6] mt-1">
            在資料庫欄位 (Snake_Case) 與 Java 物件屬性 (camelCase) 之間快速切換。
          </p>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 dark:bg-[#202124] p-1.5 rounded-lg border border-gray-200 dark:border-[#3c4043]">
           <button
            onClick={() => setMode('snakeToCamel')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'snakeToCamel'
                ? 'bg-white dark:bg-[#004A77] text-blue-700 dark:text-[#C2E7FF] shadow-sm'
                : 'text-gray-500 dark:text-[#9AA0A6] hover:text-gray-800 dark:hover:text-white'
            }`}
           >
             USER_ID ➔ userId
           </button>
           <button
            onClick={() => setMode('camelToSnake')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'camelToSnake'
                ? 'bg-white dark:bg-[#004A77] text-blue-700 dark:text-[#C2E7FF] shadow-sm'
                : 'text-gray-500 dark:text-[#9AA0A6] hover:text-gray-800 dark:hover:text-white'
            }`}
           >
             userId ➔ USER_ID
           </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
        {/* Input Panel */}
        <div className="std-panel rounded-xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-[#3c4043] bg-gray-50 dark:bg-[#202124]">
            <label className="text-xs font-bold text-gray-500 dark:text-[#9AA0A6] uppercase tracking-wider">
              Input ({mode === 'snakeToCamel' ? 'Snake_Case' : 'camelCase'})
            </label>
            <button 
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-700 dark:text-[#F2B8B5] dark:hover:text-[#F9DEDC] px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-[#410e0b] transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 p-0 relative">
            <textarea
              className="w-full h-full p-4 bg-white dark:bg-[#0b0b0c] text-gray-800 dark:text-[#E8EAED] font-mono text-sm resize-none focus:outline-none"
              placeholder={mode === 'snakeToCamel' ? "e.g.\nUSER_ID\nCREATE_DATE" : "e.g.\nuserId\ncreateDate"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="std-panel rounded-xl flex flex-col overflow-hidden border-blue-200 dark:border-[#3c4043]">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-[#3c4043] bg-gray-50 dark:bg-[#202124]">
            <label className="text-xs font-bold text-blue-600 dark:text-[#A8C7FA] uppercase tracking-wider flex items-center gap-2">
              Output ({mode === 'snakeToCamel' ? 'camelCase' : 'Snake_Case'})
              <span className="bg-blue-100 dark:bg-blue-900 text-[10px] px-1.5 py-0.5 rounded-full font-normal">Editable</span>
            </label>
            <div className="flex gap-2">
               {!autoConvert && (
                 <button 
                  onClick={() => processConversion(input, mode)} 
                  className="text-xs bg-blue-50 dark:bg-[#004A77] text-blue-600 dark:text-[#C2E7FF] px-3 py-1 rounded hover:bg-blue-100 dark:hover:bg-[#005C94] transition-colors"
                >
                  Convert
                </button>
               )}
               <button 
                  onClick={handleCopy}
                  disabled={!output}
                  className="text-xs flex items-center gap-1 bg-gray-100 dark:bg-[#303134] text-gray-700 dark:text-[#E8EAED] px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-[#3c4043] transition-colors disabled:opacity-50"
                >
                  <span>📋</span> Copy
                </button>
            </div>
          </div>
          <div className="flex-1 p-0 relative bg-gray-50 dark:bg-[#0e0e0f]">
            <textarea
              className="w-full h-full p-4 bg-transparent text-gray-800 dark:text-[#A8C7FA] font-mono text-sm resize-none focus:outline-none focus:bg-white dark:focus:bg-[#121214] transition-colors"
              placeholder="Result..."
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              spellCheck={false}
            />
             {output && (
              <div className="absolute bottom-3 right-4 text-xs text-gray-400 dark:text-[#9AA0A6] pointer-events-none">
                {output.split('\n').length} lines
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Controls */}
      <div className="flex items-center justify-between px-2">
         <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 dark:text-[#9AA0A6] hover:text-gray-900 dark:hover:text-[#E8EAED] transition-colors">
            <input 
              type="checkbox" 
              checked={autoConvert}
              onChange={(e) => setAutoConvert(e.target.checked)}
              className="rounded border-gray-300 dark:border-[#3c4043] text-blue-600 focus:ring-blue-500 dark:bg-[#0b0b0c]"
            />
            <span>⚡ 自動即時轉換 (Real-time)</span>
         </label>

         <button onClick={toggleMode} className="text-xs text-gray-400 dark:text-[#9AA0A6] hover:text-blue-500 dark:hover:text-[#A8C7FA] transition-colors">
             ⇅ 交換輸入輸出
         </button>
      </div>
    </div>
  );
};

export default CamelCaseConverter;