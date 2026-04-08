import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import CSG from './pages/CSG';
import RSG from './pages/RSG';
import DataStudio from './pages/DataStudio';
import ChatAnalytics from './pages/ChatAnalytics';
import Profile from './pages/Profile';
import Domains from './pages/Domains';
import HierarchyLevel from './pages/HierarchyLevel';
import Geography from './pages/Geography';
import BusinessUnits from './pages/BusinessUnits';
import Layout from './components/Layout';

function App() {
  const ProtectedRoute = ({ children }) => {
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

        {/* Redirect legacy /dashboard to chat */}
        <Route path="/dashboard" element={<Navigate to="/chat" replace />} />

        {/* MAIN */}
        <Route path="/chat" element={<ProtectedRoute><ChatAnalytics /></ProtectedRoute>} />
        <Route path="/data-studio" element={<ProtectedRoute><DataStudio /></ProtectedRoute>} />

        {/* ORGANIZATION */}
        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/domains" element={<ProtectedRoute><Domains /></ProtectedRoute>} />
        <Route path="/hierarchy" element={<ProtectedRoute><HierarchyLevel /></ProtectedRoute>} />
        <Route path="/geography" element={<ProtectedRoute><Geography /></ProtectedRoute>} />
        <Route path="/business-units" element={<ProtectedRoute><BusinessUnits /></ProtectedRoute>} />

        {/* SECURITY */}
        <Route path="/security/csg" element={<ProtectedRoute><CSG /></ProtectedRoute>} />
        <Route path="/security/rsg" element={<ProtectedRoute><RSG /></ProtectedRoute>} />

        {/* PROFILE */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
