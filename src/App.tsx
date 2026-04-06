import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import AdminDashboard, { AdminTeachersPage, AdminExamsPage, AdminAllocationPage, AdminFairnessPage, AdminSimulationPage, AdminRuleManagementPage, AdminConflictDetectionPage, AdminDataHubPage } from "./pages/AdminDashboard";
import TeacherDashboard, { TeacherDutiesPage, TeacherAvailabilityPage, TeacherAssistantPage } from "./pages/TeacherDashboard";
import ContributorsPage from './pages/ContributorsPage';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/contributors" element={<ContributorsPage />} />
              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/teachers" element={<ProtectedRoute requiredRole="admin"><AdminTeachersPage /></ProtectedRoute>} />
              <Route path="/admin/exams" element={<ProtectedRoute requiredRole="admin"><AdminExamsPage /></ProtectedRoute>} />
              <Route path="/admin/allocation" element={<ProtectedRoute requiredRole="admin"><AdminAllocationPage /></ProtectedRoute>} />
              <Route path="/admin/fairness" element={<ProtectedRoute requiredRole="admin"><AdminFairnessPage /></ProtectedRoute>} />
              <Route path="/admin/simulation" element={<ProtectedRoute requiredRole="admin"><AdminSimulationPage /></ProtectedRoute>} />
              <Route path="/admin/rules" element={<ProtectedRoute requiredRole="admin"><AdminRuleManagementPage /></ProtectedRoute>} />
              <Route path="/admin/conflicts" element={<ProtectedRoute requiredRole="admin"><AdminConflictDetectionPage /></ProtectedRoute>} />
              <Route path="/admin/data-hub" element={<ProtectedRoute requiredRole="admin"><AdminDataHubPage /></ProtectedRoute>} />
              {/* Teacher routes */}
              <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/duties" element={<ProtectedRoute requiredRole="teacher"><TeacherDutiesPage /></ProtectedRoute>} />
              <Route path="/teacher/availability" element={<ProtectedRoute requiredRole="teacher"><TeacherAvailabilityPage /></ProtectedRoute>} />
              <Route path="/teacher/assistant" element={<ProtectedRoute requiredRole="teacher"><TeacherAssistantPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
