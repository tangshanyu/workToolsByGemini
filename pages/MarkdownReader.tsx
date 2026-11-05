import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, FolderOpen, Maximize2, RotateCcw, Type, Upload, X } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, PageHeader } from '../components/UI';
import { readMarkdownFile } from '../utils/markdownFile';

type MarkdownFile = { name: string; size: number; content: string };
type View = 'preview' | 'source';
type InputMode = 'file' | 'paste';

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
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const requestId = useRef(0);
  const [fileDocument, setFileDocument] = useState<MarkdownFile | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [pastedText, setPastedText] = useState('');
  const [view, setView] = useState<View>('preview');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
    if (dialogOpen && inputMode === 'paste') pasteRef.current?.focus();
  }, [dialogOpen, inputMode]);

  const openFile = async (file?: File) => {
    if (!file) return;
    const currentRequest = ++requestId.current;
    setError('');
    setLoading(true);
    try {
      const content = await readMarkdownFile(file);
      if (currentRequest !== requestId.current) return;
      setFileDocument({ name: file.name, size: file.size, content });
      setInputMode('file');
      setView('preview');
      setDialogOpen(true);
    } catch (caught) {
      if (currentRequest === requestId.current) setError(caught instanceof Error ? caught.message : '讀取檔案失敗。');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const clearContent = () => {
    if (inputMode === 'paste') {
      setPastedText('');
    } else {
      requestId.current += 1;
      setFileDocument(null);
      setLoading(false);
      setError('');
      if (inputRef.current) inputRef.current.value = '';
    }
    setView('preview');
    setDialogOpen(false);
  };

  const activeContent = inputMode === 'file' ? fileDocument?.content ?? '' : pastedText;
  const hasContent = inputMode === 'file' ? fileDocument !== null : pastedText.length > 0;
  const lineCount = activeContent ? activeContent.split(/\r\n|\r|\n/).length : 0;
  const title = inputMode === 'file' ? fileDocument?.name ?? 'Markdown 文件' : '貼上的文字';
  const details = inputMode === 'file'
    ? `${((fileDocument?.size ?? 0) / 1024).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} KB · ${lineCount} 行`
    : `${pastedText.length.toLocaleString('zh-TW')} 字元 · ${lineCount} 行`;

  return <div className={`markdown-reader${inputMode === 'paste' ? ' is-paste-mode' : ''}`}>
    <PageHeader title="Markdown 閱讀器" icon={<FileText size={27} />} description="讀取本機 .md 檔案，或在全頁視窗貼上 Markdown／純文字。" />
    <div className="markdown-input-tabs segmented" role="group" aria-label="輸入方式">
      <button type="button" aria-pressed={inputMode === 'file'} onClick={() => { setInputMode('file'); setView('preview'); if (fileDocument) setDialogOpen(true); }}><FolderOpen size={16} />讀取檔案</button>
      <button type="button" aria-pressed={inputMode === 'paste'} onClick={() => { setInputMode('paste'); setView('preview'); setDialogOpen(true); }}><Type size={16} />貼上文字</button>
    </div>
    <input ref={inputRef} className="markdown-file-input" type="file" accept=".md,.markdown,text/markdown" aria-label="選擇 Markdown 檔案" onChange={event => { void openFile(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
    {inputMode === 'file' ? <div className={`markdown-dropzone${dragging ? ' is-dragging' : ''}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); void openFile(event.dataTransfer.files[0]); }}>
      <span className="markdown-drop-icon"><Upload size={23} /></span>
      <div className="markdown-drop-copy"><strong>拖曳 Markdown 檔案到這裡</strong><span>支援 .md 與 .markdown，UTF-8 編碼，上限 10 MB。檔案只在此瀏覽器讀取。</span></div>
      <Button onClick={() => inputRef.current?.click()} disabled={loading}><FolderOpen size={16} />{fileDocument ? '更換檔案' : '選擇檔案'}</Button>
    </div> : <section className="markdown-paste-launch">
      <span className="markdown-drop-icon"><Type size={23} /></span>
      <div><strong>在大畫面貼上或編輯文字</strong><p>開啟後可一邊輸入，一邊查看 Markdown 預覽。</p></div>
      <Button onClick={() => setDialogOpen(true)}><Maximize2 size={16} />開啟編輯視窗</Button>
    </section>}
    {inputMode === 'file' && error && <p className="markdown-error" role="alert">{error}</p>}
    {inputMode === 'file' && loading && <p className="markdown-loading" role="status">正在讀取檔案…</p>}
    {hasContent && <section className="markdown-document-summary" aria-label="目前內容">
      <div className="markdown-file-details"><FileText size={20} /><div><h2 title={title}>{title}</h2><span>{details}</span></div></div>
      <Button variant="secondary" onClick={() => setDialogOpen(true)}><Maximize2 size={16} />開啟閱讀視窗</Button>
    </section>}
    {!hasContent && !loading && inputMode === 'file' && <div className="markdown-welcome"><FileText size={38} strokeWidth={1.3} /><strong>打開一份 Markdown 文件</strong><p>匯入後會自動開啟全頁閱讀視窗。</p></div>}

    {createPortal(<dialog ref={dialogRef} className={`markdown-reader-dialog${inputMode === 'paste' ? ' is-paste-mode' : ''}`} aria-labelledby="markdown-dialog-title" onClose={() => setDialogOpen(false)}>
      <header className="markdown-dialog-header">
        <div className="markdown-file-details"><FileText size={22} /><div><h2 id="markdown-dialog-title" title={title}>{title}</h2><span>{details}</span></div></div>
        <div className="markdown-dialog-actions">
          {hasContent && <Button variant="ghost" onClick={clearContent}><RotateCcw size={15} />清除</Button>}
          <button type="button" className="icon-button" aria-label="關閉閱讀視窗" onClick={() => setDialogOpen(false)}><X size={22} /></button>
        </div>
      </header>
      <div className="markdown-dialog-body">
        {inputMode === 'paste' && <section className="markdown-dialog-editor">
          <label htmlFor="markdown-paste-input">Markdown／純文字輸入</label>
          <textarea ref={pasteRef} id="markdown-paste-input" value={pastedText} onChange={event => setPastedText(event.target.value)} placeholder="在這裡貼上或輸入文字…" spellCheck={false} />
        </section>}
        <section className="markdown-dialog-result" aria-label="閱讀內容">
          <div className="markdown-dialog-toolbar">
            <strong>{view === 'preview' ? '預覽' : '原始文字'}</strong>
            <div className="segmented small" role="group" aria-label="顯示方式">
              <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>預覽</button>
              <button type="button" aria-pressed={view === 'source'} onClick={() => setView('source')}>原始文字</button>
            </div>
          </div>
          <div className="markdown-dialog-scroll">{view === 'preview'
            ? activeContent ? <MarkdownPreview content={activeContent} /> : <p className="markdown-empty-file">{inputMode === 'paste' ? '輸入文字後，這裡會即時顯示預覽。' : '這個檔案沒有內容。'}</p>
            : <pre className="markdown-source">{activeContent}</pre>}</div>
        </section>
      </div>
    </dialog>, window.document.body)}
  </div>;
}
