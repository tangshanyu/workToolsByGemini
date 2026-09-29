import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Copy, FileText, Palette, Pencil, Sparkles } from 'lucide-react';
import { copyText, htmlToText, sanitizeSqlHtml, wordHtml } from '../utils/clipboard';
import { useSqlColors } from '../hooks/SqlColorsContext';

interface PageHeaderProps { title: string; icon: React.ReactNode; description: React.ReactNode; controls?: React.ReactNode; className?: string }
export function PageHeader({ title, icon, description, controls, className = '' }: PageHeaderProps) {
  return <div className={`page-header ${className}`}><div><h1><span className="page-icon" aria-hidden="true">{icon}</span>{title}</h1><div className="page-description">{description}</div></div>{controls && <div className="page-controls">{controls}</div>}</div>;
}
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }
export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`md-button ${variant} ${className}`} {...props} />;
}
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; monospace?: boolean }
export function TextArea({ label, monospace = true, className = '', value, onScroll, id, ...props }: TextAreaProps) {
  const generatedId = useId(); const inputId = id || generatedId;
  const textRef = useRef<HTMLTextAreaElement>(null); const numbers = useRef<HTMLDivElement>(null);
  const lineCount = typeof value === 'string' ? value.split('\n').length : 1;
  return <div className={`text-field ${className}`}>
    {label && <label htmlFor={inputId} className="field-label">{label}</label>}
    <div className="code-input"><div ref={numbers} className="line-numbers" aria-hidden="true"><pre>{Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}</pre></div>
      <textarea ref={textRef} id={inputId} value={value} onScroll={event => { if (numbers.current) numbers.current.scrollTop = event.currentTarget.scrollTop; onScroll?.(event); }} className={monospace ? 'font-mono' : ''} spellCheck={false} wrap="off" {...props} />
    </div>
  </div>;
}
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string }
export function Input({ label, className = '', id, ...props }: InputProps) {
  const generatedId = useId(); const inputId = id || generatedId;
  return <div className="text-field">{label && <label htmlFor={inputId} className="field-label">{label}</label>}<input id={inputId} className={`md-input ${className}`} {...props} /></div>;
}
interface OutputBoxProps { title: string; content: string; placeholder?: string; isHtml?: boolean; plainText?: string; onTextChange?: (text: string) => void; meta?: React.ReactNode }
export function OutputBox({ title, content, placeholder = '結果將顯示於此…', isHtml = false, plainText, onTextChange, meta }: OutputBoxProps) {
  const [text, setText] = useState(() => plainText ?? (isHtml ? htmlToText(content) : content));
  const [html, setHtml] = useState(isHtml ? content : '');
  const [mode, setMode] = useState<'preview' | 'word' | 'edit'>('preview');
  const editing = mode === 'edit';
  const { colors } = useSqlColors();
  const [copied, setCopied] = useState<'text' | 'word' | null>(null);
  const [copyError, setCopyError] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setText(plainText ?? (isHtml ? htmlToText(content) : content)); setHtml(isHtml ? content : ''); setCopyError(''); }, [content, plainText, isHtml]);
  useEffect(() => () => clearTimeout(timeout.current), []);
  const safeHtml = useMemo(() => sanitizeSqlHtml(html), [html]);
  const wordPreview = useMemo(() => mode === 'word' ? wordHtml(text, html || undefined, colors) : '', [mode, text, html, colors]);
  const copy = async (type: 'text' | 'word') => {
    try {
      setCopyError(''); await copyText(text, type === 'word' ? wordHtml(text, html || undefined, colors) : undefined);
      setCopied(type); clearTimeout(timeout.current); timeout.current = setTimeout(() => setCopied(null), 2200);
    } catch (error) { setCopyError(error instanceof Error ? error.message : '複製失敗'); }
  };
  return <section className="output-panel" aria-label={title}>
    <div className="editor-heading"><h2><Sparkles size={17} />{title}</h2>{meta}<span className="editor-badge">OUTPUT</span></div>
    <div className="result-toolbar"><div className="segmented small"><button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}><Palette size={15} />預覽</button>{(isHtml || onTextChange) && <button aria-pressed={mode === 'word'} onClick={() => setMode('word')}><FileText size={15} />Word 預覽</button>}<button aria-pressed={editing} onClick={() => setMode('edit')}><Pencil size={15} />編輯</button></div><span className="muted result-lines">{text ? text.split('\n').length : 0} 行</span></div>
    {editing ? <textarea className="result-editor font-mono" aria-label={title + '編輯'} spellCheck={false} value={text} placeholder={placeholder} wrap="off" onChange={event => { setText(event.target.value); setHtml(''); onTextChange?.(event.target.value); }} />
      : mode === 'word' && text ? <div className="result-scroll word-result-scroll" aria-label={title + ' Word 預覽'} dangerouslySetInnerHTML={{ __html: wordPreview }} />
      : <div className="result-scroll">{text ? safeHtml ? <pre className="SQLCode" dangerouslySetInnerHTML={{ __html: safeHtml }} /> : <pre className="SQLCode">{text}</pre> : <div className="result-placeholder"><FileText size={34} strokeWidth={1.2} /><strong>整理好的結果，會在這裡。</strong><p>{placeholder}</p></div>}</div>}
    <div className="result-actions"><Button variant="secondary" disabled={!text} onClick={() => copy('text')}>{copied === 'text' ? <Check size={16} /> : <Copy size={16} />}{copied === 'text' ? '已複製' : '複製文字'}</Button><Button variant="ghost" disabled={!text} onClick={() => copy('word')}>{copied === 'word' ? <Check size={16} /> : <Palette size={16} />}{copied === 'word' ? '已複製' : '彩色複製到 Word'}</Button></div>
    <div className={`copy-message ${copyError ? 'error-text' : 'muted'}`} role="status">{copyError || (copied ? '已複製目前顯示的內容。' : editing && isHtml && !html ? '重新格式化後，可更新語法著色。' : '')}</div>
  </section>;
}
