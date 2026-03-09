import { Routes, Route, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { SchedulingPage } from "./pages/SchedulingPage";
import { SignupPage } from "./pages/SignupPage";
import { SigninPage } from "./pages/SigninPage";
import { RecoverPage } from "./pages/RecoverPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreatePagePage } from "./pages/CreatePagePage";
import { EditPagePage } from "./pages/EditPagePage";
import { RequestsPage } from "./pages/RequestsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { NavBar } from "./components/NavBar";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith("/s/") || pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-surface-base text-content">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {!hideNav && <NavBar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signin" element={<SigninPage />} />
        <Route path="/recover" element={<RecoverPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/new"
          element={
            <ProtectedRoute>
              <CreatePagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/edit/:id"
          element={
            <ProtectedRoute>
              <EditPagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pages/:id/requests"
          element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/s/:slug" element={<SchedulingPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
