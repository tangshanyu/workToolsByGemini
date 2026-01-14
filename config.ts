import { Category, NavItem } from './types';

export const CATEGORIES: Category[] = [
  { id: 'sql-utils', label: '📂 SQL 工具組' },
  { id: 'code-gen', label: '☕ 代碼生成' },
  { id: 'data-fmt', label: '📊 資料與格式' },
  { id: 'general', label: '🛠️ 通用工具' },
];

export const TOOLS: NavItem[] = [
  // --- SQL Utilities ---
  {
    path: '/param-replace',
    label: 'SQL 參數替換',
    icon: '🔧',
    categoryId: 'sql-utils',
    desc: "自動掃描 SQL 中的參數佔位符（如 'Parm1'），提供界面批量替換值。"
  },
  {
    path: '/question-mark',
    label: 'SQL 問號轉換',
    icon: '❓',
    categoryId: 'sql-utils',
    desc: "將含有問號 (?) 的 SQL 語句搭配參數陣列轉換為完整 SQL。"
  },

  // --- Code Generation ---
  {
    path: '/sql-to-java',
    label: 'SQL 轉 Java',
    icon: '☕',
    categoryId: 'code-gen',
    desc: "將 SQL 轉換為 Java StringBuilder 格式，支援 Hibernate Scalar 生成。"
  },
  {
    path: '/obj-converter',
    label: '物件命名轉換',
    icon: '🐪',
    categoryId: 'code-gen',
    desc: "雙向轉換資料庫欄位 (USER_ID) 與 Java 屬性 (userId)。"
  },

  // --- Data & Formatting ---
  {
    path: '/json-format',
    label: 'JSON 格式化',
    icon: '{}',
    categoryId: 'data-fmt',
    desc: "格式化 JSON，支援解析 Java Map toString() 格式與表格檢視。"
  },

  // --- General Utilities ---
  {
    path: '/diff-viewer',
    label: '文件比對',
    icon: '⚖️',
    categoryId: 'general',
    desc: "左右並排或行內比對兩段文字的差異，支援高亮顯示。"
  }
];

export const getCategoryByToolPath = (path: string): Category | undefined => {
    const tool = TOOLS.find(t => t.path === path);
    if (!tool) return undefined;
    return CATEGORIES.find(c => c.id === tool.categoryId);
};

export const getToolByPath = (path: string): NavItem | undefined => {
    return TOOLS.find(t => t.path === path);
};