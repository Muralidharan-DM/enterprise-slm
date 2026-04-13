import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import Security from './pages/Security';
import DataStudio from './pages/DataStudio';
import ChatAnalytics from './pages/ChatAnalytics';
import Profile from './pages/Profile';
import Domains from './pages/Domains';
import HierarchyLevel from './pages/HierarchyLevel';
import Geography from './pages/Geography';
import BusinessUnits from './pages/BusinessUnits';
import UserForm from './pages/UserForm';
import Layout from './components/Layout';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user")); }
  catch { return null; }
};

function App() {
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    const user = getUser();
    if (!user) return <Navigate to="/" replace />;
    if (adminOnly && user.role !== 'admin') return <Navigate to="/chat" replace />;
    return <Layout>{children}</Layout>;
  };

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#1f2937', color: '#fff', borderRadius: '10px', border: '1px solid #374151' }
        }}
      />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Navigate to="/chat" replace />} />

        {/* MAIN */}
        <Route path="/chat" element={<ProtectedRoute><ChatAnalytics /></ProtectedRoute>} />
        <Route path="/data-studio" element={<ProtectedRoute adminOnly><DataStudio /></ProtectedRoute>} />

        {/* ORGANIZATION */}
        <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
        <Route path="/users/create" element={<ProtectedRoute adminOnly><UserForm mode="create" /></ProtectedRoute>} />
        <Route path="/users/edit/:id" element={<ProtectedRoute adminOnly><UserForm mode="edit" /></ProtectedRoute>} />
        <Route path="/domains" element={<ProtectedRoute adminOnly><Domains /></ProtectedRoute>} />
        <Route path="/hierarchy" element={<ProtectedRoute adminOnly><HierarchyLevel /></ProtectedRoute>} />
        <Route path="/geography" element={<ProtectedRoute adminOnly><Geography /></ProtectedRoute>} />
        <Route path="/business-units" element={<ProtectedRoute adminOnly><BusinessUnits /></ProtectedRoute>} />

        {/* SECURITY */}
        <Route path="/security/groups" element={<ProtectedRoute adminOnly><Security /></ProtectedRoute>} />

        {/* PROFILE */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
