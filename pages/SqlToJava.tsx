import React, { useState } from 'react';
import { TextArea, Button, OutputBox } from '../components/UI';

// Mock Test SQL
const TEST_SQL = `SELECT CB_DTA.CONTR_NO, CB_DTA.SELL_DEAL_ACC_DATE, CB_DTA.SELL_VLU_ACC_DATE, CB_DTA.SELL_SETT_ACC_DATE, CB_DTA.STCURR, CB_DTA.FIN_ASET_CTG_OPT_CTG, CB_DTA.FIN_ASET_CTG, CB_DTA.ACC_CTG, e.ACC_BASE, e.EVCURR, e.BIZ_CTG_1, f.TAX_FREE_MARK, e.BSCURR_FEXG_TYP, e.FEXG_TYP, e.NO_DIRRATE_YN_USE_CROSSRATE, t.CURR_DCML_LSD, SUM(CB_DTA.SELL_COST) AS TOT_SELL_COST, SUM(CB_DTA.SELL_DEAL_AMT) AS TOT_SELL_DEAL_AMT, SUM(CB_DTA.SELL_SETT_AMT) AS TOT_SELL_SETT_AMT FROM ( SELECT '1202-3000' AS ACC_PRD_COMB, ad.CONTR_NO, ad.ACC_CTG, ad.SELL_DEAL_DATE, ad.SELL_DEAL_ACC_DATE, ad.SELL_SETT_DATE, ad.SELL_SETT_ACC_DATE, ad.SELL_VLU_DATE, ad.SELL_VLU_ACC_DATE, ad.STCURR, ad.FIN_ASET_CTG_OPT_CTG, ad.FIN_ASET_CTG FROM AM_TX_SELL_CB ad WHERE ad.CONTR_NO IN ('Parm1') AND ad.FIN_ASET_CTG = '01' ) CB_DTA JOIN AM_C_MST e ON CB_DTA.CONTR_NO = e.CONTR_NO JOIN AM_C_SUB_CB f ON e.CONTR_NO = f.CONTR_NO JOIN COMM_CURR t ON t.CURR_CDE = e.EVCURR GROUP BY CB_DTA.CONTR_NO, CB_DTA.FIN_ASET_CTG_OPT_CTG ORDER BY CB_DTA.CONTR_NO, CB_DTA.FIN_ASET_CTG_OPT_CTG`;

