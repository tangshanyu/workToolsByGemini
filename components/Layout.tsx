import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { path: '/', label: '首頁', icon: '🏠' },
  { path: '/param-replace', label: '參數替換', icon: '🔧' },
  { path: '/question-mark', label: '問號轉換', icon: '❓' },
  { path: '/sql-to-java', label: 'Java 轉換', icon: '☕' },
  { path: '/obj-converter', label: '物件轉換', icon: '🐪' },
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
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 bg-[#F0F2F5] dark:bg-[#0e0e0f] text-[#1F1F1F] dark:text-[#E8EAED]">
      
      {/* Top Navbar - Google Studio Style */}
      <header className="h-16 border-b border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#18181a] flex items-center px-6 justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <NavLink to="/" className="flex items-center gap-1 group">
              {/* Logo updated: Pure text, no box/border */}
              <span className="font-extrabold text-2xl tracking-tight text-blue-600 dark:text-[#A8C7FA]">
                SQL
              </span>
              <span className="font-medium text-lg tracking-tight text-gray-600 dark:text-gray-300 ml-2 group-hover:text-blue-600 dark:group-hover:text-[#A8C7FA] transition-colors">
                Dev Toolkit
              </span>
           </NavLink>

           {/* Desktop Navigation */}
           <nav className="hidden md:flex items-center gap-1">
             {navItems.slice(1).map((item) => (
               <NavLink
                 key={item.path}
                 to={item.path}
                 className={({ isActive }) =>
                   `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                   ${isActive 
                     ? 'bg-blue-100 text-blue-700 dark:bg-[#004A77] dark:text-[#C2E7FF]' 
                     : 'text-gray-600 dark:text-[#E3E3E3] hover:bg-gray-100 dark:hover:bg-[#303134]'
                   }`
                 }
               >
                 <span>{item.icon}</span>
                 <span>{item.label}</span>
               </NavLink>
             ))}
           </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Nav Trigger (Simple placeholder) */}
          <div className="md:hidden">
             {/* You could add a dropdown menu here later */}
          </div>

          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#303134] text-gray-500 dark:text-[#E3E3E3] transition-colors"
            title={isDark ? "切換至亮色模式" : "切換至暗色模式"}
          >
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
           {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden border-t border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#18181a] flex justify-around p-2 text-xs safe-area-pb">
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({isActive}) => `flex flex-col items-center gap-1 p-2 rounded-lg ${isActive ? 'text-blue-600 dark:text-[#A8C7FA]' : 'text-gray-500 dark:text-[#E3E3E3]'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="scale-90">{item.label}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  );
};

export default Layout;