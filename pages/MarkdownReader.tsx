import { useRef, useState } from 'react';
import { FileText, FolderOpen, RotateCcw, Type, Upload } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, PageHeader } from '../components/UI';
import { readMarkdownFile } from '../utils/markdownFile';

type Document = { name: string; size: number; content: string };
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
  const requestId = useRef(0);
  const [document, setDocument] = useState<Document | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [pastedText, setPastedText] = useState('');
  const [view, setView] = useState<View>('preview');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openFile = async (file?: File) => {
    if (!file) return;
    const currentRequest = ++requestId.current;
    setError('');
    setLoading(true);
    try {
      const content = await readMarkdownFile(file);
      if (currentRequest !== requestId.current) return;
      setDocument({ name: file.name, size: file.size, content });
      setView('preview');
    } catch (caught) {
      if (currentRequest === requestId.current) setError(caught instanceof Error ? caught.message : '讀取檔案失敗。');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const clearContent = () => {
    if (inputMode === 'paste') {
      setPastedText('');
      setView('preview');
      return;
    }
    requestId.current += 1;
    setDocument(null);
    setLoading(false);
    setError('');
    setView('preview');
    if (inputRef.current) inputRef.current.value = '';
  };

  const activeContent = inputMode === 'file' ? document?.content ?? '' : pastedText;
  const hasContent = inputMode === 'file' ? document !== null : pastedText.length > 0;
  const lineCount = activeContent ? activeContent.split(/\r\n|\r|\n/).length : 0;

  return <div className={`markdown-reader${inputMode === 'paste' ? ' is-paste-mode' : ''}`}>
    <PageHeader title="Markdown 閱讀器" icon={<FileText size={27} />} description="讀取本機 .md 檔案，或直接貼上 Markdown／純文字，查看排版預覽與原始內容。" />
    <div className="markdown-input-tabs segmented" role="group" aria-label="輸入方式">
      <button type="button" aria-pressed={inputMode === 'file'} onClick={() => { setInputMode('file'); setView('preview'); }}><FolderOpen size={16} />讀取檔案</button>
      <button type="button" aria-pressed={inputMode === 'paste'} onClick={() => { setInputMode('paste'); setView('preview'); }}><Type size={16} />貼上文字</button>
    </div>
    <input ref={inputRef} className="markdown-file-input" type="file" accept=".md,.markdown,text/markdown" aria-label="選擇 Markdown 檔案" onChange={event => { void openFile(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
    {inputMode === 'file' ? <div className={`markdown-dropzone${dragging ? ' is-dragging' : ''}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); void openFile(event.dataTransfer.files[0]); }}>
      <span className="markdown-drop-icon"><Upload size={23} /></span>
      <div className="markdown-drop-copy"><strong>拖曳 Markdown 檔案到這裡</strong><span>支援 .md 與 .markdown，UTF-8 編碼，上限 10 MB。檔案只在此瀏覽器讀取。</span></div>
      <Button onClick={() => inputRef.current?.click()} disabled={loading}><FolderOpen size={16} />{document ? '更換檔案' : '選擇檔案'}</Button>
    </div> : <section className="markdown-paste-panel">
      <label htmlFor="markdown-paste-input" className="field-label">貼上 Markdown 或純文字</label>
      <textarea id="markdown-paste-input" value={pastedText} onChange={event => setPastedText(event.target.value)} placeholder="在這裡貼上 Markdown 或一般文字，下面會即時顯示預覽…" spellCheck={false} />
      <p>輸入內容只留在目前頁面；切換回檔案模式時，貼上的文字會暫時保留。</p>
    </section>}
    {inputMode === 'file' && error && <p className="markdown-error" role="alert">{error}</p>}
    {inputMode === 'file' && loading && <p className="markdown-loading" role="status">正在讀取檔案…</p>}
    {hasContent && <section className="markdown-document" aria-label="Markdown 文件">
      <div className="markdown-document-header">
        <div className="markdown-file-details"><FileText size={20} /><div><h2 title={inputMode === 'file' ? document?.name : '貼上的文字'}>{inputMode === 'file' ? document?.name : '貼上的文字'}</h2><span>{inputMode === 'file' ? `${((document?.size ?? 0) / 1024).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} KB` : `${pastedText.length.toLocaleString('zh-TW')} 字元`} · {lineCount} 行</span></div></div>
        <Button variant="ghost" onClick={clearContent}><RotateCcw size={15} />清除</Button>
      </div>
      <div className="markdown-view-toolbar"><div className="segmented" role="group" aria-label="顯示方式">
        <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>預覽</button>
        <button type="button" aria-pressed={view === 'source'} onClick={() => setView('source')}>原始文字</button>
      </div></div>
      <div className="markdown-document-content">{view === 'preview'
        ? activeContent ? <MarkdownPreview content={activeContent} /> : <p className="markdown-empty-file">這個檔案沒有內容。</p>
        : <pre className="markdown-source">{activeContent}</pre>}</div>
    </section>}
    {!hasContent && !loading && inputMode === 'file' && <div className="markdown-welcome"><FileText size={38} strokeWidth={1.3} /><strong>打開一份 Markdown 文件</strong><p>支援標題、段落、表格、待辦清單、引用與程式碼區塊。</p></div>}
  </div>;
}
