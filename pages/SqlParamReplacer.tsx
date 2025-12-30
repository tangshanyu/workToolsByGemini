import React, { useState } from 'react';
import { TextArea, Button, Input, OutputBox } from '../components/UI';

const SqlParamReplacer: React.FC = () => {
  const [sql, setSql] = useState('');
  const [params, setParams] = useState<string[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');

  const extractParams = () => {
    // Match 'Parm1', 'Parm2', etc.
    const matches = sql.match(/'Parm\d+'/g);
    if (!matches) {
      setParams([]);
      alert("未找到 'ParmX' 格式的參數");
      return;
    }
    const uniqueParams = Array.from(new Set(matches));
    setParams(uniqueParams.sort());
    
    // Initialize values map
    const initialValues: Record<string, string> = {};
    uniqueParams.forEach((p: string) => initialValues[p] = '');
    setParamValues(initialValues);
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

    params.forEach(param => {
      const val = paramValues[param];
      if (val !== undefined && val !== '') {
        const escapedValue = val.replace(/'/g, "''");
        result = result.split(param).join(`'${escapedValue}'`);
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
        <strong>✨ 使用說明：</strong> 輸入包含 <code>'Parm1'</code>, <code>'Parm2'</code> 等參數的 SQL 語句，點擊「🔍 掃描參數」，填入值後執行替換。
      </div>

      <TextArea 
        label="📝 輸入 SQL："
        placeholder="SELECT * FROM Table WHERE ID = 'Parm1' AND Date = 'Parm2'..."
        value={sql}
        onChange={(e) => setSql(e.target.value)}
      />

      <Button onClick={extractParams} className="w-full md:w-auto">🔍 掃描參數</Button>

      {params.length > 0 && (
        <div className="std-panel p-6 rounded-xl border-t-4 border-blue-500">
            <h3 className="font-bold mb-4 text-lg text-gray-800 dark:text-[#E8EAED]">⚙️ 參數輸入</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {params.map(param => (
                    <div key={param} className="flex flex-col gap-1">
                        <label className="text-sm text-gray-500 dark:text-[#9AA0A6] font-mono">{param}</label>
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