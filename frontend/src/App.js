import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      <p>Role: <strong>{user.role}</strong></p>
      
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <Link to="/users" style={{ 
          padding: "0.75rem 1.5rem", 
          background: "#1a2a6c", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "6px" 
        }}>
          Manage Users
        </Link>
        <button onClick={() => {
          localStorage.removeItem("user");
          window.location.href = "/";
        }} style={{ padding: "0.75rem 1.5rem", cursor: "pointer" }}>
          Logout
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
