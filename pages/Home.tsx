import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, TOOLS } from '../config';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic
  const filteredCategories = useMemo(() => {
     if (!searchTerm.trim()) return CATEGORIES;

     const term = searchTerm.toLowerCase();
     // Find tools that match
     const matchedTools = TOOLS.filter(t => 
        t.label.toLowerCase().includes(term) || 
        t.desc.toLowerCase().includes(term)
     );
     // Find categories that have at least one matched tool
     const matchedCategoryIds = new Set(matchedTools.map(t => t.categoryId));
     
     return CATEGORIES.filter(c => matchedCategoryIds.has(c.id));
  }, [searchTerm]);

  const getToolsByCategory = (categoryId: string) => {
      let tools = TOOLS.filter(t => t.categoryId === categoryId);
      if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          tools = tools.filter(t => 
            t.label.toLowerCase().includes(term) || 
            t.desc.toLowerCase().includes(term)
          );
      }
      return tools;
  };

  const cardClass = `
    relative group p-6 rounded-2xl dark:rounded-xl cursor-pointer flex flex-col h-full transition-all duration-300
    bg-white border border-gray-200 shadow-sm
    hover:border-blue-400/50 hover:shadow-lg hover:-translate-y-1
    dark:bg-[#18181a] dark:border-[#2d2d30] dark:shadow-none dark:hover:border-gray-500
  `;

  return (
    <div className="py-8 pb-20">
      {/* Hero / Search Section */}
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:text-gray-100 dark:bg-none">
          SQL Dev Toolkit
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 font-medium">
          提升開發效率的現代化工具箱
        </p>
        
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className="text-gray-400 dark:text-gray-500 text-xl">🔍</span>
            </div>
            <input 
                type="text" 
                className="w-full pl-14 pr-6 py-4 rounded-full 
                bg-white border border-gray-200 
                dark:bg-[#18181a] dark:border-[#3c4043]
                focus:border-blue-400 dark:focus:border-blue-500
                focus:ring-4 focus:ring-blue-100 dark:focus:ring-0
                shadow-lg dark:shadow-none
                transition-all duration-300
                text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-base font-medium"
                placeholder="搜尋工具 (例如: Json, Java, 比對...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
            />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-16">
        {filteredCategories.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12 rounded-3xl bg-white dark:bg-[#18181a] border border-gray-200 dark:border-[#2d2d30]">
                沒有找到符合「{searchTerm}」的工具。
            </div>
        ) : (
            filteredCategories.map((category) => {
                const categoryTools = getToolsByCategory(category.id);
                if (categoryTools.length === 0) return null;

                return (
                    <div key={category.id} className="animate-fade-in-up">
                        <div className="flex items-center gap-4 mb-6 px-2">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                                {category.label}
                            </h2>
                            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-[#3c4043] dark:to-transparent flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categoryTools.map((tool) => (
                                <div 
                                    key={tool.path}
                                    onClick={() => navigate(tool.path)}
                                    className={cardClass}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#202024] dark:to-[#1a1a20] border border-gray-200 dark:border-[#3c4043] flex items-center justify-center text-2xl shadow-sm dark:shadow-none group-hover:scale-110 transition-transform duration-300">
                                            {tool.icon}
                                        </div>
                                        <span className="opacity-0 group-hover:opacity-100 text-blue-500 dark:text-gray-400 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                            ↗
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {tool.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {tool.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default Home;