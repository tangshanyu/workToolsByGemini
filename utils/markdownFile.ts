export const MAX_MARKDOWN_BYTES = 10 * 1024 * 1024;

export function validateMarkdownFile(file: Pick<File, 'name' | 'size'>): void {
  if (!/\.(md|markdown)$/i.test(file.name)) throw new Error('請選擇 .md 或 .markdown 檔案。');
  if (file.size > MAX_MARKDOWN_BYTES) throw new Error('檔案超過 10 MB，請選擇較小的 Markdown 檔案。');
}

export async function readMarkdownFile(file: File): Promise<string> {
  validateMarkdownFile(file);
  const bytes = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('無法以 UTF-8 讀取此檔案，請先將檔案轉存為 UTF-8。');
  }
}
