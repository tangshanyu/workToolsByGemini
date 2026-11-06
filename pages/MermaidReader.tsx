import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';
import { FolderOpen, GitBranch, Maximize2, RotateCcw, Type, Upload, X } from 'lucide-react';
import { Button, PageHeader } from '../components/UI';
import { normalizeMermaidSource, readMermaidFile } from '../utils/mermaidFile';

const example = `flowchart LR
    A[開始] --> B{資料正確嗎？}
    B -->|是| C[產生結果]
    B -->|否| D[修改資料]
    D --> B`;

let renderId = 0;

export default function MermaidReader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [svg, setSvg] = useState('');
  const [renderError, setRenderError] = useState('');
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) return;
    let cancelled = false;
    const draw = async () => {
      setRendering(true);
      setSvg('');
      setRenderError('');
      try {
        const diagram = normalizeMermaidSource(source);
        if (!diagram) throw new Error('請先輸入 Mermaid 圖表語法。');
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          htmlLabels: false,
          suppressErrorRendering: true,
          maxTextSize: 100000,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        });
        const rendered = await mermaid.render(`mermaid-reader-${++renderId}`, diagram);
        if (!cancelled) setSvg(rendered.svg);
      } catch (caught) {
        if (!cancelled) setRenderError(caught instanceof Error ? caught.message : '無法解析 Mermaid 圖表。');
      } finally {
        if (!cancelled) setRendering(false);
      }
    };
    void draw();
    return () => { cancelled = true; };
  }, [dialogOpen, source]);

  useLayoutEffect(() => {
    if (!svg) return;
    const diagram = diagramRef.current?.querySelector('svg');
    if (!diagram) return;
    try {
      const bounds = (diagram.querySelector<SVGGElement>('g.root') ?? diagram).getBBox();
      if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0) return;
      const padding = 16;
      const width = Math.ceil(bounds.width + padding * 2);
      const height = Math.ceil(bounds.height + padding * 2);
      diagram.setAttribute('viewBox', `${bounds.x - padding} ${bounds.y - padding} ${width} ${height}`);
      diagram.setAttribute('width', String(width));
      diagram.style.removeProperty('max-width');
    } catch {
      // Keep Mermaid's own viewBox if the browser cannot measure this diagram type.
    }
  }, [svg]);

  const openFile = async (file?: File) => {
    if (!file) return;
    const currentRequest = ++requestId.current;
    setError('');
    setLoading(true);
    try {
      const content = await readMermaidFile(file);
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

  const details = `${source.length.toLocaleString('zh-TW')} 字元 · ${source ? source.split(/\r\n|\r|\n/).length : 0} 行`;
  const title = fileName || 'Mermaid 圖表';

  return <div className="markdown-reader mermaid-reader">
    <PageHeader title="Mermaid 閱讀器" icon={<GitBranch size={27} />} description="讀取本機 Mermaid 檔案，或貼上圖表語法，在全頁視窗閱讀圖表。" />
    <input ref={inputRef} className="markdown-file-input" type="file" accept=".mmd,.mermaid,.txt,text/plain" aria-label="選擇 Mermaid 檔案" onChange={event => { void openFile(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
    <div className={`markdown-dropzone${dragging ? ' is-dragging' : ''}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); void openFile(event.dataTransfer.files[0]); }}>
      <span className="markdown-drop-icon"><Upload size={23} /></span>
      <div className="markdown-drop-copy"><strong>拖曳 Mermaid 檔案到這裡</strong><span>支援 .mmd、.mermaid 與 .txt，UTF-8 編碼，上限 1 MB。檔案只在此瀏覽器讀取。</span></div>
      <Button onClick={() => inputRef.current?.click()} disabled={loading}><FolderOpen size={16} />{fileName ? '更換檔案' : '選擇檔案'}</Button>
    </div>
    {error && <p className="markdown-error" role="alert">{error}</p>}
    {loading && <p className="markdown-loading" role="status">正在讀取檔案…</p>}
    <section className="markdown-source-panel" aria-label="Mermaid 原始碼編輯區">
      <div className="markdown-source-heading"><div><Type size={19} /><label htmlFor="mermaid-source-input">圖表原始碼{fileName ? ` · ${fileName}` : ''}</label></div><span>{details}</span></div>
      <textarea id="mermaid-source-input" value={source} onChange={event => setSource(event.target.value)} onKeyDown={event => { if (source.trim() && (event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); setDialogOpen(true); } }} placeholder="貼上 flowchart、sequenceDiagram、classDiagram 等 Mermaid 語法，或從上方讀取檔案…" spellCheck={false} />
      <div className="markdown-source-actions"><span>支援直接貼上單一 ```mermaid 程式碼區塊 · Ctrl + Enter 開啟圖表</span><div><Button variant="ghost" onClick={() => { setSource(example); setFileName(null); setError(''); }}>載入範例</Button><Button variant="ghost" disabled={!source && !fileName} onClick={clearContent}><RotateCcw size={15} />清除</Button><Button disabled={!source.trim()} onClick={() => setDialogOpen(true)}><Maximize2 size={16} />開啟閱讀視窗</Button></div></div>
    </section>

    {createPortal(<dialog ref={dialogRef} className="markdown-reader-dialog mermaid-reader-dialog" aria-labelledby="mermaid-dialog-title" onClose={() => setDialogOpen(false)}>
      <header className="markdown-dialog-header">
        <div className="markdown-file-details"><GitBranch size={22} /><div><h2 id="mermaid-dialog-title" title={title}>{title}</h2><span>{details}</span></div></div>
        <button type="button" className="icon-button" aria-label="關閉閱讀視窗" onClick={() => setDialogOpen(false)}><X size={22} /></button>
      </header>
      <div className="markdown-dialog-scroll mermaid-dialog-scroll">
        {rendering && <p className="markdown-loading" role="status">正在繪製圖表…</p>}
        {renderError && <div className="mermaid-render-error" role="alert"><strong>圖表語法無法解析</strong><pre>{renderError}</pre><span>請關閉視窗，在主頁修改原始碼後重新開啟。</span></div>}
        {svg && !rendering && <div ref={diagramRef} className="mermaid-diagram" role="img" aria-label="Mermaid 圖表" dangerouslySetInnerHTML={{ __html: svg }} />}
      </div>
    </dialog>, document.body)}
  </div>;
}
