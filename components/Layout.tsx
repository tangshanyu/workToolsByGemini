import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Braces, ChevronLeft, ChevronRight, CircleHelp, Menu, Palette, ShieldCheck, X } from 'lucide-react';
import { CATEGORIES, TOOLS, getToolByPath } from '../config';
import { DEFAULT_THEME, applyThemePreference, isThemePreference } from '../utils/theme';
import { readPreference, writePreference } from '../utils/preferences';
import Appearance from './Appearance';
import { ToolIcon } from './Icons';

const SQL_LINKS = [
  { path: '/sql-format', label: 'SQL 格式化' }, { path: '/sql-to-java', label: 'SQL 轉 Java' },
  { path: '/param-replace', label: '參數替換' }, { path: '/question-mark', label: '問號轉換' },
];
export default function Layout({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState(() => readPreference('sql-toolkit.theme', DEFAULT_THEME, isThemePreference));
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => matchMedia('(max-width: 767px)').matches);
  const location = useLocation();
  const sqlWorkspace = SQL_LINKS.some(link => link.path === location.pathname);
  const currentTool = getToolByPath(location.pathname);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const media = matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    applyThemePreference(preference); writePreference('sql-toolkit.theme', preference);
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => applyThemePreference(preference);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [preference]);
  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close);
  }, [mobileOpen]);
  return <div className={`app-shell ${collapsed ? 'nav-collapsed' : ''}`}>
    <a href="#workspace" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('workspace')?.focus(); }}>跳到工作區</a>
    <header className="app-header">
      <div className="header-start"><button className="icon-button mobile-menu" aria-label={mobileOpen ? '關閉選單' : '開啟選單'} aria-expanded={mobileOpen} aria-controls="tool-navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
        <Link to="/sql-format" className="brand"><span className="brand-symbol"><Braces size={25} /></span><span>SQL <strong>Dev Toolkit</strong></span></Link>
      </div>
      <div className="header-context"><span className="context-dot" />{sqlWorkspace ? 'PoorSQL 工作空間' : '開發工具箱'}</div>
      <button className="appearance-trigger" onClick={() => setAppearanceOpen(true)} aria-label="外觀與主題色"><span className="appearance-color" style={{ backgroundColor: preference.seed }} /><Palette size={18} /><span>外觀</span></button>
    </header>
    {mobileOpen && <button className="nav-scrim" aria-label="關閉導覽選單" onClick={() => setMobileOpen(false)} />}
    <aside id="tool-navigation" inert={isMobile && !mobileOpen} className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-label"><span>工作空間</span><button className="icon-button collapse-navigation" aria-label={collapsed ? '展開導覽' : '收合導覽'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button></div>
      <nav aria-label="工具導覽"><div className="navigation-group">{SQL_LINKS.map(link => <NavLink key={link.path} to={link.path} title={collapsed ? link.label : undefined} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><ToolIcon path={link.path} /><span>{link.label}</span>{link.path === '/sql-format' && <small>PoorSQL</small>}</NavLink>)}</div>
        <div className="navigation-divider" />
        <NavLink to="/tools" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={collapsed ? '所有工具' : undefined}><ToolIcon path="/tools" /><span>所有工具</span></NavLink>
        {CATEGORIES.map(category => {
          const tools = TOOLS.filter(tool => tool.categoryId === category.id && !SQL_LINKS.some(link => link.path === tool.path));
          return tools.length ? <div className="navigation-group" key={category.id}><h2>{category.label.replace(/^\S+\s/, '')}</h2>{tools.map(tool => <NavLink to={tool.path} key={tool.path} title={collapsed ? tool.label : undefined} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><ToolIcon path={tool.path} /><span>{tool.label}</span></NavLink>)}</div> : null;
        })}
      </nav>
      <div className="sidebar-note"><ShieldCheck size={18} /><div><strong>資料留在你的瀏覽器</strong><p>貼上、整理、複製。自在工作。</p></div></div>
    </aside>
    <main id="workspace" tabIndex={-1} className={`workspace ${sqlWorkspace ? 'sql-workspace' : 'legacy-tools'}`}>
      <div className="workspace-inner">
        <div className="breadcrumbs"><Link to="/tools">工具箱</Link><span>/</span><span>{currentTool?.label || '所有工具'}</span></div>
        {sqlWorkspace && <nav className="workspace-tabs" aria-label="SQL 工作流程">{SQL_LINKS.map(link => <NavLink key={link.path} to={link.path} className={({ isActive }) => isActive ? 'active' : ''}>{link.label}</NavLink>)}</nav>}
        {children}
        <footer className="workspace-footer"><span>SQL Dev Toolkit</span><span><CircleHelp size={14} /> SQL 著色與格式化由 PoorSQL 提供</span></footer>
      </div>
    </main>
    <Appearance open={appearanceOpen} onClose={() => setAppearanceOpen(false)} preference={preference} onChange={setPreference} />
  </div>;
}
