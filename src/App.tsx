import { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './styles/index.css';

import { Sidebar, TopRail, PlaceholderPage, DebugMode, GlobalToast } from '@/components';
import { useCompanyStore, useCourseStore, useParticipantStore, useTemplateStore, useStatsStore, useInstructorStore } from '@/stores';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CompanyManagementPage = lazy(() => import('@/pages/companies'));
const ParticipantsPage = lazy(() => import('@/pages/participants/ParticipantsPage').then(m => ({ default: m.ParticipantsPage })));
const CourseManagementPage = lazy(() => import('@/pages/education/CourseManagementPage').then(m => ({ default: m.CourseManagementPage })));
const InstructorManagementPage = lazy(() => import('@/pages/education/instructors').then(m => ({ default: m.InstructorManagementPage })));
const TemplateEditorPage = lazy(() => import('@/pages/templates').then(m => ({ default: m.TemplateEditorPage })));

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { fetchCourseGroups, subscribeToCourses } = useCourseStore();
  const { fetchCompanies, subscribeToCompanies } = useCompanyStore();
  const { fetchParticipants, subscribeToParticipants } = useParticipantStore();
  const { fetchTemplates, subscribeToTemplates } = useTemplateStore();
  const { fetchInstructors, subscribeToInstructors } = useInstructorStore();
  const { fetchStats, subscribeToStats } = useStatsStore();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCourseGroups();
      fetchCompanies();
      fetchParticipants();
      fetchTemplates();
      fetchInstructors();
      fetchStats();

      const unsubCompanies = subscribeToCompanies();
      const unsubParticipants = subscribeToParticipants();
      const unsubCourses = subscribeToCourses();
      const unsubTemplates = subscribeToTemplates();
      const unsubInstructors = subscribeToInstructors();
      const unsubStats = subscribeToStats();

      return () => {
        unsubCompanies();
        unsubParticipants();
        unsubCourses();
        unsubTemplates();
        unsubInstructors();
        unsubStats();
      };
    }
  }, [
    isAuthenticated, 
    fetchCourseGroups, subscribeToCourses,
    fetchCompanies, subscribeToCompanies,
    fetchParticipants, subscribeToParticipants,
    fetchTemplates, subscribeToTemplates,
    fetchInstructors, subscribeToInstructors,
    fetchStats, subscribeToStats
  ]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-text-primary font-sans overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopRail />
        <main className="flex-1 overflow-y-auto px-6 pb-6 scroll-smooth bg-background/50">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/companies" element={<ProtectedRoute><CompanyManagementPage /></ProtectedRoute>} />
              <Route path="/participants" element={<ProtectedRoute><ParticipantsPage /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><CourseManagementPage /></ProtectedRoute>} />
              <Route path="/instructors" element={<ProtectedRoute><InstructorManagementPage /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><TemplateEditorPage /></ProtectedRoute>} />
              <Route
                path="/forms"
                element={<ProtectedRoute><PlaceholderPage title="신청 폼 자동화" /></ProtectedRoute>}
              />
              <Route
                path="/posters"
                element={<ProtectedRoute><PlaceholderPage title="포스터 자동화" /></ProtectedRoute>}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <DebugMode />
      <GlobalToast />
    </div>
  );
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </Router>
  );
}

export default App;
