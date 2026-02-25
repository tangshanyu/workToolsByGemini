import React, { useState } from 'react';
import { TextArea, Input, Button, OutputBox, PageHeader } from '../components/UI';
import { formatSqlText, formatSqlHtml } from '../utils/sqlFormatConfig';

const SqlQuestionMark: React.FC = () => {
  const [sql, setSql] = useState('');
  const [paramsString, setParamsString] = useState('');
  const [output, setOutput] = useState('');
  const [outputHtml, setOutputHtml] = useState('');

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

      // Auto-format using shared config
      try {
        const rawSql = result;
        result = formatSqlText(rawSql);
        const html = formatSqlHtml(rawSql);
        setOutputHtml(html);
      } catch (e) {
        console.warn("Formatting failed, using raw output");
        setOutputHtml('');
      }

      setOutput(result);
    } catch (error: any) {
      alert("參數解析錯誤：" + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SQL 問號轉換"
        icon="❓"
        description={
          <span>
            輸入包含問號 (?) 的 SQL 語句，並提供對應的參數陣列。
            <br />
            <span className="text-gray-400 text-xs mt-1 block">參數範例：<code className="bg-gray-100 dark:bg-black/30 px-1 py-0.5 rounded">[15761, 02, BCTOM0001, 2024/06/04]</code></span>
          </span>
        }
      />

      <div className="p-5 rounded-xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl dark:bg-[#1E1E1E] dark:backdrop-blur-none dark:border-[#333] dark:shadow-none space-y-4">
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
      </div>

      <Button onClick={handleConvert} variant="danger" className="w-full md:w-auto">
        🚀 轉換並格式化
      </Button>

      <OutputBox title="✨ 轉換後的 SQL" content={outputHtml || output} isHtml={!!outputHtml} />
    </div>
  );
};

export default SqlQuestionMark;