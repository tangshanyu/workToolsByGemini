import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, FolderOpen, Maximize2, RotateCcw, Type, Upload, X } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, PageHeader } from '../components/UI';
import { readMarkdownFile } from '../utils/markdownFile';

export function MarkdownPreview({ content }: { content: string }) {
  return <article className="markdown-prose">
    <Markdown skipHtml remarkPlugins={[remarkGfm]} components={{
      img: ({ alt }) => <span className="markdown-image-note">圖片：{alt || '未命名圖片'}（不自動載入）</span>,
      a: ({ href, children }) => href && /^(https?:\/\/|mailto:|#)/i.test(href)
        ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
        : <span className="markdown-inactive-link" title="本機相對路徑無法在預覽中開啟">{children}</span>,
    }}>{content}</Markdown>
  </article>;
}

export default function MarkdownReader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestId = useRef(0);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  const openFile = async (file?: File) => {
    if (!file) return;
    const currentRequest = ++requestId.current;
    setError('');
    setLoading(true);
    try {
      const content = await readMarkdownFile(file);
      if (currentRequest !== requestId.current) return;
      setSource(content);
      setFileName(file.name);
      setDialogOpen(true);
    } catch (caught) {
      if (currentRequest === requestId.current) setError(caught instanceof Error ? caught.message : '讀取檔案失敗。');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const clearContent = () => {
    requestId.current += 1;
    setSource('');
    setFileName(null);
    setLoading(false);
    setError('');
    setDialogOpen(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const lineCount = source ? source.split(/\r\n|\r|\n/).length : 0;
  const details = `${source.length.toLocaleString('zh-TW')} 字元 · ${lineCount} 行`;
  const title = fileName || 'Markdown 預覽';

  return <div className="markdown-reader">
    <PageHeader title="Markdown 閱讀器" icon={<FileText size={27} />} description="讀取本機 .md 檔案，或在下方貼上、編輯 Markdown／純文字，再開啟全頁預覽。" />
    <input ref={inputRef} className="markdown-file-input" type="file" accept=".md,.markdown,text/markdown" aria-label="選擇 Markdown 檔案" onChange={event => { void openFile(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
    <div className={`markdown-dropzone${dragging ? ' is-dragging' : ''}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); void openFile(event.dataTransfer.files[0]); }}>
      <span className="markdown-drop-icon"><Upload size={23} /></span>
      <div className="markdown-drop-copy"><strong>拖曳 Markdown 檔案到這裡</strong><span>支援 .md 與 .markdown，UTF-8 編碼，上限 10 MB。檔案只在此瀏覽器讀取。</span></div>
      <Button onClick={() => inputRef.current?.click()} disabled={loading}><FolderOpen size={16} />{fileName ? '更換檔案' : '選擇檔案'}</Button>
    </div>
    {error && <p className="markdown-error" role="alert">{error}</p>}
    {loading && <p className="markdown-loading" role="status">正在讀取檔案…</p>}
    <section className="markdown-source-panel" aria-label="Markdown 原始文字編輯區">
      <div className="markdown-source-heading"><div><Type size={19} /><label htmlFor="markdown-source-input">原始文字{fileName ? ` · ${fileName}` : ''}</label></div><span>{details}</span></div>
      <textarea id="markdown-source-input" value={source} onChange={event => setSource(event.target.value)} onKeyDown={event => { if (source && (event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); setDialogOpen(true); } }} placeholder="在這裡貼上或輸入 Markdown／純文字，也可以從上方讀取 .md 檔案…" spellCheck={false} />
      <div className="markdown-source-actions"><span>內容只留在目前頁面 · Ctrl + Enter 開啟預覽</span><div><Button variant="ghost" disabled={!source && !fileName} onClick={clearContent}><RotateCcw size={15} />清除</Button><Button disabled={!source} onClick={() => setDialogOpen(true)}><Maximize2 size={16} />開啟閱讀視窗</Button></div></div>
    </section>

    {createPortal(<dialog ref={dialogRef} className="markdown-reader-dialog" aria-labelledby="markdown-dialog-title" onClose={() => setDialogOpen(false)}>
      <header className="markdown-dialog-header">
        <div className="markdown-file-details"><FileText size={22} /><div><h2 id="markdown-dialog-title" title={title}>{title}</h2><span>{details}</span></div></div>
        <button type="button" className="icon-button" aria-label="關閉閱讀視窗" onClick={() => setDialogOpen(false)}><X size={22} /></button>
      </header>
      <div className="markdown-dialog-scroll">{source ? <MarkdownPreview content={source} /> : <p className="markdown-empty-file">這個檔案沒有內容。</p>}</div>
    </dialog>, window.document.body)}
  </div>;
}
