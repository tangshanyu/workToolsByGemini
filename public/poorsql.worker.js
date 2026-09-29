// Keep the vendored formatter off the UI thread. URLs follow the deployment base.
try {
  importScripts(new URL('poorsql.js', self.location.href).href);
  if (typeof self.PoorSQL?.formatSql !== 'function') throw new Error('PoorSQL formatter is unavailable');
  self.postMessage({ type: 'ready' });
} catch (error) {
  self.postMessage({ type: 'load-error', message: String(error.message || error) });
}
self.onmessage = ({ data }) => {
  const { id, sql, options } = data;
  try {
    const start = performance.now();
    const result = self.PoorSQL.formatSql(sql, { ...options, includeText: true, includeHtml: true, coloring: true });
    self.postMessage({ id, result: { text: result.text || '', html: result.html || '', errorFound: !!result.errorFound, elapsedMs: performance.now() - start } });
  } catch (error) {
    self.postMessage({ id, error: String(error.message || error) });
  }
};
