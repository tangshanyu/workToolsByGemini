import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { path: '/', label: '首頁', icon: '🏠' },
  { path: '/param-replace', label: '參數替換', icon: '🔧' },
  { path: '/question-mark', label: '問號轉換', icon: '❓' },
  { path: '/sql-to-java', label: 'Java 轉換', icon: '☕' },
  { path: '/obj-converter', label: '駝峰轉換', icon: '🐪' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="min-h-screen relative p-4 md:p-8 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {/* Ambient Background Effect */}
      <div className="fixed -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-[100px] pointer-events-none z-[-1] transition-colors duration-500" />
      <div className="fixed top-[20%] -right-[20%] w-[50%] h-[50%] rounded-full bg-purple-400/20 dark:bg-green-500/10 blur-[100px] pointer-events-none z-[-1] transition-colors duration-500" />

      <div className="max-w-6xl mx-auto glass-panel rounded-3xl shadow-2xl overflow-hidden min-h-[calc(100vh-60px)] flex flex-col transition-all duration-300">
        {/* Header */}
        <header className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700/50 bg-white/40 dark:bg-surface/20 backdrop-blur-md">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-green-400">
              SQL Dev Toolkit
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium">專業開發者的瑞士刀</p>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-yellow-400 transition-all shadow-sm hover:shadow-md"
            title={isDark ? "切換至亮色模式" : "切換至暗色模式"}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center flex-wrap bg-white/30 dark:bg-surface/30 border-b border-gray-200 dark:border-gray-700/50 backdrop-blur-md sticky top-0 z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-3 md:px-6 md:py-4 transition-all duration-200 flex items-center gap-2 text-sm md:text-base font-medium relative group
                ${isActive 
                  ? 'text-blue-600 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {/* Active Indicator */}
                  <span className={`absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-white/20 dark:bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;