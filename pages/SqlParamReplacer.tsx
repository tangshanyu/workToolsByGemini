import { useState } from 'react';
import { Replace, SlidersHorizontal } from 'lucide-react';
import { Button, Input, OutputBox, PageHeader, TextArea } from '../components/UI';
import { SqlFeedback, SqlStatus } from '../components/SqlFeedback';
import { SqlSettings } from '../components/SqlSettings';
import { useSqlFormatter } from '../hooks/useSqlFormatter';
import { findNamedParams, replaceNamedParams } from '../utils/sqlTransforms';
export default function SqlParamReplacer() {
  const [input, setInput] = useState(''); const [params, setParams] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({}); const [settingsOpen, setSettingsOpen] = useState(false);
  const [scanSource, setScanSource] = useState(''); const formatter = useSqlFormatter();
  const scan = () => {
    const found = findNamedParams(input); setParams(found); setScanSource(input);
    setValues(previous => Object.fromEntries(found.map(key => [key, previous[key] ?? ''])));
    formatter.setError(found.length ? '' : "未找到 'Parm1' 或 '%Parm1%' 格式的參數。註解內的內容會略過。");
  };
  return <div>
    <PageHeader title="SQL 參數替換" icon={<Replace size={27} />} description={<>掃描 'Parm1'、'%Parm2%'，填入值後替換並用 PoorSQL 整理。空字串也可以作為參數。</>} controls={<Button variant="ghost" disabled={formatter.busy} onClick={() => { setInput("SELECT * FROM CUSTOMERS\nWHERE CUSTOMER_ID = 'Parm1' AND CUSTOMER_NAME LIKE '%Parm2%'\n-- 'Parm3' 不會被替換"); setParams([]); formatter.clear(); }}>載入範例</Button>} />
    <div className="format-control-bar"><SqlStatus status={formatter.status} busy={formatter.busy} /><Button variant="secondary" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}><SlidersHorizontal size={16} />格式設定</Button></div>
    {settingsOpen && <SqlSettings options={formatter.options} onChange={formatter.setOptions} />}
    <TextArea label="原始 SQL" value={input} onChange={event => setInput(event.target.value)} placeholder="SELECT * FROM CUSTOMERS WHERE ID = 'Parm1'" />
    <div className="format-action-row"><Button variant="secondary" onClick={scan} disabled={!input.trim() || formatter.busy}><Replace size={16} />掃描參數</Button><span className="muted text-xs">略過註解；保留 LIKE 的 %</span></div>
    {params.length > 0 && <section className="parameter-card"><h2>參數值 · {params.length} 個</h2><div className="parameter-grid">{params.map(key => <Input key={key} label={key} value={values[key] ?? ''} onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))} placeholder="可留空，也可輸入特殊字元" />)}</div></section>}
    <SqlFeedback error={formatter.error || (params.length && input !== scanSource ? 'SQL 已變更，請重新掃描參數。' : '')} warning={formatter.result?.errorFound} />
    <div className="format-action-row"><Button disabled={!params.length || input !== scanSource || formatter.busy} onClick={() => formatter.run(replaceNamedParams(input, values))}>替換並格式化</Button>{formatter.busy && <Button variant="secondary" onClick={formatter.cancel}>取消</Button>}</div>
    <OutputBox title="替換後 SQL" content={formatter.result?.html || formatter.result?.text || ''} plainText={formatter.result?.text || ''} isHtml={!!formatter.result?.html} onTextChange={formatter.editResult} />
  </div>;
}
