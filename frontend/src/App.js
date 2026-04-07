import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import CSG from "./pages/CSG";
import RSG from "./pages/RSG";
import DataStudio from "./pages/DataStudio";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <img src="/logo.png" alt="Decision Minds" style={{ width: '60px', marginBottom: '1rem' }} />
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      <p>Role: <strong>{user.role}</strong></p>
      
      <div style={{ marginTop: "2rem", display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
        <Link to="/users" style={{ 
          padding: "0.85rem 1.7rem", 
          background: "#1a2a6c", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "8px",
          fontWeight: "600"
        }}>
          Manage Users
        </Link>
        
        <Link to="/security/csg" style={{ 
          padding: "0.85rem 1.7rem", 
          background: "#b21f1f", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "8px",
          fontWeight: "600"
        }}>
          Column Security (CSG)
        </Link>

        <Link to="/security/rsg" style={{ 
          padding: "0.85rem 1.7rem", 
          background: "#fdbb2d", 
          color: "#1a2a6c", 
          textDecoration: "none", 
          borderRadius: "8px",
          fontWeight: "600"
        }}>
          Row Security (RSG)
        </Link>
        
        <Link to="/data-studio" style={{ 
          padding: "0.85rem 1.7rem", 
          background: "#4facfe", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "8px",
          fontWeight: "600"
        }}>
          Data Studio Explorer
        </Link>

        <button onClick={() => {
          localStorage.removeItem("user");
          window.location.href = "/";
        }} style={{ padding: "0.85rem 1.7rem", cursor: "pointer", borderRadius: "8px", background: "#f0f0f0", border: "1px solid #ddd" }}>
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
        <Route path="/security/csg" element={<CSG />} />
        <Route path="/security/rsg" element={<RSG />} />
        <Route path="/data-studio" element={<DataStudio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
