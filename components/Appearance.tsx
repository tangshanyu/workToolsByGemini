import { useEffect, useRef } from 'react';
import { Check, Monitor, Moon, Palette, Sun, X } from 'lucide-react';
import { THEME_COLORS, type ThemeMode, type ThemePreference } from '../utils/theme';

export default function Appearance({ open, onClose, preference, onChange }: {
  open: boolean; onClose: () => void; preference: ThemePreference; onChange: (value: ThemePreference) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  const modes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: '淺色', icon: Sun }, { value: 'dark', label: '深色', icon: Moon }, { value: 'system', label: '跟隨系統', icon: Monitor },
  ];
  return <dialog ref={dialog} className="appearance-dialog" aria-labelledby="appearance-title" onCancel={onClose} onClick={event => {
    if (event.target === dialog.current) { const rect = dialog.current!.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); }
  }}>
    <div className="dialog-heading"><span className="tonal-icon"><Palette size={24} /></span><button className="icon-button" aria-label="關閉外觀設定" onClick={onClose}><X size={20} /></button></div>
    <h2 id="appearance-title">讓工具箱，帶點你的色彩。</h2>
    <p className="muted">從主題色延伸出柔和的背景、按鈕與面板。偏好會自動保留。</p>
    <fieldset><legend>顯示模式</legend><div className="segmented modes">{modes.map(({ value, label, icon: Icon }) => <button key={value} aria-pressed={preference.mode === value} onClick={() => onChange({ ...preference, mode: value })}><Icon size={17} />{label}</button>)}</div></fieldset>
    <fieldset><legend>主題色</legend><div className="theme-swatches">{THEME_COLORS.map(color => <button key={color.value} aria-label={color.name + '主題'} aria-pressed={preference.seed.toLowerCase() === color.value} onClick={() => onChange({ ...preference, seed: color.value })}>
      <span className="swatch" style={{ background: color.value }}>{preference.seed.toLowerCase() === color.value && <Check size={21} color="white" />}</span><span>{color.name}</span>
    </button>)}</div></fieldset>
    <label className="custom-color"><span><strong>自訂色彩</strong><small className="muted">選擇你喜歡的主題色</small></span><input type="color" aria-label="自訂主題色" value={preference.seed} onChange={event => onChange({ ...preference, seed: event.target.value })} /></label>
    <div className="theme-preview" aria-hidden="true"><span className="theme-preview-dot" /><div><strong>你的工作空間</strong><p>清楚、舒適，也有自己的風格。</p></div><span className="chip">Aa</span></div>
    <button className="md-button primary dialog-done" onClick={onClose}>完成</button>
  </dialog>;
}
