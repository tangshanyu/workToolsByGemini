import { useEffect, useId, useMemo, useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { useSqlColors } from '../hooks/SqlColorsContext';
import { DEFAULT_WORD_COLORS, WORD_COLOR_FIELDS, isHexColor } from '../utils/wordColors';
import { wordHtml } from '../utils/clipboard';

const SAMPLE = "-- 契約主檔\nSELECT b.CONTR_NO, SUM(b.AMOUNT) + 10\nFROM AM_C_MST b\nWHERE b.ACT_DATE IS NULL\nAND b.CODE = 'Parm1';";
const SAMPLE_HTML = '<span class="SQLComment">-- 契約主檔</span>\n<span class="SQLKeyword">SELECT</span> b.CONTR_NO<span class="SQLOperator">,</span> <span class="SQLFunction">SUM</span><span class="SQLOperator">(</span>b.AMOUNT<span class="SQLOperator">)</span> <span class="SQLOperator">+</span> 10\n<span class="SQLKeyword">FROM</span> AM_C_MST b\n<span class="SQLKeyword">WHERE</span> b.ACT_DATE <span class="SQLKeyword">IS NULL</span>\n<span class="SQLKeyword">AND</span> b.CODE <span class="SQLOperator">=</span> <span class="SQLString">\'Parm1\'</span><span class="SQLOperator">;</span>';

function ColorField({ label, example, value, onChange }: { label: string; example: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return <div className="word-color-field"><label htmlFor={id}><strong>{label}</strong><small>{example}</small></label><div className="word-color-inputs">
    <input id={id} type="color" value={value} onChange={event => onChange(event.target.value)} aria-label={label + '顏色'} />
    <input type="text" value={draft} spellCheck={false} maxLength={7} aria-label={label + '色碼'} aria-invalid={!isHexColor(draft)} placeholder="#RRGGBB" onChange={event => { setDraft(event.target.value); if (isHexColor(event.target.value)) onChange(event.target.value); }} onBlur={() => setDraft(value)} />
  </div></div>;
}
export function WordColorSettings() {
  const { colors, setColors } = useSqlColors();
  const preview = useMemo(() => wordHtml(SAMPLE, SAMPLE_HTML, colors), [colors]);
  return <div className="word-color-settings"><div className="settings-heading"><h3><Palette size={17} />Word 配色</h3><button className="text-button" onClick={() => setColors({ ...DEFAULT_WORD_COLORS })}><RotateCcw size={14} />套用截圖配色</button></div>
    <p className="settings-note">以你提供的截圖為預設。可選色或輸入 #RRGGBB，立即套用到 Word 預覽與彩色複製。</p>
    <div className="word-color-layout"><div className="word-color-grid">{WORD_COLOR_FIELDS.map(field => <ColorField key={field.key} label={field.label} example={field.example} value={colors[field.key]} onChange={value => setColors({ ...colors, [field.key]: value })} />)}</div>
      <div className="word-color-preview"><span className="word-preview-label">WORD · 白底即時預覽</span><div aria-label="Word 配色範例" dangerouslySetInnerHTML={{ __html: preview }} /></div>
    </div><p className="settings-note">四個 SQL 工具共用配色，重新整理後仍會保留。函數與數字沿用既有色彩，可依喜好調整。</p>
  </div>;
}
