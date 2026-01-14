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

  return (
    <div className="py-8 pb-20">
      {/* Hero / Search Section */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-white tracking-tight">
          SQL Dev Toolkit
        </h1>
        <p className="text-gray-500 dark:text-[#9AA0A6] text-lg mb-8">
          提升開發效率的現代化工具箱
        </p>
        
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input 
                type="text" 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-[#1e1e20] border-2 border-transparent focus:border-blue-500 dark:focus:border-[#A8C7FA] shadow-sm group-hover:shadow-md transition-all text-gray-800 dark:text-white placeholder-gray-400 outline-none text-base"
                placeholder="搜尋工具 (例如: Json, Java, 比對...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
            />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-12">
        {filteredCategories.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
                沒有找到符合「{searchTerm}」的工具。
            </div>
        ) : (
            filteredCategories.map((category) => {
                const categoryTools = getToolsByCategory(category.id);
                if (categoryTools.length === 0) return null;

                return (
                    <div key={category.id} className="animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-5 px-1">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-[#E8EAED] tracking-wide">
                                {category.label}
                            </h2>
                            <div className="h-px bg-gray-200 dark:bg-[#3c4043] flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {categoryTools.map((tool) => (
                                <div 
                                    key={tool.path}
                                    onClick={() => navigate(tool.path)}
                                    className="relative group bg-white dark:bg-[#18181a] p-5 rounded-xl border border-gray-200 dark:border-[#3c4043] hover:border-blue-400 dark:hover:border-[#A8C7FA] hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col h-full"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-[#202124] flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                                            {tool.icon}
                                        </div>
                                        <span className="opacity-0 group-hover:opacity-100 text-blue-600 dark:text-[#A8C7FA] transition-opacity">
                                            ↗
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-[#E3E3E3] mb-2 group-hover:text-blue-600 dark:group-hover:text-[#A8C7FA] transition-colors">
                                        {tool.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-[#9AA0A6] leading-relaxed">
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