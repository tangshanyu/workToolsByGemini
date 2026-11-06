export const MAX_MERMAID_BYTES = 1024 * 1024;

export function validateMermaidFile(file: Pick<File, 'name' | 'size'>): void {
  if (!/\.(mmd|mermaid|txt)$/i.test(file.name)) throw new Error('請選擇 .mmd、.mermaid 或 .txt 檔案。');
  if (file.size > MAX_MERMAID_BYTES) throw new Error('檔案超過 1 MB，請選擇較小的 Mermaid 檔案。');
}

export async function readMermaidFile(file: File): Promise<string> {
  validateMermaidFile(file);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new Error('無法以 UTF-8 讀取此檔案，請先將檔案轉存為 UTF-8。');
  }
}

export function normalizeMermaidSource(source: string): string {
  const trimmed = source.replace(/^\uFEFF/, '').trim();
  const fenced = /^```(?:mermaid|mmd)\s*\r?\n([\s\S]*?)\r?\n```$/i.exec(trimmed);
  return fenced ? fenced[1].trim() : trimmed;
}
