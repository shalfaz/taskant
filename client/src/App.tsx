"use client";

import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute, GuestRoute, ProtectedRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";

function UnavailablePage() {
  const location = useLocation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">TaskAnt</p>
      <h1 className="mt-3 text-3xl font-bold text-gray-900">This page is not available yet</h1>
      <p className="mt-3 max-w-lg text-gray-600">
        The screen for <code className="rounded bg-gray-100 px-1.5 py-0.5">{location.pathname}</code>{" "}
        has not been implemented in this project yet.
      </p>
      <Link to="/" className="mt-6 font-medium text-brand-600 hover:underline">
        Return to the home page
      </Link>
    </main>
  );
}

function AdminDashboardPlaceholder() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8">
      <h2 className="text-xl font-semibold text-gray-900">Admin tools are not available yet</h2>
      <p className="mt-2 text-gray-600">
        The backend includes admin endpoints, but the admin screens have not been built.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
          </Route>

          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />

          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPlaceholder />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<UnavailablePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
