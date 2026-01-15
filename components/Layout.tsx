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
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300 font-sans text-gray-800 dark:text-gray-100 bg-[#F3F4F6] dark:bg-[#0e0e0f]">
      
      {/* --- Background Effects Layer (Light Mode Only) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* LIGHT MODE: Floating Blobs (Pastel) */}
        <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* DARK MODE: Clean Solid Background (No Effects) - Managed by parent div bg color */}
      </div>

      {/* --- Header --- */}
      {/* Light: Glass | Dark: Solid #0e0e0f with border */}
      <header className="fixed top-0 left-0 right-0 h-16 z-[60] px-4 flex items-center justify-between
        bg-white/70 backdrop-blur-xl border-b border-white/50 
        dark:bg-[#0e0e0f] dark:border-[#2d2d30] dark:backdrop-blur-none
        transition-all duration-300 shadow-sm dark:shadow-none">
          
          <div className="flex items-center gap-4">
             {/* Mobile Hamburger */}
             <button 
               className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             >
               ☰
             </button>

             {/* Logo */}
             <div 
               onClick={() => navigate('/')} 
               className="flex items-center gap-3 cursor-pointer mr-8 select-none group"
             >
                <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 transition-all duration-300
                    bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg
                    dark:from-blue-600 dark:to-blue-700 dark:shadow-none
                    group-hover:scale-110
                `}>
                  SQL
                </div>
                <div className="font-bold text-lg tracking-tight whitespace-nowrap hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:text-gray-200 dark:bg-none">
                  Dev Toolkit
                </div>
             </div>

             {/* Breadcrumbs */}
             <nav className="hidden md:flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span 
                  className="hover:text-blue-600 dark:hover:text-gray-200 cursor-pointer transition-colors font-medium"
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
                    <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                       {currentTool.icon} {currentTool.label}
                    </span>
                  </>
                )}
             </nav>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                bg-gray-100/50 hover:bg-gray-200/50 text-gray-600
                dark:bg-[#18181a] dark:hover:bg-[#2d2d30] dark:text-yellow-400 dark:border dark:border-[#3c4043]
              `}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- Sidebar --- */}
      {/* Light: Glass | Dark: Solid #0e0e0f with border */}
      <aside 
        className={`
          fixed top-16 bottom-0 left-0 z-50
          bg-white/40 backdrop-blur-xl border-r border-white/60
          dark:bg-[#0e0e0f] dark:border-[#2d2d30] dark:backdrop-blur-none
          transition-all duration-300 ease-in-out flex flex-col group
          ${isSidebarOpen ? 'w-64' : 'w-20'}
          ${isMobileMenuOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Floating Border Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`
            absolute -right-3 top-6 z-50 hidden md:flex
            w-6 h-6 items-center justify-center
            bg-white border border-gray-200 
            dark:bg-[#18181a] dark:border-[#3c4043] dark:text-gray-400
            rounded-full shadow-md 
            text-gray-500 hover:text-blue-600 dark:hover:text-white
            hover:scale-110 transition-all duration-200
            cursor-pointer
          `}
        >
           <svg 
             className={`w-3 h-3 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} 
             fill="none" 
             stroke="currentColor" 
             viewBox="0 0 24 24"
           >
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
           </svg>
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin px-3">
          {CATEGORIES.map(category => {
            const categoryTools = TOOLS.filter(t => t.categoryId === category.id);
            if (categoryTools.length === 0) return null;

            return (
              <div key={category.id}>
                 {(isSidebarOpen || isMobileMenuOpen) && (
                   <h3 className="px-3 mb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-fade-in pl-4">
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
                         `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                         ${!isSidebarOpen && !isMobileMenuOpen ? 'justify-center' : ''}
                         ${isActive 
                           ? 'bg-white/80 text-blue-600 shadow-sm ring-1 ring-black/5 dark:bg-[#202124] dark:text-blue-400 dark:ring-0' 
                           : 'text-gray-600 hover:bg-white/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#18181a] dark:hover:text-gray-200'
                         }`
                       }
                     >
                       <span className={`text-lg shrink-0 transition-transform duration-300 ${isSidebarOpen ? '' : 'scale-110'}`}>{tool.icon}</span>
                       <span className={`whitespace-nowrap transition-all duration-200 ${(isSidebarOpen || isMobileMenuOpen) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 w-0 hidden'}`}>
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

      {/* --- Main Content Wrapper --- */}
      <main 
        className={`
          flex-1 pt-20 min-h-screen transition-all duration-300 ease-in-out relative z-10
          ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}
        `}
      >
           <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in-up">
             {children}
           </div>
      </main>
    </div>
  );
};

export default Layout;