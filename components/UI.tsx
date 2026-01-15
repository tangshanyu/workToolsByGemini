import React, { useState, useRef, useEffect } from 'react';

// --- PageHeader (Standardized Tool Header) ---
interface PageHeaderProps {
  title: string;
  icon: React.ReactNode;
  description: React.ReactNode;
  controls?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  icon, 
  description, 
  controls,
  className = ""
}) => {
  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#18181a] border border-gray-200 dark:border-[#3c4043] p-5 rounded-xl shadow-sm shrink-0 transition-colors duration-300 ${className}`}>
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="text-2xl">{icon}</span> 
          {title}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          {description}
        </div>
      </div>

      {controls && (
        <div className="flex items-center gap-3 self-end md:self-center">
           {controls}
        </div>
      )}
    </div>
  );
};

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
  const baseStyles = "px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent active:scale-95";
  
  const modeVariant = {
      // Primary: Soft Blue (Light) | Solid Blue (Dark)
      primary: "text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl dark:bg-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-none border-0",
      
      // Secondary: Solid White (Light) | Solid Dark (Dark)
      secondary: "text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm dark:text-gray-300 dark:bg-[#202124] dark:hover:bg-[#2a2b2e] dark:border-[#3c4043] dark:shadow-none",
      
      // Danger: Soft Red (Light) | Solid Red (Dark)
      danger: "text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md dark:bg-none dark:bg-red-600 dark:hover:bg-red-700 dark:shadow-none",
      
      // Ghost: Text only
      ghost: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-[#202124]"
  }

  return (
    <button className={`${baseStyles} ${modeVariant[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- TextArea with Line Numbers ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  monospace?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, monospace = true, className = '', value, onChange, ...props }) => {
  const [lineCount, setLineCount] = useState(1);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Calculate lines whenever value changes
  useEffect(() => {
    if (value !== undefined) {
      const lines = (typeof value === 'string' ? value : '').split('\n').length;
      setLineCount(Math.max(1, lines));
    }
  }, [value]);

  // Sync scroll
  const handleScroll = () => {
    if (textAreaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  return (
    <div className="w-full h-full flex flex-col">
      {label && <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
      
      <div className={`
        flex-1 relative group overflow-hidden rounded-2xl dark:rounded-xl transition-all duration-300
        bg-white border border-gray-200
        dark:bg-[#09090b] dark:border-[#3c4043]
        focus-within:border-blue-400 dark:focus-within:border-blue-500
        focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-0
        shadow-sm dark:shadow-none
        ${className}
      `}>
        
        {/* Line Numbers Gutter */}
        <div 
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 border-r border-gray-100 text-right pr-2 pt-3 text-gray-400 text-sm font-mono overflow-hidden select-none
          dark:bg-[#121212] dark:border-[#3c4043] dark:text-gray-600"
          aria-hidden="true"
        >
          <pre className="whitespace-pre-wrap font-mono text-sm leading-normal">{lineNumbers}</pre>
        </div>

        {/* Actual Text Area */}
        <textarea
          ref={textAreaRef}
          value={value}
          onChange={onChange}
          onScroll={handleScroll}
          className={`w-full h-full pl-12 p-3 bg-transparent text-gray-800 dark:text-gray-200 text-sm focus:outline-none resize-y leading-normal min-h-[120px]
          ${monospace ? 'font-mono' : 'font-sans'} whitespace-pre placeholder-gray-400 dark:placeholder-gray-600`}
          style={{ resize: 'vertical' }} // Ensure resize handle is visible and works
          spellCheck={false}
          {...props}
        />
      </div>
    </div>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
      <input
        className={`
            w-full px-4 py-2.5 rounded-xl dark:rounded-xl transition-all duration-300
            bg-white border border-gray-200
            dark:bg-[#09090b] dark:border-[#3c4043]
            text-gray-800 dark:text-gray-200 text-sm font-mono
            focus:outline-none focus:border-blue-400 dark:focus:border-blue-500
            focus:ring-4 focus:ring-blue-100 dark:focus:ring-0
            placeholder-gray-400 dark:placeholder-gray-600 
            ${className}
        `}
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
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleCopy = () => {
    if (!localContent) return;
    let textToCopy = localContent;
    
    if (isHtml) {
        const temp = document.createElement('div');
        temp.innerHTML = localContent;
        textToCopy = temp.textContent || temp.innerText || "";
    }
    navigator.clipboard.writeText(textToCopy);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalContent(e.target.value);
  }

  const handleHtmlInput = (e: React.FormEvent<HTMLDivElement>) => {
      // Content editable handling if needed
  }

  return (
    <div className="flex flex-col h-full group">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            {title}
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium dark:bg-blue-900/30 dark:text-blue-300">可編輯</span>
        </h3>
        <button 
          onClick={handleCopy}
          disabled={!localContent}
          className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 font-medium dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
          複製內容
        </button>
      </div>
      
      <div className={`
        flex-1 w-full min-h-[120px] max-h-[600px] relative rounded-2xl dark:rounded-xl overflow-hidden transition-all duration-300
        bg-white border border-gray-200
        dark:bg-[#09090b] dark:border-[#3c4043]
        group-hover:border-blue-300 dark:group-hover:border-gray-500
        focus-within:border-blue-400 dark:focus-within:border-blue-500
        focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-0
      `}>
        {isHtml ? (
            <div 
                className="w-full h-full p-4 overflow-auto text-sm focus:outline-none SQLCode text-gray-800 dark:text-gray-200"
                contentEditable
                suppressContentEditableWarning
                onInput={handleHtmlInput}
                dangerouslySetInnerHTML={{__html: localContent}}
            />
        ) : (
            <textarea 
                className="w-full h-full p-4 bg-transparent text-gray-800 dark:text-gray-200 text-sm font-mono whitespace-pre focus:outline-none resize-y placeholder-gray-400 dark:placeholder-gray-600"
                value={localContent}
                onChange={handleTextChange}
                placeholder={placeholder}
                spellCheck={false}
            />
        )}
        
        {!localContent && isHtml && (
             <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-600 text-sm italic pointer-events-none">
                {placeholder}
             </div>
        )}
      </div>
    </div>
  );
};