import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import '../styles/Layout.css';

// Sidebar menu configuration (Step 22.2.3.2.3)
const getMenu = (role) => {
    const isAdmin = role === 'admin';
    return [
        {
            section: 'MAIN',
            items: [
                { name: 'Chat Assistant', path: '/chat', icon: '💬' },
                ...(isAdmin ? [{ name: 'Data Studio', path: '/data-studio', icon: '📊' }] : []),
            ]
        },
        ...(isAdmin ? [{
            section: 'ORGANIZATION',
            items: [
                { name: 'User Management', path: '/users', icon: '👥' },
                { name: 'Domains & Subdomains', path: '/domains', icon: '🌐' },
                { name: 'Hierarchy Level', path: '/hierarchy', icon: '🏛️' },
                { name: 'Geography', path: '/geography', icon: '🗺️' },
                { name: 'Business Units', path: '/business-units', icon: '🏢' },
            ]
        }] : []),
        ...(isAdmin ? [{
            section: 'SECURITY',
            items: [
                { name: 'Column Security', path: '/security/csg', icon: '🛡️' },
                { name: 'Row Security', path: '/security/rsg', icon: '🔒' },
            ]
        }] : []),
        {
            section: 'PROFILE',
            items: [
                { name: 'My Profile', path: '/profile', icon: '👤' },
            ]
        }
    ];
};

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [profileData, setProfileData] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    // Parse once — stable reference, not recreated on every render
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    useEffect(() => {
        if (!userRaw && location.pathname !== '/') {
            navigate('/');
            return;
        }
        if (userRaw && !profileData) {
            API.get('users/me/')
                .then(res => setProfileData(res.data))
                .catch(err => console.error('Failed to fetch sidebar profile', err));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRaw, location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) return null;

    const menu = getMenu(user.role);

    return (
        <div className="layout-container">
            <aside className={`layout-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <img src="/logo.png" alt="Decision Minds" className="sidebar-logo" />
                    {!sidebarCollapsed && <h2 className="sidebar-title">Decision Minds</h2>}
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {menu.map((group) => (
                        <div key={group.section} className="nav-section">
                            {!sidebarCollapsed && (
                                <span className="nav-section-header">{group.section}</span>
                            )}
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    title={sidebarCollapsed ? item.name : ''}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {!sidebarCollapsed && (
                                        <span className="nav-label">{item.name}</span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div
                        className="user-profile"
                        onClick={() => navigate('/profile')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="avatar">
                            {profileData?.profile_photo ? (
                                <img
                                    src={profileData.profile_photo}
                                    alt="Avatar"
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                user.email.charAt(0).toUpperCase()
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="user-info">
                                <span className="user-email" title={user.email}>{user.email}</span>
                                <span className={`user-role-badge role-${user.role}`}>{user.role.toUpperCase()}</span>
                            </div>
                        )}
                    </div>

                    {!sidebarCollapsed && (
                        <>
                            <button className="theme-toggle-btn" onClick={toggleTheme}>
                                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                            </button>
                            <button className="logout-btn" onClick={handleLogout}>
                                🚪 Logout
                            </button>
                        </>
                    )}
                    {sidebarCollapsed && (
                        <button className="logout-btn icon-only" onClick={handleLogout} title="Logout">
                            🚪
                        </button>
                    )}
                </div>
            </aside>

            <main className="layout-main">
                <header className="main-header">
                    <button 
                        className="sidebar-toggle-btn" 
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        title={sidebarCollapsed ? "Open Sidebar" : "Close Sidebar"}
                    >
                        ☰
                    </button>
                    <div className="header-breadcrumbs">
                        <span className="breadcrumb-item">Decision Minds</span>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-active">
                            {location.pathname.split('/').filter(x => x).pop()?.replace(/-/g, ' ') || 'Dashboard'}
                        </span>
                    </div>
                </header>
                <div className={`layout-content${location.pathname === '/chat' ? ' fullpage' : ''}`}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
