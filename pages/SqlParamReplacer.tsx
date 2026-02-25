import React, { useState } from 'react';
import { TextArea, Button, Input, OutputBox, PageHeader } from '../components/UI';
import { formatSqlText, formatSqlHtml } from '../utils/sqlFormatConfig';

const SqlParamReplacer: React.FC = () => {
  const [sql, setSql] = useState('');
  const [params, setParams] = useState<string[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [outputHtml, setOutputHtml] = useState('');

  const extractParams = () => {
    // Match 'Parm1', 'Parm2', '%Parm1%', 'Parm1%', '%Parm1'
    const matches = sql.match(/'%?Parm\d+%?'/g);
    if (!matches) {
      setParams([]);
      alert("未找到 'ParmX' 或 '%ParmX%' 格式的參數");
      return;
    }

    // Extract core param names
    const uniqueKeys = new Set<string>();
    matches.forEach(match => {
      const coreName = match.replace(/'/g, '').replace(/^%/, '').replace(/%$/, '');
      uniqueKeys.add(coreName);
    });

    const sortedParams = Array.from(uniqueKeys).sort();
    setParams(sortedParams);

    // Initialize values map
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

    if (params.length === 0) {
      alert("請先掃描參數");
      return;
    }

    params.forEach(key => {
      const val = paramValues[key];
      if (val !== undefined && val !== '') {
        const escapedValue = val.replace(/'/g, "''");
        const regex = new RegExp(`'((?:%)?)${key}((?:%)?)'`, 'g');
        result = result.replace(regex, `'$1${escapedValue}$2'`);
      }
    });

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
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SQL 參數替換"
        icon="🔧"
        description={
          <span>
            輸入包含 <code>'Parm1'</code>, <code>'%Parm2%'</code> (模糊搜尋) 等參數的 SQL 語句，點擊「🔍 掃描參數」，填入值後執行替換。
          </span>
        }
      />

      <TextArea
        label="📝 輸入 SQL："
        placeholder="SELECT * FROM Table WHERE ID = 'Parm1' AND Name LIKE '%Parm2%'..."
        value={sql}
        onChange={(e) => setSql(e.target.value)}
      />

      <Button onClick={extractParams} className="w-full md:w-auto">🔍 掃描參數</Button>

      {params.length > 0 && (
        <div className="p-5 rounded-xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl dark:bg-[#1E1E1E] dark:backdrop-blur-none dark:border-[#333] dark:shadow-none">
          <h3 className="font-bold mb-4 text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            ⚙️ 參數輸入
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {params.map(param => (
              <div key={param} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 font-mono ml-1">{param}</label>
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

      <OutputBox title="✨ 最終 SQL" content={outputHtml || output} isHtml={!!outputHtml} />
    </div>
  );
};

export default SqlParamReplacer;