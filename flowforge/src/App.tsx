import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import ProjectDetail from "./pages/ProjectDetail";
import TeamMembers from "./pages/TeamMembers";
import ActivityFeed from "./pages/ActivityFeed";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import Sprints from "./pages/Sprints";
import SprintDetail from "./pages/SprintDetail";
import TimeTracking from "./pages/TimeTracking";
import Webhooks from "./pages/Webhooks";
import AuditLogs from "./pages/AuditLogs";
import BoardShareManage from "./pages/BoardShareManage";
import BoardSharePublic from "./pages/BoardSharePublic";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookieConsent from "./components/CookieConsent";


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login onSwitchToRegister={() => window.location.href = "/register"} onSwitchToForgotPassword={() => window.location.href = "/forgot-password"} />} />
          <Route path="/register" element={<Register onSwitchToLogin={() => window.location.href = "/login"} />} />
          <Route path="/forgot-password" element={<ForgotPassword onBackToLogin={() => window.location.href = "/login"} />} />
          <Route path="/share/:token" element={<BoardSharePublic />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/board" element={<Kanban />} />
            <Route path="/projects" element={<ProjectDetail />} />
            <Route path="/team" element={<TeamMembers />} />
            <Route path="/activities" element={<ActivityFeed />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
            <Route path="/sprints" element={<Sprints />} />
            <Route path="/sprints/:id" element={<SprintDetail />} />
            <Route path="/time-tracking" element={<TimeTracking />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/board-shares/:projectId" element={<BoardShareManage />} />
          </Route>
        </Routes>
        <CookieConsent />
      </AuthProvider>
    </BrowserRouter>
  );
}
