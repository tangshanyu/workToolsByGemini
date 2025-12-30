// Define the shape of the global objects loaded via script tags
declare global {
  interface Window {
    PoorSQL?: {
      format: (sql: string, options?: any) => string;
    };
  }
}

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info'
}