import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import SqlFormatter from './pages/SqlFormatter';
import { SqlColorsProvider } from './hooks/SqlColorsContext';
const Home = lazy(() => import('./pages/Home'));
const SqlToJava = lazy(() => import('./pages/SqlToJava'));
const SqlParamReplacer = lazy(() => import('./pages/SqlParamReplacer'));
const SqlQuestionMark = lazy(() => import('./pages/SqlQuestionMark'));
const ParamObjectivizer = lazy(() => import('./pages/ParamObjectivizer'));
const DiffViewer = lazy(() => import('./pages/DiffViewer'));
const JsonFormatter = lazy(() => import('./pages/JsonFormatter'));
const DomainConverter = lazy(() => import('./pages/DomainConverter'));
const CsvEditor = lazy(() => import('./pages/CsvEditor'));
const FixedWidthProcessor = lazy(() => import('./pages/FixedWidthProcessor'));
const VLookup = lazy(() => import('./pages/VLookup'));
export default function App() {
  return <SqlColorsProvider><HashRouter><Layout><Suspense fallback={<div className="route-loading" role="status">正在準備工作區…</div>}><Routes>
    <Route path="/" element={<Navigate to="/sql-format" replace />} />
    <Route path="/sql-format" element={<SqlFormatter />} />
    <Route path="/tools" element={<Home />} />
    <Route path="/sql-to-java" element={<SqlToJava />} /><Route path="/param-replace" element={<SqlParamReplacer />} />
    <Route path="/question-mark" element={<SqlQuestionMark />} /><Route path="/obj-converter" element={<ParamObjectivizer />} />
    <Route path="/diff-viewer" element={<DiffViewer />} /><Route path="/json-format" element={<JsonFormatter />} />
    <Route path="/domain-convert" element={<DomainConverter />} /><Route path="/csv-editor" element={<CsvEditor />} />
    <Route path="/fixed-width" element={<FixedWidthProcessor />} /><Route path="/vlookup" element={<VLookup />} />
    <Route path="*" element={<Navigate to="/sql-format" replace />} />
  </Routes></Suspense></Layout></HashRouter></SqlColorsProvider>;
}
