import { useRef, useState } from 'react';
import { FileText, FolderOpen, RotateCcw, Upload } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, PageHeader } from '../components/UI';
import { readMarkdownFile } from '../utils/markdownFile';

type Document = { name: string; size: number; content: string };
type View = 'preview' | 'source';

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

  const clearFile = () => {
    requestId.current += 1;
    setDocument(null);
    setLoading(false);
    setError('');
    setView('preview');
    if (inputRef.current) inputRef.current.value = '';
  };

  return <div className="markdown-reader">
    <PageHeader title="Markdown 閱讀器" icon={<FileText size={27} />} description="選擇或拖入本機 .md 檔案，即可閱讀排版內容與原始文字。" />
    <input ref={inputRef} className="markdown-file-input" type="file" accept=".md,.markdown,text/markdown" aria-label="選擇 Markdown 檔案" onChange={event => { void openFile(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
    <div className={`markdown-dropzone${dragging ? ' is-dragging' : ''}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); void openFile(event.dataTransfer.files[0]); }}>
      <span className="markdown-drop-icon"><Upload size={23} /></span>
      <div className="markdown-drop-copy"><strong>拖曳 Markdown 檔案到這裡</strong><span>支援 .md 與 .markdown，UTF-8 編碼，上限 10 MB。檔案只在此瀏覽器讀取。</span></div>
      <Button onClick={() => inputRef.current?.click()} disabled={loading}><FolderOpen size={16} />{document ? '更換檔案' : '選擇檔案'}</Button>
    </div>
    {error && <p className="markdown-error" role="alert">{error}</p>}
    {loading && <p className="markdown-loading" role="status">正在讀取檔案…</p>}
    {document && <section className="markdown-document" aria-label="Markdown 文件">
      <div className="markdown-document-header">
        <div className="markdown-file-details"><FileText size={20} /><div><h2 title={document.name}>{document.name}</h2><span>{(document.size / 1024).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} KB · {document.content ? document.content.split(/\r\n|\r|\n/).length : 0} 行</span></div></div>
        <Button variant="ghost" onClick={clearFile}><RotateCcw size={15} />清除</Button>
      </div>
      <div className="markdown-view-toolbar"><div className="segmented" role="group" aria-label="顯示方式">
        <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>預覽</button>
        <button type="button" aria-pressed={view === 'source'} onClick={() => setView('source')}>原始文字</button>
      </div></div>
      <div className="markdown-document-content">{view === 'preview'
        ? document.content ? <MarkdownPreview content={document.content} /> : <p className="markdown-empty-file">這個檔案沒有內容。</p>
        : <pre className="markdown-source">{document.content}</pre>}</div>
    </section>}
    {!document && !loading && <div className="markdown-welcome"><FileText size={38} strokeWidth={1.3} /><strong>打開一份 Markdown 文件</strong><p>支援標題、段落、表格、待辦清單、引用與程式碼區塊。</p></div>}
  </div>;
}
