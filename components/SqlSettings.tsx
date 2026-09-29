import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SQL_FORMAT_OPTIONS, type SqlFormatOptions } from '../utils/sqlOptions';
import { useSqlColors } from '../hooks/SqlColorsContext';
import { DEFAULT_WORD_COLORS } from '../utils/wordColors';
import { WordColorSettings } from './WordColorSettings';
export function SqlSettings({ options, onChange }: { options: SqlFormatOptions; onChange: (value: SqlFormatOptions) => void }) {
  const { setColors } = useSqlColors();
  const booleans: { key: keyof SqlFormatOptions; label: string; description: string }[] = [
    { key: 'uppercaseKeywords', label: '關鍵字大寫', description: 'SELECT、FROM、WHERE' },
    { key: 'expandCommaLists', label: '欄位各自一行', description: '展開 SELECT 與 GROUP BY' },
    { key: 'trailingCommas', label: '逗號放在行尾', description: '關閉時採用逗號前置' },
    { key: 'expandBooleanExpressions', label: '展開 AND / OR', description: '讓條件更容易閱讀' },
    { key: 'expandCaseStatements', label: '展開 CASE', description: '分行顯示 WHEN / THEN' },
    { key: 'expandInLists', label: '展開 IN 清單', description: '每個值獨立一行' },
    { key: 'expandBetweenConditions', label: '展開 BETWEEN', description: '範圍條件分行顯示' },
    { key: 'breakJoinOnSections', label: 'JOIN 的 ON 換行', description: '將連接條件獨立顯示' },
  ];
  return <section className="sql-settings" aria-label="PoorSQL 格式設定"><div className="settings-heading"><h2><SlidersHorizontal size={18} />格式設定</h2><button className="text-button" onClick={() => { onChange({ ...SQL_FORMAT_OPTIONS }); setColors({ ...DEFAULT_WORD_COLORS }); }}><RotateCcw size={14} />還原預設</button></div>
    <div className="settings-selects"><label>縮排<select value={options.indent === '\t' ? 'tab' : options.indent.length} onChange={event => onChange({ ...options, indent: event.target.value === 'tab' ? '\t' : ' '.repeat(Number(event.target.value)), spacesPerTab: event.target.value === '2' ? 2 : 4 })}><option value="2">2 個空格</option><option value="4">4 個空格</option><option value="tab">Tab</option></select></label>
      <label>每行寬度<select value={options.maxLineWidth} onChange={event => onChange({ ...options, maxLineWidth: Number(event.target.value) })}><option value={80}>80 字元</option><option value={120}>120 字元</option><option value={160}>160 字元</option><option value={999}>不主動折行</option></select></label></div>
    <div className="settings-switches">{booleans.map(({ key, label, description }) => <label className="switch-row" key={key}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={Boolean(options[key])} onChange={event => onChange({ ...options, [key]: event.target.checked })} className="md-switch" /></label>)}</div>
    <p className="settings-note">更改後按「格式化」套用。設定會自動保存，SQL 內容只留在目前頁面。</p>
    <WordColorSettings />
  </section>;
}
