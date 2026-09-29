import { useState } from 'react';
import { ListFilter, SlidersHorizontal } from 'lucide-react';
import { Button, Input, OutputBox, PageHeader, TextArea } from '../components/UI';
import { SqlFeedback, SqlStatus } from '../components/SqlFeedback';
import { SqlSettings } from '../components/SqlSettings';
import { useSqlFormatter } from '../hooks/useSqlFormatter';
import { parseParameterList, replaceQuestionParams } from '../utils/sqlTransforms';
export default function SqlQuestionMark() {
  const [input, setInput] = useState(''); const [parameters, setParameters] = useState('');
  const [typed, setTyped] = useState(false); const [settingsOpen, setSettingsOpen] = useState(false);
  const formatter = useSqlFormatter();
  const execute = async () => {
    try { await formatter.run(replaceQuestionParams(input, parseParameterList(parameters), typed)); }
    catch (error) { formatter.setError(error instanceof Error ? error.message : '參數解析失敗'); }
  };
  return <div>
    <PageHeader title="SQL 問號轉換" icon={<ListFilter size={27} />} description="依序帶入 ? 參數，再用 PoorSQL 格式化。SQL 字串與註解中的問號會保留。" controls={<Button variant="ghost" disabled={formatter.busy} onClick={() => { setInput("SELECT * FROM CUSTOMERS WHERE ID = ? AND NAME = ?\n-- 註解內的 ? 保留"); setParameters('[00123, "O\'Reilly, Inc."]'); formatter.clear(); }}>載入範例</Button>} />
    <div className="format-control-bar"><SqlStatus status={formatter.status} busy={formatter.busy} /><Button variant="secondary" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}><SlidersHorizontal size={16} />格式設定</Button></div>
    {settingsOpen && <SqlSettings options={formatter.options} onChange={formatter.setOptions} />}
    <div className="sql-page-stack"><TextArea label="原始 SQL（含 ?）" value={input} onChange={event => setInput(event.target.value)} placeholder="SELECT * FROM CUSTOMERS WHERE ID = ? AND NAME = ?" />
      <section className="parameter-card"><Input label="參數陣列" value={parameters} onChange={event => setParameters(event.target.value)} placeholder={'[00123, "O\'Reilly, Inc."]'} /><div className="parameter-options"><label><input type="checkbox" checked={typed} onChange={event => setTyped(event.target.checked)} />純數字與 NULL 依型態輸出</label></div><p className="settings-note">預設全部視為字串並保留前導零。含逗號的值請以雙引號包住。</p></section></div>
    <SqlFeedback error={formatter.error} warning={formatter.result?.errorFound} />
    <div className="format-action-row"><Button disabled={!input.trim() || formatter.busy} onClick={execute}>帶入參數並格式化</Button>{formatter.busy && <Button variant="secondary" onClick={formatter.cancel}>取消</Button>}</div>
    <OutputBox title="轉換後 SQL" content={formatter.result?.html || formatter.result?.text || ''} plainText={formatter.result?.text || ''} isHtml={!!formatter.result?.html} onTextChange={formatter.editResult} />
  </div>;
}
