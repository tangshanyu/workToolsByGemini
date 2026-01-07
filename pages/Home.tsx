import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: 'SQL 參數替換',
      icon: '🔧',
      desc: "自動掃描 SQL 語句中的參數佔位符（如 'Parm1'），提供界面批量替換值。",
      path: '/param-replace',
    },
    {
      title: 'SQL 問號轉換',
      icon: '❓',
      desc: "將含有問號 (?) 的 SQL 語句轉換為實際參數值，支援陣列格式輸入。",
      path: '/question-mark',
    },
    {
      title: 'SQL 轉 Java',
      icon: '☕',
      desc: "將 SQL 轉換為 Java StringBuilder 格式，支援 Hibernate Scalar 生成。",
      path: '/sql-to-java',
    },
    {
      title: '物件命名轉換',
      icon: '🐪',
      desc: "雙向轉換資料庫欄位 (USER_ID) 與 Java 屬性 (userId)，支援批次處理。",
      path: '/obj-converter',
    },
    {
      title: '文件比對工具',
      icon: '⚖️',
      desc: "左右並排比對兩段文字或代碼的差異，支援行數統計與顏色高亮顯示。",
      path: '/diff-viewer',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Welcome to SQL Dev Toolkit</h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          專為開發者設計的 SQL 輔助工具集，提升您的開發效率。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div 
            key={tool.path}
            onClick={() => navigate(tool.path)}
            className="rounded-xl p-6 cursor-pointer group transition-all relative overflow-hidden bg-white dark:bg-[#161618] border border-gray-200 dark:border-[#3c4043] hover:border-blue-400 dark:hover:border-[#A8C7FA] shadow-sm hover:shadow-md"
          >
            <div className="flex items-start gap-4">
               <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-[#004A77] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                 {tool.icon}
               </div>
               <div className="flex-1">
                 <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#A8C7FA] transition-colors">
                    {tool.title}
                 </h3>
                 <p className="text-gray-600 dark:text-gray-100 text-sm leading-relaxed">
                   {tool.desc}
                 </p>
               </div>
            </div>
            
            {/* Hover Indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
               <span className="text-blue-600 dark:text-[#A8C7FA]">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;