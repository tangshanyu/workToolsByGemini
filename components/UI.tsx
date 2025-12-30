import React from 'react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-5 py-2 rounded-full font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-studio-bg";
  
  // Google Studio inspired button styles
  const variants = {
    primary: "bg-[#A8C7FA] hover:bg-[#8AB4F8] text-[#041E49] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] dark:text-[#041E49] bg-blue-600 text-white hover:bg-blue-700", 
    secondary: "bg-transparent border border-studio-border text-studio-text hover:bg-studio-surface dark:border-studio-border dark:text-studio-text dark:hover:bg-studio-surface text-gray-700 border-gray-300 hover:bg-gray-100",
    danger: "bg-red-200 text-red-900 hover:bg-red-300 dark:bg-[#5C1D1D] dark:text-[#F2B8B5] dark:hover:bg-[#601410] dark:border dark:border-[#F2B8B5]/30",
    ghost: "bg-transparent text-studio-primary hover:bg-studio-surface/50"
  };

  const modeVariant = {
      primary: "dark:bg-[#A8C7FA] dark:text-[#041E49] dark:hover:bg-[#D3E3FD] bg-blue-600 text-white hover:bg-blue-700",
      secondary: "dark:bg-transparent dark:border dark:border-[#5f6368] dark:text-[#E8EAED] dark:hover:bg-[#303134] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
      danger: "dark:bg-[#410e0b] dark:text-[#f2b8b5] dark:hover:bg-[#5c1d1d] text-red-600 hover:bg-red-50",
      ghost: "dark:text-[#A8C7FA] dark:hover:bg-[#A8C7FA]/10 text-blue-600 hover:bg-blue-50"
  }

  return (
    <button className={`${baseStyles} ${modeVariant[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- TextArea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  monospace?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, monospace = true, className = '', ...props }) => {
  return (
    <div className="w-full h-full flex flex-col">
      {label && <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-[#E8EAED]">{label}</label>}
      <textarea
        className={`w-full flex-1 bg-white dark:bg-[#0b0b0c] border border-gray-300 dark:border-[#3c4043] rounded-md p-3 
        text-gray-900 dark:text-[#E8EAED] text-sm focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] 
        placeholder-gray-400 dark:placeholder-gray-600 transition-colors resize-none
        ${monospace ? 'font-mono' : 'font-sans'} ${className}`}
        {...props}
      />
    </div>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-[#E8EAED]">{label}</label>}
      <input
        className={`w-full bg-white dark:bg-[#0b0b0c] border border-gray-300 dark:border-[#3c4043] rounded-md px-3 py-2 
        text-gray-900 dark:text-[#E8EAED] text-sm focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] 
        placeholder-gray-400 dark:placeholder-gray-600 transition-colors font-mono ${className}`}
        {...props}
      />
    </div>
  );
};

// --- OutputBox ---
interface OutputBoxProps {
  title: string;
  content: string;
  placeholder?: string;
  isHtml?: boolean;
}

export const OutputBox: React.FC<OutputBoxProps> = ({ title, content, placeholder = "結果將顯示於此...", isHtml = false }) => {
  const handleCopy = () => {
    if (!content) return;
    let textToCopy = content;
    if (isHtml) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        textToCopy = temp.textContent || temp.innerText || "";
    }
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-sm font-medium text-gray-700 dark:text-[#E8EAED]">{title}</h3>
        <button 
          onClick={handleCopy}
          disabled={!content}
          className="text-xs flex items-center gap-1 text-[#0B57D0] dark:text-[#A8C7FA] hover:underline disabled:opacity-50 disabled:no-underline"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
          複製內容
        </button>
      </div>
      <div className="flex-1 w-full bg-gray-50 dark:bg-[#000000] border border-gray-200 dark:border-[#3c4043] rounded-md p-3 overflow-auto min-h-[100px]">
        {content ? (
            <div className={`text-sm ${isHtml ? '' : 'font-mono whitespace-pre text-gray-900 dark:text-[#E8EAED]'}`}>
               {isHtml ? <div className="SQLCode" dangerouslySetInnerHTML={{__html: content}} /> : content}
            </div>
        ) : (
            <span className="text-gray-400 dark:text-gray-600 text-sm italic">{placeholder}</span>
        )}
      </div>
    </div>
  );
};