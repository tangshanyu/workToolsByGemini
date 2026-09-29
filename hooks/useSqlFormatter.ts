import { useCallback, useEffect, useRef, useState } from 'react';
import { ensurePoorSql, formatSql, type SqlFormatResult } from '../utils/sqlFormatConfig';
import { SQL_FORMAT_OPTIONS, isSqlFormatOptions } from '../utils/sqlOptions';
import { readPreference, writePreference } from '../utils/preferences';
export function useSqlFormatter() {
  const [options, setOptions] = useState(() => readPreference('sql-toolkit.format-options', SQL_FORMAT_OPTIONS, isSqlFormatOptions));
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SqlFormatResult | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    ensurePoorSql().then(() => { if (mounted.current) setStatus('ready'); }).catch(e => { if (mounted.current) { setStatus('error'); setError(e.message); } });
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => { writePreference('sql-toolkit.format-options', options); }, [options]);
  const run = useCallback(async (sql: string) => {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setBusy(true); setError('');
    try {
      const formatted = await formatSql(sql, options, current.signal);
      if (mounted.current && controller.current === current) { setResult(formatted); setStatus('ready'); return formatted; }
      return null;
    } catch (e) {
      if (mounted.current && controller.current === current && !current.signal.aborted) setError(e instanceof Error ? e.message : '處理失敗，請重試。');
      return null;
    } finally { if (mounted.current && controller.current === current) setBusy(false); }
  }, [options]);
  const cancel = () => { controller.current?.abort(); setBusy(false); };
  const clear = () => { cancel(); setResult(null); setError(''); };
  const editResult = (text: string) => setResult(previous => previous ? { ...previous, text, html: '' } : null);
  return { options, setOptions, status, busy, error, setError, result, run, cancel, clear, editResult };
}
