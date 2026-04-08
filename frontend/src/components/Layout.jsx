import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Layout.css';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Theme Management
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [profileData, setProfileData] = useState(null);
    
    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // User Management
    const user = JSON.parse(localStorage.getItem("user"));
    
    useEffect(() => {
        if (!user && location.pathname !== '/') {
            navigate('/');
        } else if (user) {
            fetchMyProfile();
        }
    }, [user, navigate, location]);

    const fetchMyProfile = async () => {
        try {
            const res = await API.get("users/me/");
            setProfileData(res.data);
        } catch (err) {
            console.error("Failed to fetch sidebar profile", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate('/');
    };

    if (!user) return null; // Or a loading spinner if needed before redirect

    return (
        <div className="layout-container">
            <aside className="layout-sidebar">
                <div className="sidebar-header" onClick={() => navigate('/data-studio')} style={{ cursor: 'pointer' }}>
                    <div className="logo-icon">📊</div>
                    <h2 className="sidebar-title">Decision Minds</h2>
                </div>
                
                <nav className="sidebar-nav">
                    <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        💬 Chat Assistant
                    </NavLink>
                    <NavLink to="/data-studio" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        📊 Data Studio
                    </NavLink>
                    <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        👥 Users & Roles
                    </NavLink>
                    <NavLink to="/security/csg" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        🛡️ Column Security
                    </NavLink>
                    <NavLink to="/security/rsg" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        🔒 Row Security
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        👤 My Profile
                    </NavLink>
                </nav>
                
                <div className="sidebar-footer">
                    <div className="user-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                        <div className="avatar">
                            {profileData?.profile_photo ? (
                                <img src={profileData.profile_photo} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                user.email.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="user-info">
                            <span className="user-email" title={user.email}>{user.email}</span>
                            <span className="user-role">{user.role}</span>
                        </div>
                    </div>
                    
                    <button className="theme-toggle-btn" onClick={toggleTheme}>
                        {theme === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
                    </button>
                    
                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </div>
            </aside>
            
            <main className="layout-main">
                <div className="layout-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
