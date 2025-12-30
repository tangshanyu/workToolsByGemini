import React, { useState } from 'react';
import { TextArea, Input, Button, OutputBox } from '../components/UI';

const SqlQuestionMark: React.FC = () => {
  const [sql, setSql] = useState('');
  const [paramsString, setParamsString] = useState('');
  const [output, setOutput] = useState('');

  const handleConvert = () => {
    if (!sql.trim()) return alert("請輸入 SQL 語句");
    if (!paramsString.trim()) return alert("請輸入參數");

    try {
      // Parse array format: [val1, val2, ...]
      const match = paramsString.match(/\[(.*)\]/);
      if (!match) {
        throw new Error("參數格式錯誤，請使用 [param1, param2] 格式");
      }

      // Split by comma, careful with commas inside quotes if needed (simple split for now based on prompt logic)
      const params = match[1].split(',').map(p => p.trim());
      
      const questionMarksCount = (sql.match(/\?/g) || []).length;

      if (params.length !== questionMarksCount) {
        alert(`參數數量不匹配：SQL 中有 ${questionMarksCount} 個問號，但提供了 ${params.length} 個參數`);
        return;
      }

      let result = sql;
      // Replace sequentially
      params.forEach(param => {
        // Handle basic types logic if needed, currently treating all as strings wrapped in single quotes per prompt behavior
        result = result.replace(/\?/, `'${param}'`);
      });

      setOutput(result);
    } catch (error: any) {
      alert("參數解析錯誤：" + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg text-green-200 text-sm">
        <strong>✨ 使用說明：</strong> 輸入包含問號 (?) 的 SQL 語句，並提供對應的參數陣列。
        <div className="mt-2 p-2 bg-black/20 rounded font-mono text-xs">
          參數範例：[15761, 02, BCTOM0001, 2024/06/04]
        </div>
      </div>

      <TextArea 
        label="📝 原始 SQL（含 ?）："
        placeholder="SELECT * FROM Users WHERE ID = ? AND Role = ? ..."
        value={sql}
        onChange={(e) => setSql(e.target.value)}
      />

      <Input 
        label="⚙️ 參數陣列："
        placeholder="[參數1, 參數2, ...]"
        value={paramsString}
        onChange={(e) => setParamsString(e.target.value)}
      />

      <Button onClick={handleConvert} variant="danger" className="w-full md:w-auto">
        🚀 轉換
      </Button>

      <OutputBox title="✨ 轉換後的 SQL" content={output} />
    </div>
  );
};

export default SqlQuestionMark;