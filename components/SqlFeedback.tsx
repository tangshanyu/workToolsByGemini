import { AlertCircle, CircleCheck, LoaderCircle } from 'lucide-react';
export function SqlStatus({ status, busy }: { status: 'loading' | 'ready' | 'error'; busy: boolean }) {
  return <span className={`status-chip ${status === 'error' ? 'status-error' : ''}`} role="status">{busy || status === 'loading' ? <LoaderCircle size={14} className="spin" /> : status === 'ready' ? <CircleCheck size={14} /> : <AlertCircle size={14} />}{busy ? '處理中' : status === 'loading' ? '準備中' : status === 'ready' ? 'PoorSQL 就緒' : '載入失敗'}</span>;
}
export function SqlFeedback({ error, warning }: { error: string; warning?: boolean }) {
  if (!error && !warning) return null;
  return <div className={`feedback ${error ? 'feedback-error' : 'feedback-warning'}`} role={error ? 'alert' : 'status'}><AlertCircle size={18} /><span>{error || 'PoorSQL 偵測到未識別或不完整的語法。請確認 SQL；下方結果供檢視，並非資料庫語法驗證。'}</span></div>;
}
