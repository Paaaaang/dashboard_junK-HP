import { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './styles/index.css';

import { Sidebar, TopRail, PlaceholderPage, DebugMode, GlobalToast } from './components';
import { useCompanyStore, useCourseStore, useParticipantStore, useTemplateStore } from './stores';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CompanyManagementPage = lazy(() => import('./pages/companies'));
const ParticipantsPage = lazy(() => import('./pages').then(m => ({ default: m.ParticipantsPage })));
const CourseManagementPage = lazy(() => import('./pages').then(m => ({ default: m.CourseManagementPage })));
const TemplateEditorPage = lazy(() => import('./pages/TemplateEditor').then(m => ({ default: m.TemplateEditorPage })));

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { fetchCourseGroups } = useCourseStore();
  const { fetchCompanies } = useCompanyStore();
  const { fetchParticipants } = useParticipantStore();
  const { fetchTemplates } = useTemplateStore();

  useEffect(() => {
    // Initial data load
    fetchCourseGroups();
    fetchCompanies();
    fetchParticipants();
    fetchTemplates();
  }, [fetchCourseGroups, fetchCompanies, fetchParticipants, fetchTemplates]);

  return (
    <Router>
      <div className="flex h-screen w-full bg-background text-text-primary font-sans overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <TopRail />
          <main className="flex-1 overflow-y-auto p-6 scroll-smooth bg-background/50">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/companies" element={<CompanyManagementPage />} />
                <Route path="/participants" element={<ParticipantsPage />} />
                <Route path="/courses" element={<CourseManagementPage />} />
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
        <GlobalToast />
      </div>
    </Router>
  );
}

export default App;
