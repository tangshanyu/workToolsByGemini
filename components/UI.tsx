import React, { useState, useRef, useEffect } from 'react';

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
  
  const modeVariant = {
      primary: "dark:bg-[#A8C7FA] dark:text-[#041E49] dark:hover:bg-[#D3E3FD] bg-blue-600 text-white hover:bg-blue-700",
      secondary: "dark:bg-transparent dark:border dark:border-[#5f6368] dark:text-[#E8EAED] dark:hover:bg-[#303134] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
      danger: "dark:bg-[#410e0b] dark:text-[#f2b8b5] dark:hover:bg-[#5c1d1d] bg-red-100 text-red-900 hover:bg-red-200 border border-transparent",
      ghost: "dark:text-[#A8C7FA] dark:hover:bg-[#A8C7FA]/10 text-blue-600 hover:bg-blue-50"
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
      {label && <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-[#E8EAED]">{label}</label>}
      
      <div className={`flex-1 relative group border border-gray-300 dark:border-[#3c4043] rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-[#A8C7FA] focus-within:border-[#A8C7FA] bg-white dark:bg-[#0b0b0c] ${className}`}>
        
        {/* Line Numbers Gutter */}
        <div 
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-[#3c4043] text-right pr-2 pt-3 text-gray-400 dark:text-gray-600 text-sm font-mono overflow-hidden select-none"
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
          className={`w-full h-full pl-12 p-3 bg-transparent text-gray-900 dark:text-[#E8EAED] text-sm focus:outline-none resize-y leading-normal min-h-[120px]
          ${monospace ? 'font-mono' : 'font-sans'} whitespace-pre`}
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
  // Local state to handle edits. Initialized with prop content.
  const [localContent, setLocalContent] = useState(content);

  // Sync local state when prop content changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleCopy = () => {
    if (!localContent) return;
    let textToCopy = localContent;
    
    // For HTML content, if it was edited via contentEditable, localContent might vary. 
    // But typically for copying we want the plain text if it's not a rich editor.
    // If isHtml is true, localContent is the raw HTML string (if from prop) or innerText (if we did something else).
    // Here we assume simple copy.
    if (isHtml) {
        // Strip HTML tags for copy if desired, or copy raw HTML. 
        // Usually users want the text representation of code.
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
      // For contentEditable, we update state to avoid losing changes, 
      // though updating state on every keystroke in contentEditable can reset cursor position.
      // For this simple usage, we might just let the DOM handle it and only sync on copy?
      // No, let's just leave it loosely managed for HTML to avoid cursor jumping.
      // We won't update state here to avoid re-render cycles that kill selection.
  }

  return (
    <div className="flex flex-col h-full group">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-sm font-medium text-gray-700 dark:text-[#E8EAED] flex items-center gap-2">
            {title}
            <span className="text-[10px] bg-gray-200 dark:bg-[#303134] px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 font-normal">可編輯</span>
        </h3>
        <button 
          onClick={handleCopy}
          disabled={!localContent}
          className="text-xs flex items-center gap-1 text-[#0B57D0] dark:text-[#A8C7FA] hover:underline disabled:opacity-50 disabled:no-underline"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
          複製內容
        </button>
      </div>
      <div className="flex-1 w-full bg-gray-50 dark:bg-[#000000] border border-gray-200 dark:border-[#3c4043] rounded-md overflow-hidden min-h-[100px] max-h-[600px] relative focus-within:ring-1 focus-within:ring-[#A8C7FA] focus-within:border-[#A8C7FA]">
        {isHtml ? (
            // HTML Mode (ContentEditable Div)
            <div 
                className="w-full h-full p-3 overflow-auto text-sm focus:outline-none SQLCode"
                contentEditable
                suppressContentEditableWarning
                onInput={handleHtmlInput}
                dangerouslySetInnerHTML={{__html: localContent}}
            />
        ) : (
            // Text Mode (Textarea)
            <textarea 
                className="w-full h-full p-3 bg-transparent text-gray-900 dark:text-[#E8EAED] text-sm font-mono whitespace-pre focus:outline-none resize-y"
                value={localContent}
                onChange={handleTextChange}
                placeholder={placeholder}
                spellCheck={false}
            />
        )}
        
        {!localContent && isHtml && (
             <div className="absolute top-3 left-3 text-gray-400 dark:text-gray-600 text-sm italic pointer-events-none">
                {placeholder}
             </div>
        )}
      </div>
    </div>
  );
};