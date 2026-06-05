import { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './styles/index.css';

import { Sidebar, TopRail, GlobalToast } from '@/components';
import { useCompanyStore, useCourseStore, useParticipantStore, useTemplateStore, useStatsStore, useInstructorStore } from '@/stores';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { supabase } from '@/api/supabase';

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CompanyManagementPage = lazy(() => import('@/pages/companies'));
const ParticipantsPage = lazy(() => import('@/pages/participants/ParticipantsPage').then(m => ({ default: m.ParticipantsPage })));
const CourseManagementPage = lazy(() => import('@/pages/education/CourseManagementPage').then(m => ({ default: m.CourseManagementPage })));
const InstructorManagementPage = lazy(() => import('@/pages/education/instructors').then(m => ({ default: m.InstructorManagementPage })));
const TemplateEditorPage = lazy(() => import('@/pages/templates').then(m => ({ default: m.TemplateEditorPage })));
const PosterAutomationPage = lazy(() => import('@/pages/posters/PosterAutomationPage').then(m => ({ default: m.PosterAutomationPage })));
const ApplicationsPage = lazy(() => import('@/pages/applications/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })));

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { fetchCourseGroups, subscribeToCourses } = useCourseStore();
  const { fetchCompanies, subscribeToCompanies } = useCompanyStore();
  const { fetchParticipants, subscribeToParticipants } = useParticipantStore();
  const { fetchTemplates, subscribeToTemplates } = useTemplateStore();
  const { fetchInstructors, subscribeToInstructors } = useInstructorStore();
  const { fetchStats, subscribeToStats } = useStatsStore();
  const { isAuthenticated, checkAuth } = useAuthStore();

  // Supabase 무료 플랜 잠금 방지 자동 핑 (5일 주기)
  useEffect(() => {
    if (isAuthenticated) {
      const checkAndAutoPing = async () => {
        const PING_STORAGE_KEY = 'supabase_last_ping';
        const AUTO_PING_INTERVAL_DAYS = 5;
        const stored = localStorage.getItem(PING_STORAGE_KEY);
        const lastPingDate = stored ? new Date(stored) : null;
        
        const needsPing = !lastPingDate || (Date.now() - lastPingDate.getTime()) >= AUTO_PING_INTERVAL_DAYS * 86400000;
        
        if (needsPing) {
          try {
            const { error: insertError } = await supabase.from('_keepalive').insert({});
            if (insertError) throw insertError;
            
            // 7일이 경과한 오래된 핑 로그 청소
            await supabase.from('_keepalive').delete().lt('pinged_at', new Date(Date.now() - 7 * 86400000).toISOString());
            
            localStorage.setItem(PING_STORAGE_KEY, new Date().toISOString());
            console.log('Supabase DB 자동 핑 연결 유지 성공 (5일 주기)');
          } catch (err: any) {
            console.error('Supabase DB 자동 핑 전송 실패:', err);
          }
        }
      };
      
      checkAndAutoPing();
      
      // 12시간마다 주기적으로 점검
      const interval = setInterval(checkAndAutoPing, 12 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

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
                element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>}
              />
              <Route
                path="/posters"
                element={<ProtectedRoute><PosterAutomationPage /></ProtectedRoute>}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
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
