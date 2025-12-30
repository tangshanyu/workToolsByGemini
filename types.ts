// Define the shape of the global PoorSQL object loaded via script tag
declare global {
  interface Window {
    PoorSQL: {
      format: (sql: string, options?: any) => string;
      formatFull?: (sql: string, options?: any) => { text: string; html: string; errorFound: boolean; };
    };
    PoorMansTSqlFormatterLib?: {
      formatSql: (sql: string, options?: any) => { text: string; html: string; errorFound: boolean; };
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