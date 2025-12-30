import React, { useState, useEffect } from 'react';
import { TextArea, Button, OutputBox } from '../components/UI';

// Mock Test SQL
const TEST_SQL = `SELECT CB_DTA.CONTR_NO, CB_DTA.SELL_DEAL_ACC_DATE, CB_DTA.SELL_VLU_ACC_DATE, CB_DTA.SELL_SETT_ACC_DATE, CB_DTA.STCURR, CB_DTA.FIN_ASET_CTG_OPT_CTG, CB_DTA.FIN_ASET_CTG, CB_DTA.ACC_CTG, e.ACC_BASE, e.EVCURR, e.BIZ_CTG_1, f.TAX_FREE_MARK, e.BSCURR_FEXG_TYP, e.FEXG_TYP, e.NO_DIRRATE_YN_USE_CROSSRATE, t.CURR_DCML_LSD, SUM(CB_DTA.SELL_COST) AS TOT_SELL_COST, SUM(CB_DTA.SELL_DEAL_AMT) AS TOT_SELL_DEAL_AMT, SUM(CB_DTA.SELL_SETT_AMT) AS TOT_SELL_SETT_AMT FROM ( SELECT '1202-3000' AS ACC_PRD_COMB, ad.CONTR_NO, ad.ACC_CTG, ad.SELL_DEAL_DATE, ad.SELL_DEAL_ACC_DATE, ad.SELL_SETT_DATE, ad.SELL_SETT_ACC_DATE, ad.SELL_VLU_DATE, ad.SELL_VLU_ACC_DATE, ad.STCURR, ad.FIN_ASET_CTG_OPT_CTG, ad.FIN_ASET_CTG FROM AM_TX_SELL_CB ad WHERE ad.CONTR_NO IN ('Parm1') AND ad.FIN_ASET_CTG = '01' ) CB_DTA JOIN AM_C_MST e ON CB_DTA.CONTR_NO = e.CONTR_NO JOIN AM_C_SUB_CB f ON e.CONTR_NO = f.CONTR_NO JOIN COMM_CURR t ON t.CURR_CDE = e.EVCURR GROUP BY CB_DTA.CONTR_NO, CB_DTA.FIN_ASET_CTG_OPT_CTG ORDER BY CB_DTA.CONTR_NO, CB_DTA.FIN_ASET_CTG_OPT_CTG`;

