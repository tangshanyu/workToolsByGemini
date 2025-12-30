import React from 'react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-500/20",
    success: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white shadow-green-500/20",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-red-500/20",
    warning: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-orange-500/20",
    secondary: "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- TextArea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-gray-400 text-sm font-bold mb-2">{label}</label>}
      <textarea
        className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-y min-h-[150px] placeholder-gray-600 ${className}`}
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
      {label && <label className="block text-gray-400 text-sm font-bold mb-2">{label}</label>}
      <input
        className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-600 ${className}`}
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
    // For HTML content, we might want to copy the raw text, but strip tags first?
    // Or just copy exactly what is passed. Usually user wants text.
    // If it's HTML for display, we might want to copy plain text.
    // Simple approach: create temp element to strip tags for copy if HTML.
    let textToCopy = content;
    if (isHtml) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        textToCopy = temp.textContent || temp.innerText || "";
    }
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-gray-300 font-semibold">{title}</h3>
        <button 
          onClick={handleCopy}
          disabled={!content}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors disabled:opacity-50"
        >
          📋 複製 (純文字)
        </button>
      </div>
      <div className="w-full bg-gray-900/80 border border-gray-700 rounded-lg p-4 font-mono text-xs md:text-sm text-gray-300 whitespace-pre overflow-x-auto min-h-[60px] max-h-[300px]">
        {content ? (
            isHtml ? <div className="SQLCode" dangerouslySetInnerHTML={{__html: content}} /> : content
        ) : (
            <span className="text-gray-600 italic">{placeholder}</span>
        )}
      </div>
    </div>
  );
};