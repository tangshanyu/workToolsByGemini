import DOMPurify from 'dompurify';
export function sanitizeSqlHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['span', 'br', 'div', 'pre'], ALLOWED_ATTR: ['class'] });
}
export function htmlToText(html: string): string {
  const element = document.createElement('div'); element.innerHTML = sanitizeSqlHtml(html);
  return element.textContent || '';
}
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function wordHtml(text: string, highlightedHtml?: string): string {
  const container = document.createElement('div');
  container.innerHTML = highlightedHtml ? sanitizeSqlHtml(highlightedHtml) : escapeHtml(text);
  const styles: Record<string, string> = {
    SQLKeyword: 'color:#0000FF;font-weight:bold;', SQLComment: 'color:#008000;',
    SQLString: 'color:#FF0000;', SQLOperator: 'color:#808080;', SQLFunction: 'color:#FF00FF;',
    SQLErrorHighlight: 'background-color:#FFC0C0;',
  };
  container.querySelectorAll('*').forEach(element => {
    let style = 'background-color:transparent;border:none;';
    for (const name of element.classList) style += styles[name] || '';
    if (element.classList.contains('SQLComment') && /[\u3400-\u9fff]/.test(element.textContent || '')) style += "font-family:'標楷體','DFKai-SB',serif;";
    element.removeAttribute('class'); element.setAttribute('style', style);
  });
  return `<div style="font-family:'Courier New',monospace;font-size:11pt;line-height:1.5;white-space:pre;color:#000000;background-color:#FFFFFF;border:none;margin:0;">${container.innerHTML}</div>`;
}
function legacyCopy(text: string, html?: string): boolean {
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  const focus = document.activeElement as HTMLElement | null;
  const temporary = document.createElement('textarea');
  temporary.value = text; temporary.style.cssText = 'position:fixed;left:-9999px;top:0;';
  document.body.append(temporary); temporary.select();
  let copied = false;
  const listener = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData('text/plain', text);
    if (html) event.clipboardData.setData('text/html', html);
    event.preventDefault(); copied = true;
  };
  document.addEventListener('copy', listener);
  try { copied = document.execCommand('copy') && copied; }
  catch { copied = false; }
  finally {
    document.removeEventListener('copy', listener); temporary.remove(); focus?.focus({ preventScroll: true });
    if (range && selection) { selection.removeAllRanges(); selection.addRange(range); }
  }
  return copied;
}
export async function copyText(text: string, html?: string): Promise<void> {
  // Use explicit HTML + text payloads; fall back when the browser denies the API.
  try {
    if (html && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]);
    } else if (!html && navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else throw new Error('Clipboard API unavailable');
  } catch {
    if (!legacyCopy(text, html)) throw new Error('無法複製，請選取內容後使用 Ctrl+C。');
  }
}
