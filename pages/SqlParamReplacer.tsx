import React, { useState } from 'react';
import { TextArea, Button, Input, OutputBox } from '../components/UI';

const SqlParamReplacer: React.FC = () => {
  const [sql, setSql] = useState('');
  const [params, setParams] = useState<string[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');

  const extractParams = () => {
    // Match 'Parm1', 'Parm2', '%Parm1%', 'Parm1%', '%Parm1'
    // Regex explanation:
    // '       : Start quote
    // (%?)    : Optional leading % (Capture group 1 - but we handle extraction manually)
    // Parm\d+ : The parameter name
    // (%?)    : Optional trailing %
    // '       : End quote
    const matches = sql.match(/'%?Parm\d+%?'/g);
    if (!matches) {
      setParams([]);
      alert("未找到 'ParmX' 或 '%ParmX%' 格式的參數");
      return;
    }

    // Extract core param names (e.g., '%Parm1%' -> 'Parm1')
    const uniqueKeys = new Set<string>();
    matches.forEach(match => {
        // Remove quotes and wildcards to get the core variable name
        const coreName = match.replace(/'/g, '').replace(/^%/, '').replace(/%$/, '');
        uniqueKeys.add(coreName);
    });

    const sortedParams = Array.from(uniqueKeys).sort();
    setParams(sortedParams);
    
    // Initialize values map, preserve existing values if key exists
    const newValues: Record<string, string> = {};
    sortedParams.forEach((p: string) => {
        newValues[p] = paramValues[p] || '';
    });
    setParamValues(newValues);
  };

  const handleParamValueChange = (param: string, value: string) => {
    setParamValues(prev => ({ ...prev, [param]: value }));
  };

  const executeReplace = () => {
    let result = sql;
    
    // Check if we have params to replace
    if (params.length === 0) {
        alert("請先掃描參數");
        return;
    }

    params.forEach(key => {
      const val = paramValues[key];
      if (val !== undefined && val !== '') {
        const escapedValue = val.replace(/'/g, "''");
        
        // Create regex to match this specific parameter with potential wildcards
        // matches: 'Parm1', '%Parm1', 'Parm1%', '%Parm1%'
        // Capturing groups: 
        // 1: Leading % (or empty)
        // 2: Trailing % (or empty)
        const regex = new RegExp(`'((?:%)?)${key}((?:%)?)'`, 'g');
        
        // Replace preserving the captured wildcards
        result = result.replace(regex, `'$1${escapedValue}$2'`);
      }
    });

    // Optional: Try to format using PoorSQL if available
    try {
        if (typeof window.PoorSQL !== 'undefined') {
             result = window.PoorSQL.format(result);
        }
    } catch(e) {
        console.warn("Formatting failed, using raw output");
    }

    setOutput(result);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 dark:bg-[#004A77]/20 border border-blue-200 dark:border-[#004A77] p-4 rounded-lg text-blue-800 dark:text-[#C2E7FF] text-sm">
        <strong>✨ 使用說明：</strong> 輸入包含 <code>'Parm1'</code>, <code>'%Parm2%'</code> (模糊搜尋) 等參數的 SQL 語句，點擊「🔍 掃描參數」，填入值後執行替換。
      </div>

      <TextArea 
        label="📝 輸入 SQL："
        placeholder="SELECT * FROM Table WHERE ID = 'Parm1' AND Name LIKE '%Parm2%'..."
        value={sql}
        onChange={(e) => setSql(e.target.value)}
      />

      <Button onClick={extractParams} className="w-full md:w-auto">🔍 掃描參數</Button>

      {params.length > 0 && (
        <div className="std-panel p-5 rounded-xl">
            <h3 className="font-bold mb-4 text-sm text-gray-700 dark:text-[#E8EAED] uppercase tracking-wider flex items-center gap-2">
                ⚙️ 參數輸入
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {params.map(param => (
                    <div key={param} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-[#9AA0A6] font-mono ml-1">{param}</label>
                        <Input 
                            value={paramValues[param]} 
                            onChange={(e) => handleParamValueChange(param, e.target.value)}
                            placeholder={`輸入 ${param} 的值`}
                        />
                    </div>
                ))}
            </div>
        </div>
      )}

      <Button onClick={executeReplace} variant="primary" disabled={params.length === 0} className="w-full md:w-auto">
        🚀 執行替換
      </Button>

      <OutputBox title="✨ 最終 SQL" content={output} />
    </div>
  );
};

export default SqlParamReplacer;