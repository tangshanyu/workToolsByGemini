import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORIES, TOOLS } from '../config';
import { ToolIcon } from '../components/Icons';
export default function Home() {
  const [search, setSearch] = useState('');
  const tools = TOOLS.filter(tool => (tool.label + tool.desc).toLowerCase().includes(search.trim().toLowerCase()));
  return <div><div className="tools-hero"><div className="hero-eyebrow">YOUR EVERYDAY TOOLBOX</div><h1>小工具，讓工作順一點。</h1><p>從 SQL 到資料整理，把重複的步驟交給工具箱。</p></div><div className="tools-search"><Search size={18} /><input aria-label="搜尋工具" placeholder="搜尋 SQL、Java、JSON、比對…" value={search} onChange={event => setSearch(event.target.value)} /></div>
    {!tools.length && <p className="muted">沒有符合「{search}」的工具。</p>}
    {CATEGORIES.map(category => { const group = tools.filter(tool => tool.categoryId === category.id); return group.length ? <section className="tool-category" key={category.id}><h2>{category.label.replace(/^\S+\s/, '')}</h2><div className="tool-grid">{group.map(tool => <Link className="tool-card" to={tool.path} key={tool.path}><span className="tonal-icon"><ToolIcon path={tool.path} size={23} /></span><h3>{tool.label}</h3><p>{tool.desc}</p></Link>)}</div></section> : null; })}
  </div>;
}
