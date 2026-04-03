import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import AdminDashboard, { AdminTeachersPage, AdminExamsPage, AdminAllocationPage } from "./pages/AdminDashboard";
import TeacherDashboard, { TeacherDutiesPage, TeacherAvailabilityPage } from "./pages/TeacherDashboard";
import NotFound from "./pages/NotFound";
import FairnessDashboard from "./pages/FairnessDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Auth />} />
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute requiredRole="admin"><AdminTeachersPage /></ProtectedRoute>} />
            <Route path="/admin/exams" element={<ProtectedRoute requiredRole="admin"><AdminExamsPage /></ProtectedRoute>} />
            <Route path="/admin/allocation" element={<ProtectedRoute requiredRole="admin"><AdminAllocationPage /></ProtectedRoute>} />
            {/* Teacher routes */}
            <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/duties" element={<ProtectedRoute requiredRole="teacher"><TeacherDutiesPage /></ProtectedRoute>} />
            <Route path="/teacher/availability" element={<ProtectedRoute requiredRole="teacher"><TeacherAvailabilityPage /></ProtectedRoute>} />
            <Route
              path="/fairness-dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <FairnessDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
