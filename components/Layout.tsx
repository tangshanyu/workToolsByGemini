import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { path: '/', label: '首頁', icon: '🏠' },
  { path: '/param-replace', label: '參數替換', icon: '🔧' },
  { path: '/question-mark', label: '問號轉換', icon: '❓' },
  { path: '/sql-to-java', label: 'Java 轉換', icon: '☕' },
  { path: '/obj-converter', label: '物件轉換', icon: '📦' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen relative p-4 md:p-8 font-sans text-gray-100">
      {/* Ambient Background Effect */}
      <div className="fixed -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none z-[-1]" />
      <div className="fixed top-[20%] -right-[20%] w-[50%] h-[50%] rounded-full bg-green-500/10 blur-[100px] pointer-events-none z-[-1]" />

      <div className="max-w-5xl mx-auto glass-panel rounded-2xl shadow-2xl overflow-hidden min-h-[calc(100vh-60px)] flex flex-col">
        {/* Header */}
        <header className="p-6 text-center border-b border-gray-700/50 bg-surface/20">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
            SQL 工具集
          </h1>
          <p className="text-gray-400 text-sm md:text-base">專業的開發輔助工具，提高您的效率</p>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center flex-wrap bg-surface/30 border-b border-gray-700/50 backdrop-blur-md sticky top-0 z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-3 md:px-6 md:py-4 transition-all duration-200 flex items-center gap-2 text-sm md:text-base font-medium
                ${isActive 
                  ? 'bg-blue-500/20 text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-blue-300'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;