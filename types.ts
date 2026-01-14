// Define the shape of the global objects loaded via script tags
declare global {
  interface Window {
    PoorSQL?: {
      format: (sql: string, options?: any) => string;
    };
  }
}

export type CategoryId = 'sql-utils' | 'code-gen' | 'data-fmt' | 'general';

export interface Category {
  id: CategoryId;
  label: string;
}

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  desc: string;
  categoryId: CategoryId;
}

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info'
}