const SqlToJava: React.FC = () => {
  const [inputSql, setInputSql] = useState('');
  const [formattedHtml, setFormattedHtml] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [sbAppendOutput, setSbAppendOutput] = useState('');
  const [hibernateOutput, setHibernateOutput] = useState('');
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  
  const [options, setOptions] = useState({
    formatMethod: 'poorsql' as 'poorsql' | 'manual',
    camelCaseAs: false,
    generateHibernate: true
  });

  // Check for library availability on mount and periodically
  useEffect(() => {
    const checkLibrary = () => {
        if (typeof window.PoorSQL !== 'undefined') {
            setIsLibraryLoaded(true);
            return true;
        }
        return false;
    };

    if (checkLibrary()) return;

    // Aggressive polling for the first few seconds
    const interval = setInterval(() => {
        if (checkLibrary()) {
            clearInterval(interval);
        }
    }, 200); 

    // Stop checking after 10 seconds to save resources
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, []);

  const handleFormatSql = async () => {
    if (!inputSql.trim()) {
        alert('請先輸入 SQL 語句');
        return '';
    }

    let resultHtml = '';
    let resultText = inputSql;

    try {
      if (options.formatMethod === 'poorsql') {
        if (isLibraryLoaded && window.PoorSQL) {
          const formattingOptions = {
            indent: "    ",
            spacesPerTab: 4,
            maxLineWidth: 999,
            includeHtml: false, // Standard version usually returns text
            coloring: false
          };
          
          // Using standard format method which returns string
          if (window.PoorSQL.format) {
             resultText = window.PoorSQL.format(inputSql, formattingOptions);
             // Standard poorsql.js doesn't give HTML structure easily in the browser build unless using specific full formatter
             resultHtml = ''; 
          }
        } else {
          console.warn('PoorSQL library not loaded yet or failed to load. Falling back to raw text.');
          alert("PoorSQL 格式化庫尚未載入，請檢查 public/poorsql.js 檔案是否存在。");
          // Fallback simple format if possible or just use raw
          resultText = inputSql;
          resultHtml = '';
        }
      } else {
          // Manual mode
          resultText = inputSql;
          resultHtml = '';
      }
    } catch (e) {
      console.error('Formatting failed', e);
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
    const processedFields = fieldsString.split(',').map(field => {
      const trimmedField = field.trim();
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
      const escapedCode = line.replace(/"/g, '\\"').trim(); 
      
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
            
            let fieldName = cleanField.includes('.') ? cleanField.split('.').pop() || '' : cleanField;
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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-bold text-gray-700 dark:text-white">原始 SQL 輸入</h2>
          <Button variant="ghost" onClick={() => setInputSql(TEST_SQL)} className="text-xs py-1 px-3">
            🧪 載入測試資料
          </Button>
        </div>
        <div className="min-h-[200px]">
             <TextArea 
              value={inputSql}
              onChange={(e) => setInputSql(e.target.value)}
              placeholder="請在此輸入您的原始 SQL 語句..."
              className="h-full"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl p-5 bg-white dark:bg-[#161618] border border-gray-200 dark:border-[#3c4043]">
          <h3 className="text-base font-bold mb-3 text-blue-600 dark:text-[#A8C7FA]">🎯 格式化選項</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group p-2 rounded hover:bg-gray-50 dark:hover:bg-[#2D2E31] transition-colors">
              <input 
                type="radio" 
                name="formatMethod" 
                checked={options.formatMethod === 'poorsql'}
                onChange={() => setOptions({...options, formatMethod: 'poorsql'})}
                className="accent-blue-600 dark:accent-[#A8C7FA] w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-800 dark:text-white">✨ PoorSQL 格式化</p>
                    {!isLibraryLoaded && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            載入中...
                        </span>
                    )}
                    {isLibraryLoaded && (
                        <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-1.5 py-0.5 rounded">
                            就緒
                        </span>
                    )}
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group p-2 rounded hover:bg-gray-50 dark:hover:bg-[#2D2E31] transition-colors">
              <input 
                type="radio" 
                name="formatMethod" 
                checked={options.formatMethod === 'manual'}
                onChange={() => setOptions({...options, formatMethod: 'manual'})}
                className="accent-blue-600 dark:accent-[#A8C7FA] w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800 dark:text-white">✋ 手動輸入</p>
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-xl p-5 bg-white dark:bg-[#161618] border border-gray-200 dark:border-[#3c4043]">
          <h3 className="text-base font-bold mb-3 text-purple-600 dark:text-[#D0BCFF]">⚙️ 轉換選項</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none p-2 rounded hover:bg-gray-50 dark:hover:bg-[#2D2E31] transition-colors">
              <input 
                type="checkbox" 
                checked={options.camelCaseAs}
                onChange={(e) => setOptions({...options, camelCaseAs: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 dark:border-[#444746] bg-transparent"
              />
              <span className="text-sm text-gray-800 dark:text-white">🐫 SELECT 欄位使用駝峰命名 AS 別名</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none p-2 rounded hover:bg-gray-50 dark:hover:bg-[#2D2E31] transition-colors">
              <input 
                type="checkbox" 
                checked={options.generateHibernate}
                onChange={(e) => setOptions({...options, generateHibernate: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 dark:border-[#444746] bg-transparent"
              />
              <span className="text-sm text-gray-800 dark:text-white">🏗️ 產生 HibernateScalarHelper</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap pt-4">
        <Button onClick={handleExecuteAll} variant="primary">
          ⚡ 執行所有步驟
        </Button>
        <Button onClick={handleFormatSql} variant="secondary">
          🎨 僅格式化 SQL
        </Button>
        <Button onClick={handleClear} variant="danger">
          🗑️ 清空所有
        </Button>
      </div>

      <div className="border-t border-gray-200 dark:border-[#444746] pt-8 space-y-8">
        <OutputBox 
            title="格式化後 SQL" 
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