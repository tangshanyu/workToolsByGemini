import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: '🔧 SQL 參數替換工具',
      desc: "自動掃描 SQL 語句中的參數佔位符（如 'Parm1', 'Parm2'），並提供輸入界面進行批量替換，適合測試和調試 SQL 語句。",
      path: '/param-replace',
      color: 'border-blue-500/50 hover:border-blue-500'
    },
    {
      title: '❓ SQL 問號轉換工具',
      desc: "將含有問號佔位符的 SQL 語句轉換為實際參數值，支援陣列格式參數輸入，方便進行 SQL 調試。",
      path: '/question-mark',
      color: 'border-green-500/50 hover:border-green-500'
    },
    {
      title: '☕ SQL 轉 Java 工具',
      desc: "將 SQL 語句轉換為 Java StringBuilder.append() 格式，支援駝峰命名、註釋處理、排版保持和 HibernateScalarHelper 生成。",
      path: '/sql-to-java',
      color: 'border-orange-500/50 hover:border-orange-500'
    },
    {
      title: '📦 物件轉換工具',
      desc: "將 JavaScript 參數串轉換成 amPopUpWindowPost 物件格式，支援自動解析 URL 和參數。",
      path: '/obj-converter',
      color: 'border-purple-500/50 hover:border-purple-500'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-4">歡迎使用 SQL 工具集</h2>
        <p className="text-gray-400">這是一套專為開發者設計的工具集合，採用現代化的液體玻璃設計風格，幫助您更高效地進行開發工作。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div 
            key={tool.path}
            onClick={() => navigate(tool.path)}
            className={`glass-panel p-6 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border ${tool.color} group`}
          >
            <h3 className="text-xl font-bold mb-3 text-gray-200 group-hover:text-white">{tool.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {tool.desc}
            </p>
            <div className="text-right">
              <span className="text-sm font-semibold text-blue-400 group-hover:text-blue-300">開始使用 →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;