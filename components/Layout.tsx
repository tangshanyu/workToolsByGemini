import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CATEGORIES, TOOLS, getCategoryByToolPath, getToolByPath } from '../config';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
      if (typeof window !== 'undefined' && window.matchMedia) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return true;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile toggle
  
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
      setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // --- Breadcrumbs Logic ---
  const currentTool = getToolByPath(location.pathname);
  const currentCategory = currentTool ? getCategoryByToolPath(location.pathname) : null;

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0e0e0f] text-[#1F1F1F] dark:text-[#E8EAED] transition-colors duration-200 font-sans">
      
      {/* Top Fixed Header (Full Width) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#18181a] border-b border-gray-200 dark:border-[#3c4043] flex items-center justify-between px-4 z-[60]">
          <div className="flex items-center gap-4">
             {/* Mobile Hamburger */}
             <button 
               className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             >
               ☰
             </button>

             {/* Logo - Always visible at top */}
             <div 
               onClick={() => navigate('/')} 
               className="flex items-center gap-3 cursor-pointer mr-8 select-none"
             >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-blue-900/20">
                  SQL
                </div>
                <div className="font-bold text-lg tracking-tight whitespace-nowrap hidden sm:block">
                  Dev Toolkit
                </div>
             </div>

             {/* Breadcrumbs */}
             <nav className="hidden md:flex items-center text-sm text-gray-500 dark:text-[#9AA0A6]">
                <span 
                  className="hover:text-blue-600 dark:hover:text-[#A8C7FA] cursor-pointer transition-colors"
                  onClick={() => navigate('/')}
                >
                  首頁
                </span>
                {currentCategory && (
                  <div className="hidden lg:flex items-center">
                    <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
                    <span>{currentCategory.label}</span>
                  </div>
                )}
                {currentTool && (
                  <>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
                    <span className="font-medium text-gray-900 dark:text-[#E8EAED] flex items-center gap-2">
                       {currentTool.icon} {currentTool.label}
                    </span>
                  </>
                )}
             </nav>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#303134] text-gray-500 dark:text-[#E3E3E3] transition-colors"
              title={isDark ? "切換至亮色模式" : "切換至暗色模式"}
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Below Header) */}
      <aside 
        className={`
          fixed top-16 bottom-0 left-0 z-50
          bg-white dark:bg-[#18181a] border-r border-gray-200 dark:border-[#3c4043]
          transition-all duration-300 ease-in-out flex flex-col group
          ${isSidebarOpen ? 'w-64' : 'w-20'}
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Floating Border Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`
            absolute -right-3 top-6 z-50 hidden md:flex
            w-6 h-6 items-center justify-center
            bg-white dark:bg-[#18181a]
            border border-gray-200 dark:border-[#3c4043]
            rounded-full shadow-sm 
            text-gray-500 hover:text-blue-600 dark:hover:text-[#A8C7FA]
            hover:scale-110 transition-all duration-200
            cursor-pointer
          `}
          title={isSidebarOpen ? "收起側邊欄" : "展開側邊欄"}
        >
           <svg 
             className={`w-3.5 h-3.5 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} 
             fill="none" 
             stroke="currentColor" 
             viewBox="0 0 24 24"
           >
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
           </svg>
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin">
          {CATEGORIES.map(category => {
            const categoryTools = TOOLS.filter(t => t.categoryId === category.id);
            if (categoryTools.length === 0) return null;

            return (
              <div key={category.id} className="px-3">
                 {(isSidebarOpen || isMobileMenuOpen) && (
                   <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider animate-fade-in">
                     {category.label.replace(/^[^\s]+\s/, '')}
                   </h3>
                 )}
                 <div className="space-y-1">
                   {categoryTools.map(tool => (
                     <NavLink
                       key={tool.path}
                       to={tool.path}
                       title={!isSidebarOpen && !isMobileMenuOpen ? tool.label : ''}
                       className={({ isActive }) =>
                         `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                         ${!isSidebarOpen && !isMobileMenuOpen ? 'justify-center' : ''}
                         ${isActive 
                           ? 'bg-blue-50 dark:bg-[#004A77] text-blue-700 dark:text-[#C2E7FF]' 
                           : 'text-gray-700 dark:text-[#9AA0A6] hover:bg-gray-100 dark:hover:bg-[#303134] hover:text-gray-900 dark:hover:text-[#E8EAED]'
                         }`
                       }
                     >
                       <span className="text-lg shrink-0">{tool.icon}</span>
                       <span className={`whitespace-nowrap transition-opacity duration-200 ${(isSidebarOpen || isMobileMenuOpen) ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                         {tool.label}
                       </span>
                     </NavLink>
                   ))}
                 </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <main 
        className={`
          flex-1 pt-16 min-h-screen transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}
        `}
      >
           <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
             {children}
           </div>
      </main>
    </div>
  );
};

export default Layout;