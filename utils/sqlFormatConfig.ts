import { SQL_FORMAT_OPTIONS, type SqlFormatOptions } from './sqlOptions';
export { SQL_FORMAT_OPTIONS } from './sqlOptions';
export interface SqlFormatResult { text: string; html: string; errorFound: boolean; elapsedMs: number }
type Pending = { resolve: (result: SqlFormatResult) => void; reject: (reason: Error) => void; cleanup: () => void };
let worker: Worker | undefined;
let ready: Promise<void> | undefined;
let requestId = 0;
const pending = new Map<number, Pending>();
function resetWorker(reason: Error): void {
  worker?.terminate(); worker = undefined; ready = undefined;
  for (const request of pending.values()) { request.cleanup(); request.reject(reason); }
  pending.clear();
}
export function ensurePoorSql(): Promise<void> {
  if (ready) return ready;
  ready = new Promise<void>((resolve, reject) => {
    try { worker = new Worker(new URL(import.meta.env.BASE_URL + 'poorsql.worker.js', window.location.href)); }
    catch { reject(new Error('無法啟動 SQL 格式化工具，請重新整理後再試。')); return; }
    const timer = setTimeout(() => { const error = new Error('SQL 格式化工具載入逾時，請重試。'); resetWorker(error); reject(error); }, 15000);
    worker.onerror = () => {
      clearTimeout(timer);
      const error = new Error('SQL 格式化工具載入失敗，請確認本機資源可正常讀取。'); resetWorker(error); reject(error);
    };
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') { clearTimeout(timer); resolve(); return; }
      if (data.type === 'load-error') { clearTimeout(timer); const error = new Error('PoorSQL 載入失敗，請重試。'); resetWorker(error); reject(error); return; }
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id); request.cleanup();
      if (data.error) request.reject(new Error('無法格式化此 SQL：' + data.error));
      else request.resolve(data.result as SqlFormatResult);
    };
  });
  ready.catch(() => { ready = undefined; });
  return ready;
}
export async function formatSql(sql: string, options: SqlFormatOptions = SQL_FORMAT_OPTIONS, signal?: AbortSignal): Promise<SqlFormatResult> {
  if (!sql.trim()) throw new Error('請先輸入 SQL。');
  if (sql.length > 1_000_000) throw new Error('SQL 超過 100 萬字元，請先分段處理。');
  await ensurePoorSql();
  if (signal?.aborted) throw new DOMException('已取消', 'AbortError');
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const cancel = () => resetWorker(new DOMException('已取消', 'AbortError'));
    const timer = setTimeout(() => resetWorker(new Error('處理超過 30 秒，請縮小 SQL 後重試。')), 30000);
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); };
    pending.set(id, { resolve, reject, cleanup });
    signal?.addEventListener('abort', cancel, { once: true });
    worker!.postMessage({ id, sql, options });
  });
}
