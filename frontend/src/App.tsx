import { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './styles/index.css';

import { Sidebar, TopRail, PlaceholderPage, DebugMode } from './components';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CompanyManagementPage = lazy(() => import('./pages/companies'));
const ParticipantsPage = lazy(() => import('./pages/Participants').then(m => ({ default: m.ParticipantsPage })));
const TemplateEditorPage = lazy(() => import('./pages/TemplateEditor').then(m => ({ default: m.TemplateEditorPage })));

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className={`app-shell ${sidebarCollapsed ? 'app-shell-sidebar-collapsed' : ''}`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        />
        <div className="workspace">
          <TopRail />
          <main className="workspace-main">
            <Suspense fallback={<div className="loading-fallback">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/companies" element={<CompanyManagementPage />} />
                <Route path="/participants" element={<ParticipantsPage />} />
                <Route path="/templates" element={<TemplateEditorPage />} />
                <Route
                  path="/forms"
                  element={<PlaceholderPage title="신청 폼 자동화" />}
                />
                <Route
                  path="/posters"
                  element={<PlaceholderPage title="포스터 자동화" />}
                />
              </Routes>
            </Suspense>
          </main>
        </div>
        <DebugMode />
      </div>
    </Router>
  );
}

export default App;
