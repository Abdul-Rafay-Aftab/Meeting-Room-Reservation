import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import RoomBooking from './pages/RoomBooking';
import MyReservations from './pages/MyReservations';
import Profile from './pages/Profile';
import ManageUsers from './pages/admin/ManageUsers';
import ManageRooms from './pages/admin/ManageRooms';
import SystemLogs from './pages/admin/SystemLogs';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard' } replace />;
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/book" element={
          <ProtectedRoute>
            <Layout>
              <RoomBooking />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reservations" element={
          <ProtectedRoute>
            <Layout>
              <MyReservations />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <ManageUsers />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/rooms" element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <ManageRooms />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/logs" element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <SystemLogs />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App; 