const SqlToJava: React.FC = () => {
  const [inputSql, setInputSql] = useState('');
  const [formattedHtml, setFormattedHtml] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [sbAppendOutput, setSbAppendOutput] = useState('');
  const [hibernateOutput, setHibernateOutput] = useState('');
  
  const [options, setOptions] = useState({
    formatMethod: 'local' as 'local' | 'iframe' | 'manual',
    camelCaseAs: false,
    generateHibernate: true
  });

  const handleFormatSql = async () => {
    if (!inputSql.trim()) {
        alert('請先輸入 SQL 語句');
        return '';
    }

    let resultHtml = '';
    let resultText = inputSql;

    if (options.formatMethod === 'local') {
      try {
        // Priority 1: Check for the internal library exposed by the new poorsql.js
        if (typeof window.PoorMansTSqlFormatterLib !== 'undefined') {
            const result = window.PoorMansTSqlFormatterLib.formatSql(inputSql, {
                indent: "    ",
                spacesPerTab: 4,
                maxLineWidth: 999,
                includeHtml: true,
                coloring: true
            });
            resultText = result.text;
            resultHtml = result.html;
        } 
        // Priority 2: Check for the legacy global wrapper (PoorSQL) with full format support
        else if (typeof window.PoorSQL !== 'undefined' && window.PoorSQL.formatFull) {
            const result = window.PoorSQL.formatFull(inputSql, {
                indent: "    ",
                spacesPerTab: 4,
                maxLineWidth: 999,
                includeHtml: true,
                coloring: true
            });
            resultText = result.text;
            resultHtml = result.html;
        }
        else if (typeof window.PoorSQL !== 'undefined' && window.PoorSQL.format) {
             // Fallback to text only
             resultText = window.PoorSQL.format(inputSql);
             resultHtml = ''; // No HTML available
        } else {
          console.warn('PoorSQL library not found, using raw SQL');
        }
      } catch (e) {
        console.error('Formatting failed', e);
        // Fallback to raw SQL on error
        resultText = inputSql;
        resultHtml = '';
      }
    } else {
        // Manual mode
        resultText = inputSql;
        resultHtml = '';
    }

    setFormattedText(resultText);
    setFormattedHtml(resultHtml);
    return resultText;
  };

  const toCamelCase = (str: string) => {
    return str.toLowerCase().split('_').map((word, index) => {
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('');
  };

  const processSqlAliases = (sql: string) => {
    const selectClauseRegex = /(\bSELECT\b)([\s\S]+?)(\bFROM\b)/i;
    const match = sql.match(selectClauseRegex);
    
    if (!match) return sql;
    
    const fieldsString = match[2];
    // This is a naive implementation
    const processedFields = fieldsString.split(',').map(field => {
      const trimmedField = field.trim();
      // Skip if already has alias or is complex/function without clear column name
      if (trimmedField.toUpperCase().includes(' AS ') || !trimmedField.includes('.')) return field;
      
      const parts = trimmedField.split('.');
      const columnName = parts[parts.length - 1];
      
      if (columnName.includes('_')) {
        const alias = toCamelCase(columnName);
        return field.replace(trimmedField, `${trimmedField} AS ${alias}`);
      }
      return field;
    }).join(',');
    
    return sql.replace(fieldsString, processedFields);
  };

  const generateJavaCode = (sql: string) => {
    if (!sql) return;

    // 1. Process CamelCase Alias if needed
    const processedSql = options.camelCaseAs ? processSqlAliases(sql) : sql;

    // 2. Generate sb.append
    const lines = processedSql.split('\n').map(line => {
      if (!line.trim()) return null;
      // Escape quotes
      const escapedCode = line.replace(/"/g, '\\"').trim(); // preserve trailing spaces for safety
      
      // Preserve original indentation for readability in Java code
      // We grab the whitespace at the start of the line
      const originalIndentMatch = line.match(/^(\s*)/);
      const originalIndent = originalIndentMatch ? originalIndentMatch[1] : "";
      
      const trimmedCode = line.trim();
      
      return `sb.append(" ${originalIndent}${trimmedCode} ");`;
    }).filter(Boolean);
    
    setSbAppendOutput(lines.join('\n'));

    // 3. Generate HibernateScalarHelper
    if (options.generateHibernate) {
      try {
        const selectMatch = processedSql.match(/\bSELECT\s+([\s\S]+?)(?:\s+FROM\b|\s+INTO\b|\s*$)/i);
        if (selectMatch) {
          const fields = selectMatch[1].split(',').map(f => {
            const cleanField = f.replace(/--.*$/, '').trim(); // remove comments
            const asMatch = cleanField.match(/\s+AS\s+(\w+)/i);
            if (asMatch) return asMatch[1];
            
            // Extract raw column name if no alias
            let fieldName = cleanField.includes('.') ? cleanField.split('.').pop() || '' : cleanField;
            // Remove function wrappers usually leaving the core name - crude heuristic
            fieldName = fieldName.replace(/[^\w]/g, ''); 
            return fieldName;
          }).filter(Boolean);

          const helperCode = fields.map(f => 
            `scalarList.add(new HibernateScalarHelper("${f}", StandardBasicTypes.STRING));`
          ).join('\n');
          
          setHibernateOutput(`List<HibernateScalarHelper> scalarList = new ArrayList<>();\n${helperCode}`);
        } else {
          setHibernateOutput('無法提取 SELECT 欄位');
        }
      } catch (e) {
        setHibernateOutput('產生 Hibernate Helper 時發生錯誤');
      }
    } else {
      setHibernateOutput('');
    }
  };

  const handleExecuteAll = async () => {
    const formatted = await handleFormatSql();
    if (formatted) {
      generateJavaCode(formatted);
    }
  };

  const handleClear = () => {
    setInputSql('');
    setFormattedText('');
    setFormattedHtml('');
    setSbAppendOutput('');
    setHibernateOutput('');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-gray-200">原始 SQL 輸入</h2>
          <Button variant="secondary" onClick={() => setInputSql(TEST_SQL)} className="text-xs py-1 px-3">
            🧪 載入測試資料
          </Button>
        </div>
        <TextArea 
          value={inputSql}
          onChange={(e) => setInputSql(e.target.value)}
          placeholder="請在此輸入您的原始 SQL 語句..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-4 text-blue-300">🎯 格式化選項</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="formatMethod" 
                checked={options.formatMethod === 'local'}
                onChange={() => setOptions({...options, formatMethod: 'local'})}
                className="accent-blue-500 w-5 h-5"
              />
              <div className="group-hover:text-blue-300 transition-colors">
                <p className="font-medium">🗂️ 本地 Poor SQL (完整版)</p>
                <p className="text-xs text-gray-500">支援語法高亮與格式化</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="formatMethod" 
                checked={options.formatMethod === 'manual'}
                onChange={() => setOptions({...options, formatMethod: 'manual'})}
                className="accent-blue-500 w-5 h-5"
              />
              <div className="group-hover:text-blue-300 transition-colors">
                <p className="font-medium">✋ 手動輸入</p>
                <p className="text-xs text-gray-500">不進行自動格式化</p>
              </div>
            </label>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-4 text-green-300">⚙️ 轉換選項</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={options.camelCaseAs}
                onChange={(e) => setOptions({...options, camelCaseAs: e.target.checked})}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 accent-green-500"
              />
              <span>🐪 SELECT 欄位使用駝峰命名 AS 別名</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={options.generateHibernate}
                onChange={(e) => setOptions({...options, generateHibernate: e.target.checked})}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 accent-green-500"
              />
              <span>🏗️ 產生 HibernateScalarHelper</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center md:justify-start">
        <Button onClick={handleExecuteAll} variant="warning" className="w-full md:w-auto">
          ⚡ 執行所有步驟
        </Button>
        <Button onClick={handleFormatSql} variant="success" className="w-full md:w-auto">
          🎨 僅格式化 SQL
        </Button>
        <Button onClick={handleClear} variant="danger" className="w-full md:w-auto">
          🗑️ 清空所有
        </Button>
      </div>

      <div className="border-t border-gray-700/50 pt-8 space-y-6">
        <OutputBox 
            title="格式化後 SQL (Poor SQL)" 
            content={formattedHtml || formattedText} 
            isHtml={!!formattedHtml}
        />
        <OutputBox title="sb.append() 結果" content={sbAppendOutput} placeholder="執行後顯示 Java 代碼" />
        {options.generateHibernate && (
          <OutputBox title="HibernateScalarHelper" content={hibernateOutput} placeholder="執行後顯示 Helper 代碼" />
        )}
      </div>
    </div>
  );
};

export default SqlToJava;