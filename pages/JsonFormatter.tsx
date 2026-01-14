import React, { useState, useEffect } from 'react';
import { TextArea, Button } from '../components/UI';

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'json' | 'java'>('json');

  // Simple Recursive Descent Parser for Java Map.toString() format
  // e.g., {key=value, list=[a, b], map={sub=val}}
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
      if (char === '[') return parseArray();
      if (char === '{') return parseObject();
      return parseLiteral();
    };

    const parseArray: () => any[] = () => {
      consume(); // '['
      const arr = [];
      consumeWhitespace();
      if (peek() === ']') {
        consume();
        return arr;
      }
      while (pos < str.length) {
        arr.push(parseValue());
        consumeWhitespace();
        if (peek() === ']') {
          consume();
          return arr;
        }
        if (peek() === ',') consume();
      }
      return arr;
    };

    const parseObject: () => any = () => {
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
        if (peek() === '=') consume();
        obj[key] = parseValue();
        consumeWhitespace();
        if (peek() === '}') {
          consume();
          return obj;
        }
        if (peek() === ',') consume();
      }
      return obj;
    };

    const parseKey = () => {
      consumeWhitespace();
      let start = pos;
      // Key can be anything until '=' or special chars, but usually just text
      while (pos < str.length && str[pos] !== '=' && str[pos] !== '}' && str[pos] !== ',') {
        pos++;
      }
      return str.substring(start, pos).trim();
    };

    const parseLiteral = () => {
      consumeWhitespace();
      let start = pos;
      // Read until separator or closer
      // NOTE: This is a heuristic. It fails if the string value contains unquoted ',' or '}' or ']'
      // But Java Map.toString() doesn't escape these well anyway.
      while (pos < str.length && str[pos] !== ',' && str[pos] !== '}' && str[pos] !== ']') {
        pos++;
      }
      let val = str.substring(start, pos).trim();

      if (val === 'null') return null;
      if (val === 'true') return true;
      if (val === 'false') return false;
      
      // Try to convert to number, but be careful with leading zeros (e.g. 0113 should likely stay string)
      if (!isNaN(Number(val)) && val !== '') {
          // If it starts with 0 and has more digits and isn't a decimal, keep as string
          if (val.length > 1 && val.startsWith('0') && !val.includes('.')) {
              return val;
          }
          return Number(val);
      }
      return val;
    };

    return parseValue();
  };

  const processFormat = (txt: string) => {
    if (!txt.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      let parsed;
      // Auto-detection logic
      const isLikelyJava = !txt.trim().startsWith('"') && 
                           (txt.includes('=') && !txt.includes(':')) || 
                           (txt.includes('{') && !txt.includes('"'));

      if (isLikelyJava || mode === 'java') {
        // Try Java Parser
        try {
            parsed = parseJavaMap(txt);
            setMode('java');
        } catch (e) {
            // If Java parsing fails, try JSON as fallback
             parsed = JSON.parse(txt);
             setMode('json');
        }
      } else {
         parsed = JSON.parse(txt);
         setMode('json');
      }

      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError("Parsing Failed: " + e.message);
    }
  };

  const handleFormat = () => {
      processFormat(input);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
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
                格式化 JSON 以及解析 Java <code>Map.toString()</code> (如 <code>{`{key=val}`}</code>) 格式。
            </p>
        </div>
        
        {mode === 'java' && output && (
             <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded text-xs font-medium border border-orange-200 dark:border-orange-800">
                Detected Java Map Format
             </div>
        )}
      </div>

      {/* Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
         {/* Input */}
         <div className="flex flex-col h-full overflow-hidden">
            <TextArea 
                label="📥 輸入 (Raw JSON or Java Map String)"
                placeholder="貼上你的 JSON 或 Java Map 字串...&#10;e.g. [{PRC=100, NAME=Test}]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-full font-mono text-xs" 
            />
         </div>

         {/* Output */}
         <div className="std-panel rounded-xl flex flex-col overflow-hidden border-green-200 dark:border-[#3c4043]">
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-[#3c4043] bg-gray-50 dark:bg-[#202124]">
                <label className="text-xs font-bold text-green-700 dark:text-[#C4EED0] uppercase tracking-wider flex items-center gap-2">
                Result (JSON)
                <span className="bg-green-100 dark:bg-green-900 text-[10px] px-1.5 py-0.5 rounded-full font-normal text-green-800 dark:text-green-200">Editable</span>
                </label>
                <button 
                    onClick={handleCopy}
                    disabled={!output}
                    className="text-xs flex items-center gap-1 bg-white dark:bg-[#303134] border border-gray-200 dark:border-[#5f6368] text-gray-700 dark:text-[#E8EAED] px-3 py-1 rounded hover:bg-gray-50 dark:hover:bg-[#3c4043] transition-colors disabled:opacity-50"
                >
                    <span>📋</span> 複製
                </button>
            </div>
            <div className="flex-1 p-0 relative bg-white dark:bg-[#0e0e0f]">
                <textarea
                    className={`w-full h-full p-4 bg-transparent font-mono text-sm resize-none focus:outline-none 
                    ${error ? 'text-red-500' : 'text-gray-800 dark:text-[#A8C7FA]'}`}
                    placeholder="格式化結果..."
                    value={error ? error : output}
                    onChange={(e) => setOutput(e.target.value)}
                    spellCheck={false}
                />
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center md:justify-start">
        <Button onClick={handleFormat} variant="primary">
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