import { useState } from 'react';
import { Braces, FileCode2, Play, SlidersHorizontal } from 'lucide-react';
import { Button, OutputBox, PageHeader, TextArea } from '../components/UI';
import { SqlFeedback, SqlStatus } from '../components/SqlFeedback';
import { SqlSettings } from '../components/SqlSettings';
import { useSqlFormatter } from '../hooks/useSqlFormatter';
import { addCamelCaseAliases, hibernateScalars, sqlToJava } from '../utils/sqlTransforms';

const SAMPLE = 'SELECT c.CUSTOMER_ID, c.CUSTOMER_NAME, COALESCE(SUM(t.AMOUNT), 0) AS totalAmount\nFROM CUSTOMERS c\nLEFT JOIN TRANSACTIONS t ON c.CUSTOMER_ID = t.CUSTOMER_ID\nWHERE c.STATUS = \'ACTIVE\'\nGROUP BY c.CUSTOMER_ID, c.CUSTOMER_NAME';
export default function SqlToJava() {
  const [input, setInput] = useState(''); const [java, setJava] = useState(''); const [scalars, setScalars] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false); const [camelCase, setCamelCase] = useState(false);
  const [generateScalars, setGenerateScalars] = useState(true); const [scalarWarning, setScalarWarning] = useState('');
  const formatter = useSqlFormatter();
  const execute = async (generate: boolean) => {
    setScalarWarning('');
    const source = camelCase && generate ? addCamelCaseAliases(input) : input;
    const formatted = await formatter.run(source);
    if (!formatted || !generate) return;
    setJava(sqlToJava(formatted.text));
    if (generateScalars) {
      try { setScalars(hibernateScalars(formatted.text)); }
      catch (error) { setScalars(''); setScalarWarning(error instanceof Error ? error.message : '無法產生欄位'); }
    } else setScalars('');
  };
  return <div onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); if (!formatter.busy) void execute(true); } }}>
    <PageHeader title="SQL 轉 Java" icon={<FileCode2 size={27} />} description="先用 PoorSQL 整理，再產生可直接貼上的 StringBuilder 程式碼。" controls={<Button variant="ghost" onClick={() => setInput(SAMPLE)} disabled={formatter.busy}>載入範例</Button>} />
    <div className="format-control-bar"><SqlStatus status={formatter.status} busy={formatter.busy} /><Button variant="secondary" onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen}><SlidersHorizontal size={16} />格式設定</Button></div>
    {settingsOpen && <SqlSettings options={formatter.options} onChange={formatter.setOptions} />}
    <div className="conversion-options"><label><input type="checkbox" checked={camelCase} onChange={event => setCamelCase(event.target.checked)} />簡單欄位加駝峰 AS 別名</label><label><input type="checkbox" checked={generateScalars} onChange={event => setGenerateScalars(event.target.checked)} />產生 HibernateScalarHelper</label><span className="muted">保留換行與 SQL 註解</span></div>
    <SqlFeedback error={formatter.error} warning={formatter.result?.errorFound} />
    <div className="format-grid"><section className="input-panel"><div className="editor-heading"><h2><Braces size={17} />原始 SQL</h2><span className="editor-badge">INPUT</span></div><div className="input-tools"><span className="editor-hint">雙引號、反斜線與行註解都會保留</span></div><TextArea aria-label="Java 轉換原始 SQL" value={input} onChange={event => setInput(event.target.value)} placeholder="SELECT t.COLUMN_NAME FROM TABLE_NAME t" /><div className="input-footnote">{input.length.toLocaleString()} 字元</div></section>
      <OutputBox title="格式化後 SQL" content={formatter.result?.html || formatter.result?.text || ''} plainText={formatter.result?.text || ''} isHtml={!!formatter.result?.html} onTextChange={formatter.editResult} />
    </div>
    <div className="format-action-row"><div className="flex gap-2 flex-wrap"><Button variant="secondary" disabled={!input.trim() || formatter.busy} onClick={() => execute(false)}>僅格式化 SQL</Button><Button variant="ghost" onClick={() => { setInput(''); setJava(''); setScalars(''); setScalarWarning(''); formatter.clear(); }}>清空</Button>{formatter.busy && <Button variant="secondary" onClick={formatter.cancel}>取消</Button>}</div><Button className="format-button" disabled={!input.trim() || formatter.busy} onClick={() => execute(true)}><Play size={16} />格式化並產生 Java</Button></div>
    {scalarWarning && <SqlFeedback error={scalarWarning + '（Java StringBuilder 仍已產生。）'} />}
    <div className="format-grid secondary-results"><OutputBox title="Java · sb.append()" content={java} placeholder="格式化後，產生保留 SQL 換行的 Java 字串。" />{generateScalars && <OutputBox title="HibernateScalarHelper" content={scalars} placeholder="欄位型態預設為 STRING，請依資料欄位調整。" />}</div>
  </div>;
}
