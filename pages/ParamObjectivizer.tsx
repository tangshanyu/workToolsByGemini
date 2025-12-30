import React, { useState } from 'react';
import { TextArea, Input, Button, OutputBox } from '../components/UI';

const ParamObjectivizer: React.FC = () => {
  const [input, setInput] = useState('');
  const [includeAfterCall, setIncludeAfterCall] = useState(false);
  const [afterCallFn, setAfterCallFn] = useState('');
  const [output, setOutput] = useState('');

  const parseParams = () => {
    try {
      if (!input.trim()) return alert("請輸入代碼");

      let cleaned = input.replace(/var\s+params\s*=\s*/i, '').trim();
      cleaned = cleaned.replace(/^["']|["'];?$/g, '');

      let url = "/dal/dal11032/process"; // Default
      const urlMatch = cleaned.match(/url:\s*["']([^"']+)['"]/);
      if (urlMatch) {
        url = urlMatch[1];
      }

      const paramObj: Record<string, string> = {};
      const parts = cleaned.split(/"\s*\+\s*"|\+\s*"/g);

      parts.forEach(part => {
        part = part.trim().replace(/^["']|["']$/g, '');
        if (part.includes('=')) {
          // Find things like key=value
          const matches = part.match(/([^&=]+)=([^&]*)/g);
          if (matches) {
            matches.forEach(match => {
                const [k, ...vParts] = match.split('=');
                let val = vParts.join('=');
                if (k) {
                    const cleanKey = k.replace(/^&/, '').trim();
                    let cleanValue = val.trim();

                    // Check if it corresponds to a jQuery selector in the original input string
                    // This logic from original code is a bit specific but we try to preserve the intent: 
                    // finding dynamic values concatenated to the string
                    // NOTE: The logic here is simplified compared to full AST parsing
                    
                    // Basic heuristic: if the value is empty, it might be a concatenated variable in the original code.
                    // However, we are parsing the *string content parts*.
                    // The original code tried to match back against the raw input to find the concatenated var.
                    
                    const escapedKey = cleanKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const jqueryMatch = input.match(new RegExp(`["']${escapedKey}=["']\\s*\\+\s*([^"'+]+)`, 'i')) || 
                                        input.match(new RegExp(`["']${escapedKey}["']\\s*\\+\s*([^"'+]+)`, 'i')); // loose match

                    if (jqueryMatch) {
                        cleanValue = jqueryMatch[1].trim();
                    }
                    
                    paramObj[cleanKey] = cleanValue;
                }
            });
          }
        }
      });

      // Format Output
      const finalObj = {
        progId: "AMDAL11032",
        progAction: "process",
        ...paramObj
      };

      const lines = [
        `var url = "${url}";`,
        "var paramObj = {"
      ];

      const entries = Object.entries(finalObj);
      entries.forEach(([key, value], idx) => {
        const isLast = idx === entries.length - 1;
        const comma = isLast ? '' : ',';
        
        let fmtValue = value;
        // Basic heuristic for literals vs variables/expressions
        const isExpression = value.includes('(') || value.includes('$') || !isNaN(Number(value));
        if (!isExpression && value !== '') {
            fmtValue = `"${value}"`;
        }

        lines.push(`    "${key}": ${fmtValue}${comma}`);
      });

      lines.push("};");

      const popupArgs = [`winSize: "L"`, `url: url`, `params: paramObj`];
      if (includeAfterCall && afterCallFn) {
        popupArgs.push(`aftercall: ${afterCallFn}`);
      }

      lines.push(`amPopUpWindowPost({${popupArgs.join(', ')}});`);

      setOutput(lines.join('\n'));

    } catch (e: any) {
      alert("解析錯誤: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg text-purple-200 text-sm">
        <strong>✨ 使用說明：</strong> 將舊式的字串拼接參數轉換為現代的 Object 格式。
      </div>

      <TextArea 
        label="📝 原始參數代碼："
        rows={10}
        placeholder={`var params = "criteria.wrtoffTxSn=" + $("#finSlnClsPosTxSn").val() + ...`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="glass-panel p-4 rounded-lg flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={includeAfterCall}
            onChange={(e) => setIncludeAfterCall(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 accent-purple-500"
          />
          <span>🔧 包含 aftercall</span>
        </label>
        
        {includeAfterCall && (
          <Input 
            placeholder="函數名稱 (例如: myCallback)"
            value={afterCallFn}
            onChange={(e) => setAfterCallFn(e.target.value)}
            className="max-w-[250px]"
          />
        )}
      </div>

      <div className="flex gap-4">
        <Button onClick={parseParams} variant="primary" className="flex-1">🚀 轉換</Button>
        <Button onClick={() => { setInput(''); setOutput(''); }} variant="secondary">🗑️ 清空</Button>
      </div>

      <OutputBox title="✨ 轉換後代碼" content={output} />
    </div>
  );
};

export default ParamObjectivizer;