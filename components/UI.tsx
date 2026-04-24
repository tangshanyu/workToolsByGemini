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
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] p-5 rounded-xl shadow-sm shrink-0 transition-colors duration-300 ${className}`}>
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
    secondary: "text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm dark:text-gray-300 dark:bg-[#252526] dark:hover:bg-[#2D2D2D] dark:border-[#333] dark:shadow-none",

    // Danger: Soft Red (Light) | Solid Red (Dark)
    danger: "text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md dark:bg-none dark:bg-red-600 dark:hover:bg-red-700 dark:shadow-none",

    // Ghost: Text only
    ghost: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-[#252526]"
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

  // Auto-resize textarea based on content
  useEffect(() => {
    const ta = textAreaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.max(120, ta.scrollHeight) + 'px';
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
    <div className="w-full flex flex-col">
      {label && <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 ml-1">{label}</label>}

      <div className={`
        relative group overflow-hidden rounded-xl transition-all duration-300
        bg-white border border-gray-200
        dark:bg-[#1E1E1E] dark:border-[#333]
        focus-within:border-blue-400 dark:focus-within:border-blue-500
        focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-0
        shadow-sm dark:shadow-none
        ${className}
      `}>

        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-10 bg-gray-50 border-r border-gray-100 text-right pr-2 pt-3 text-gray-400 text-sm font-mono overflow-hidden select-none
          dark:bg-[#1A1A1A] dark:border-[#333] dark:text-gray-600"
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
          className={`w-full pl-12 p-3 bg-transparent text-gray-800 dark:text-[#D4D4D4] text-sm focus:outline-none leading-normal min-h-[120px]
          ${monospace ? 'font-mono' : 'font-sans'} whitespace-pre placeholder-gray-400 dark:placeholder-gray-500`}
          style={{ resize: 'none', overflow: 'hidden' }}
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
            w-full px-4 py-2.5 rounded-xl transition-all duration-300
            bg-white border border-gray-200
            dark:bg-[#1E1E1E] dark:border-[#333]
            text-gray-800 dark:text-[#D4D4D4] text-sm font-mono
            focus:outline-none focus:border-blue-400 dark:focus:border-blue-500
            focus:ring-4 focus:ring-blue-100 dark:focus:ring-0
            placeholder-gray-400 dark:placeholder-gray-500 
            ${className}
        `}
        {...props}
      />
    </div>
  );
};

