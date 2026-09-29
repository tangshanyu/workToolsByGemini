import { Braces, Code2, FileCode2, Table2, Ruler, GitCompare, Search, Database, Replace, ListFilter, LayoutGrid, type LucideIcon } from 'lucide-react';
const icons: Record<string, LucideIcon> = {
  '/sql-format': Braces, '/sql-to-java': FileCode2, '/param-replace': Replace,
  '/question-mark': ListFilter, '/obj-converter': Code2, '/json-format': Braces,
  '/domain-convert': Database, '/csv-editor': Table2, '/fixed-width': Ruler,
  '/vlookup': Search, '/diff-viewer': GitCompare, '/tools': LayoutGrid,
};
export function ToolIcon({ path, size = 20 }: { path: string; size?: number }) {
  const Icon = icons[path] || Code2;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
