import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Braces, Eraser, FileCode2, Play, ShieldCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { Button, OutputBox, TextArea } from '../components/UI';
import { SqlFeedback, SqlStatus } from '../components/SqlFeedback';
import { SqlSettings } from '../components/SqlSettings';
import { useSqlFormatter } from '../hooks/useSqlFormatter';

export const SAMPLE_SQL = `-- 整理客戶的交易摘要\nselect c.CUSTOMER_ID, c.CUSTOMER_NAME, sum(t.AMOUNT) as TOTAL_AMOUNT, case when sum(t.AMOUNT) >= 10000 then 'VIP' else '一般' end as CUSTOMER_LEVEL from CUSTOMERS c left join TRANSACTIONS t on c.CUSTOMER_ID = t.CUSTOMER_ID where t.STATUS = 'COMPLETED' and t.CURRENCY in ('TWD', 'USD', 'JPY') group by c.CUSTOMER_ID, c.CUSTOMER_NAME having sum(t.AMOUNT) > 0 order by TOTAL_AMOUNT desc;`;

export default function SqlFormatter() {
  const [input, setInput] = useState('');
  const [formattedSource, setFormattedSource] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const formatter = useSqlFormatter();
  const execute = async () => { const source = input; const result = await formatter.run(source); if (result) setFormattedSource(source); };
  return <div onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); if (!formatter.busy) void execute(); } }}>
    <div className="formatter-intro"><div><div className="hero-eyebrow">A LITTLE ORDER. A BETTER FLOW.</div><h1>讓 SQL，<span>井然有序。</span></h1><p>貼上語句，交給 PoorSQL 整理。把注意力留給真正重要的邏輯。</p></div><span className="intro-badge"><Sparkles size={16} />你的 SQL 整理桌</span></div>
    <div className="format-control-bar"><div className="format-control-start"><SqlStatus status={formatter.status} busy={formatter.busy} /><div className="format-summary"><span>{formatter.options.indent === '\t' ? 'Tab' : formatter.options.indent.length + ' 格縮排'}</span><span>{formatter.options.trailingCommas ? '逗號後置' : '逗號前置'}</span><span>{formatter.options.uppercaseKeywords ? '關鍵字大寫' : '保留大小寫'}</span></div></div>
      <div className="format-control-end"><Button variant="ghost" disabled={formatter.busy} onClick={() => { formatter.clear(); setInput(SAMPLE_SQL); setFormattedSource(''); }}><FileCode2 size={16} />載入範例</Button><Button variant="secondary" aria-expanded={settingsOpen} aria-controls="format-settings" onClick={() => setSettingsOpen(!settingsOpen)}><SlidersHorizontal size={16} />格式設定</Button><Button className="format-button" disabled={formatter.busy || !input.trim()} onClick={execute}><Play size={16} fill="currentColor" />{formatter.busy ? '正在整理…' : '格式化 SQL'}<kbd>Ctrl ↵</kbd></Button></div>
    </div>
    {settingsOpen && <div id="format-settings"><SqlSettings options={formatter.options} onChange={formatter.setOptions} /></div>}
    <SqlFeedback error={formatter.error} warning={formatter.result?.errorFound} />
    <div className="format-grid">
      <section className="input-panel" aria-label="原始 SQL"><div className="editor-heading"><h2><Braces size={17} />原始 SQL</h2><span className="editor-badge">INPUT</span></div><div className="input-tools"><span className="editor-hint">貼上你的 SQL，或先試試範例</span><button className="text-button" disabled={formatter.busy || !input} onClick={() => { setInput(''); setFormattedSource(''); formatter.clear(); }}><Eraser size={14} />清空</button></div>
        <TextArea aria-label="原始 SQL 輸入" placeholder={'SELECT …\nFROM …\nWHERE …\n\n在這裡開始整理你的 SQL。'} value={input} onChange={event => setInput(event.target.value)} />
        <div className="input-footnote"><span>{input ? input.split('\n').length : 0} 行 · {input.length.toLocaleString()} 字元</span><span>SQL Server / T-SQL 格式化</span></div>
      </section>
      <OutputBox title="格式化結果" content={formatter.result?.html || formatter.result?.text || ''} plainText={formatter.result?.text || ''} isHtml={!!formatter.result?.html} onTextChange={formatter.editResult} meta={formatter.result && formattedSource !== input ? <span className="chip">輸入已變更</span> : undefined} placeholder="按下格式化，查看著色與整齊的排版。" />
    </div>
    <div className="format-action-row"><div className="local-note"><ShieldCheck size={15} />本機處理，不上傳 SQL 內容</div>{formatter.busy && <Button variant="secondary" onClick={formatter.cancel}><X size={16} />取消</Button>}</div>
    <div className="workflow-tip"><FileCode2 size={16} /><span>接著產生程式碼？<Link to="/sql-to-java">開啟 SQL 轉 Java <ArrowRight size={12} className="inline" /></Link></span></div>
  </div>;
}
