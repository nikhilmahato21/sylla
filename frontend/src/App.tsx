import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthPage } from "@/pages/AuthPage";
import { LandingPage } from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SubjectsPage } from "@/pages/SubjectsPage";
import { TopicsPage } from "@/pages/TopicsPage";
import { AIToolsPage } from "@/pages/AIToolsPage";
import { StudyPlanPage } from "@/pages/StudyPlanPage";
import { ProgressPage } from "@/pages/ProgressPage";
import { RemindersPage } from "@/pages/RemindersPage";
import { PricingPage } from "@/pages/PricingPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { Toaster } from "@/components/ui/toaster";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const { refreshUser, token, user } = useAuthStore();

  useEffect(() => {
    if (token) refreshUser();
  }, []);

  return (
    <>
      <Routes>
        {/* Landing page for logged-out users, dashboard for logged-in */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

        {/* App shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId/topics" element={<TopicsPage />} />
          <Route path="topics" element={<TopicsPage />} />
          <Route path="ai" element={<AIToolsPage />} />
          <Route path="plans" element={<StudyPlanPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
