import React, { useState, useEffect } from 'react';
import { TextArea, Button } from '../components/UI';

type ConversionMode = 'toCamel' | 'toSnake';

const CamelCaseConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<ConversionMode>('toCamel');
  const [autoConvert, setAutoConvert] = useState(true);

  // Core Logic
  const toCamelCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/_([a-z0-9])/g, (_, group1) => group1.toUpperCase());
  };

  const toSnakeCase = (str: string): string => {
    // Check if the string is already all uppercase (treat as constant), 
    // if so, don't just insert underscores, but this basic logic assumes camelCase input
    return str
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, ''); // Remove leading underscore if string starts with uppercase
  };

  const processConversion = () => {
    if (!input) {
      setOutput('');
      return;
    }

    const lines = input.split('\n');
    const convertedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Simple heuristic: keep indentation
      const indent = line.match(/^\s*/)?.[0] || '';
      
      let converted = '';
      if (mode === 'toCamel') {
        converted = toCamelCase(trimmed);
      } else {
        converted = toSnakeCase(trimmed);
      }
      
      return indent + converted;
    });

    setOutput(convertedLines.join('\n'));
  };

  // Effects
  useEffect(() => {
    if (autoConvert) {
      processConversion();
    }
  }, [input, mode, autoConvert]);

  // Handlers
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Description & Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
            🐪 駝峰命名轉換器
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            支援多行批次處理：蛇形 (USER_ID) ↔ 駝峰 (userId)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/80 p-1 rounded-lg shadow-inner">
           <button
            onClick={() => setMode('toCamel')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
              mode === 'toCamel'
                ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Snake ➔ Camel
          </button>
          <button
            onClick={() => setMode('toSnake')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
              mode === 'toSnake'
                ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Camel ➔ Snake
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
        {/* Input Panel */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-2">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400">
              輸入 ({mode === 'toCamel' ? 'USER_ID' : 'userId'})
            </label>
            <button 
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              清除
            </button>
          </div>
          <div className="flex-1 relative group">
            <textarea
              className="w-full h-full min-h-[300px] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none shadow-sm group-hover:shadow-md"
              placeholder={mode === 'toCamel' ? "範例：\nUSER_ID\nCREATE_DATE\nIS_VALID" : "範例：\nuserId\ncreateDate\nisValid"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-2">
           <div className="flex justify-between items-center px-2">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400">
              結果 ({mode === 'toCamel' ? 'userId' : 'USER_ID'})
            </label>
            <div className="flex gap-2">
               {!autoConvert && (
                 <button 
                  onClick={processConversion} 
                  className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  執行轉換
                </button>
               )}
               <button 
                  onClick={handleCopy}
                  disabled={!output}
                  className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  複製結果
                </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              readOnly
              className="w-full h-full min-h-[300px] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/30 text-gray-800 dark:text-blue-200 font-mono text-sm focus:outline-none transition-all resize-none shadow-inner"
              placeholder="轉換結果將顯示於此..."
              value={output}
            />
             {output && (
              <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 dark:bg-black/40 px-2 py-1 rounded pointer-events-none">
                {output.split('\n').length} 行已轉換
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Settings Footer */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 px-2">
         <label className="flex items-center gap-2 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <input 
              type="checkbox" 
              checked={autoConvert}
              onChange={(e) => setAutoConvert(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span>⚡ 自動即時轉換</span>
         </label>
      </div>
    </div>
  );
};

export default CamelCaseConverter;