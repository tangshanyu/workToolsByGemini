import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SqlToJava from './pages/SqlToJava';
import SqlParamReplacer from './pages/SqlParamReplacer';
import SqlQuestionMark from './pages/SqlQuestionMark';
import ParamObjectivizer from './pages/ParamObjectivizer';
import DiffViewer from './pages/DiffViewer';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sql-to-java" element={<SqlToJava />} />
          <Route path="/param-replace" element={<SqlParamReplacer />} />
          <Route path="/question-mark" element={<SqlQuestionMark />} />
          <Route path="/obj-converter" element={<ParamObjectivizer />} />
          <Route path="/diff-viewer" element={<DiffViewer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;