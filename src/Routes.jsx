import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import Navbar from "components/Navbar";
import PrivateRoute from "components/PrivateRoute";
import NotFound from "pages/NotFound";
import Login from "pages/Login";
import Signup from "pages/Signup";
import Profile from "pages/Profile";
import AdminDashboard from "pages/AdminDashboard";
import MainDashboard from './pages/main-dashboard';
import SecurityChatbot from './pages/security-chatbot';
import TrafficDashboard from './pages/traffic-dashboard';
import SettingsDashboard from './pages/settings-dashboard';
import ReportsDashboard from './pages/reports-dashboard';
import AlertsDashboard from './pages/alerts-dashboard';
import NotificationsPage from './pages/notifications';
import SearchPage from './pages/search';
import SystemHealthPage from './pages/system-health';

const AppRoutes = () => {
  const { user, role } = useSelector(state => state.auth);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        {user && <Navbar />}
        <RouterRoutes>
          {/* Auth routes */}
          <Route path="/login" element={user ? <Navigate to={role === 'admin' ? '/dashboard/admin' : '/main-dashboard'} /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to={role === 'admin' ? '/dashboard/admin' : '/main-dashboard'} /> : <Signup />} />

          {/* Protected routes */}
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          <Route path="/dashboard/admin" element={
            <PrivateRoute requiredRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Existing protected routes - wrap with PrivateRoute */}
          <Route path="/" element={
            <PrivateRoute>
              <AlertsDashboard />
            </PrivateRoute>
          } />
          <Route path="/main-dashboard" element={
            <PrivateRoute>
              <MainDashboard />
            </PrivateRoute>
          } />
          <Route path="/security-chatbot" element={
            <PrivateRoute>
              <SecurityChatbot />
            </PrivateRoute>
          } />
          <Route path="/traffic-dashboard" element={
            <PrivateRoute>
              <TrafficDashboard />
            </PrivateRoute>
          } />
          <Route path="/settings-dashboard" element={
            <PrivateRoute>
              <SettingsDashboard />
            </PrivateRoute>
          } />
          <Route path="/reports-dashboard" element={
            <PrivateRoute>
              <ReportsDashboard />
            </PrivateRoute>
          } />
          <Route path="/alerts-dashboard" element={
            <PrivateRoute>
              <AlertsDashboard />
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          } />
          <Route path="/search" element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          } />
          <Route path="/system-health" element={
            <PrivateRoute>
              <SystemHealthPage />
            </PrivateRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppRoutes;