// --- Auto-resize textarea for OutputBox ---
const OutputTextArea: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = ref.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.max(150, ta.scrollHeight) + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="w-full p-4 bg-transparent text-gray-800 dark:text-[#D4D4D4] text-sm font-mono whitespace-pre focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 min-h-[150px]"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      spellCheck={false}
      style={{ resize: 'none', overflow: 'hidden' }}
    />
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleCopy = () => {
    if (!localContent) return;

    if (isHtml) {
      const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
      const temp = document.createElement('div');
      temp.innerHTML = localContent;

      // Replace CSS classes with inline styles, and strip ALL classes & backgrounds
      temp.querySelectorAll('*').forEach(el => {
        const htmlEl = el as HTMLElement;
        const cls = htmlEl.getAttribute('class') || '';
        
        let inlineStyle = 'background:none;border:none;text-decoration:none;';
        if (cls.includes('SQLKeyword')) inlineStyle += 'color:#0000FF;font-weight:bold;';
        else if (cls.includes('SQLComment')) {
          inlineStyle += 'color:#008000;';
          if (cjkRegex.test(htmlEl.textContent || '')) {
            inlineStyle += "font-family:'標楷體','DFKai-SB',serif;font-style:normal;";
          }
        }
        else if (cls.includes('SQLString')) inlineStyle += 'color:#FF0000;';
        else if (cls.includes('SQLOperator')) inlineStyle += 'color:#808080;';
        else if (cls.includes('SQLFunction')) inlineStyle += 'color:#FF00FF;';
        else if (cls.includes('SQLErrorHighlight')) inlineStyle += 'background-color:#FFC0C0;';

        htmlEl.removeAttribute('class');
        htmlEl.setAttribute('style', inlineStyle);
      });

      // Use DOM Selection + execCommand('copy') — the ONLY method that reliably
      // copies rich text with inline styles into MS Word on modern Chrome.
      //
      // Key: use <div style="white-space:pre"> instead of <pre> tag.
      // Word's <pre> triggers "HTML Preformatted" paragraph style (grey background + border).
      // A <div> with white-space:pre preserves indentation without triggering that style.
      const copyContainer = document.createElement('div');
      copyContainer.style.position = 'fixed';
      copyContainer.style.left = '-9999px';
      copyContainer.style.top = '-9999px';
      // MUST be visible (not opacity:0, not display:none) for Chrome to compute styles
      copyContainer.style.width = '1px';
      copyContainer.style.height = '1px';
      copyContainer.style.overflow = 'hidden';

      copyContainer.innerHTML = `<div style="font-family:'Courier New',monospace;font-size:11pt;line-height:1.5;white-space:pre;background:none;border:none;padding:0;margin:0;">${temp.innerHTML}</div>`;
      document.body.appendChild(copyContainer);

      const selection = window.getSelection();
      const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      
      selection?.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(copyContainer);
      selection?.addRange(range);

      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (e) {
        console.warn('DOM execCommand failed', e);
      }

      selection?.removeAllRanges();
      if (originalRange) selection?.addRange(originalRange);
      document.body.removeChild(copyContainer);

      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: plain text
        const plainText = temp.textContent || temp.innerText || "";
        navigator.clipboard.writeText(plainText).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
      }
    } else {
      // --- NON-HTML COPY (Forces Courier New font for Word) ---
      // Even if it's plain text, we construct an HTML payload so Word uses Courier New. 
      // Escape HTML entities to prevent accidental rendering issues:
      const escapeHtml = (unsafe: string) => unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      const plainText = localContent;
      const htmlContent = `<div style="font-family:'Courier New',monospace;font-size:11pt;line-height:1.5;white-space:pre-wrap;word-break:break-all;">${escapeHtml(plainText)}</div>`;

      const copyWithClipboardApi = async () => {
        try {
          if (!navigator.clipboard || !navigator.clipboard.write || !window.ClipboardItem) return false;
          const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
          const textBlob = new Blob([plainText], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': htmlBlob,
              'text/plain': textBlob,
            })
          ]);
          return true;
        } catch (err) {
          return false;
        }
      };

      const copyWithExecCommand = (): boolean => {
        let success = false;
        const dummy = document.createElement('span');
        dummy.textContent = ' ';
        dummy.style.position = 'absolute';
        dummy.style.opacity = '0';
        document.body.appendChild(dummy);

        const selection = window.getSelection();
        const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        const range = document.createRange();
        range.selectNodeContents(dummy);
        selection?.removeAllRanges();
        selection?.addRange(range);

        const listener = (e: ClipboardEvent) => {
          e.clipboardData?.setData('text/html', htmlContent);
          e.clipboardData?.setData('text/plain', plainText);
          e.preventDefault();
          success = true;
        };
        
        document.addEventListener('copy', listener);
        try { document.execCommand('copy'); } catch (e) {}
        document.removeEventListener('copy', listener);

        selection?.removeAllRanges();
        if (originalRange) selection?.addRange(originalRange);
        document.body.removeChild(dummy);

        return success;
      };

      copyWithClipboardApi().then((success) => {
        if (!success) {
          if (!copyWithExecCommand()) {
             // Ultimate raw text fallback
             const fallbackInput = document.createElement('textarea');
             fallbackInput.value = plainText;
             fallbackInput.style.position = 'fixed';
             fallbackInput.style.top = '0';
             fallbackInput.style.opacity = '0';
             document.body.appendChild(fallbackInput);
             fallbackInput.select();
             try { document.execCommand('copy'); } catch(e) {}
             document.body.removeChild(fallbackInput);
          }
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
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
          className={`text-xs flex items-center gap-1.5 transition-all duration-300 disabled:opacity-50 font-medium ${copied
            ? 'text-green-600 dark:text-green-400'
            : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
            }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              已複製 ✓
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              複製內容
            </>
          )}
        </button>
      </div>

      <div className={`
        w-full min-h-[150px] relative rounded-xl overflow-hidden transition-all duration-300
        bg-white border border-gray-200
        dark:bg-[#1E1E1E] dark:border-[#333]
        group-hover:border-blue-300 dark:group-hover:border-[#444]
        focus-within:border-blue-400 dark:focus-within:border-blue-500
        focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-0
      `}>
        {isHtml ? (
          <div
            className="w-full p-4 overflow-auto text-sm focus:outline-none SQLCode text-gray-800 dark:text-[#D4D4D4] min-h-[150px]"
            contentEditable
            suppressContentEditableWarning
            onInput={handleHtmlInput}
            dangerouslySetInnerHTML={{ __html: localContent }}
          />
        ) : (
          <OutputTextArea
            value={localContent}
            onChange={handleTextChange}
            placeholder={placeholder}
          />
        )}

        {!localContent && isHtml && (
          <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 text-sm italic pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};