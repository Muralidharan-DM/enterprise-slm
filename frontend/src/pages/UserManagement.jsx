import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/UserManagement.css';

/* Initials avatar */
const Avatar = ({ name, role }) => {
    const initials = (name || '?')
        .split(/[\s_-]/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return <div className={`um-avatar ${role}`}>{initials}</div>;
};

/* Stat card */
const StatCard = ({ label, value, color }) => (
    <div className="um-stat-card" style={{ borderTopColor: color, borderTopWidth: 3 }}>
        <div className="um-stat-value" style={{ color }}>{value}</div>
        <div className="um-stat-label">{label}</div>
    </div>
);

/* Dash for empty cells */
const Dash = () => (
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
);

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await API.get('users/');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await API.delete(`users/delete/${confirmDelete.id}/`);
            toast.success(`"${confirmDelete.name}" deleted`);
            setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Delete failed');
        } finally {
            setConfirmDelete(null);
        }
    };

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q);
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const admins = users.filter(u => u.role === 'admin').length;
    const regular = users.filter(u => u.role === 'user').length;

    return (
        <div className="user-management-container">

            {/* ── Header ── */}
            <div className="um-header">
                <div>
                    <h1 className="page-title" style={{ marginBottom: 4 }}>User Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Manage identities, roles, and access across the enterprise.
                    </p>
                </div>
                <button className="um-create-btn" onClick={() => navigate('/users/create')}>
                    + Create User
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="um-stats-row">
                <StatCard label="Total Users" value={users.length} color="#6366f1" />
                <StatCard label="Admins" value={admins} color="#8b5cf6" />
                <StatCard label="Regular Users" value={regular} color="#10b981" />
            </div>

            {/* ── Filters ── */}
            <div className="um-filters">
                <div className="um-search-wrap">
                    <svg className="um-search-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        className="um-search-input"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="um-role-filter">
                    {[
                        { key: 'all',   label: 'All' },
                        { key: 'admin', label: 'Admins' },
                        { key: 'user',  label: 'Users' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            className={`um-filter-btn ${roleFilter === key ? 'active' : ''}`}
                            onClick={() => setRoleFilter(key)}
                        >{label}</button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="um-table-card">
                {loading ? (
                    <div className="um-loading">
                        <div className="um-spinner" />
                        Loading users…
                    </div>
                ) : (
                    <table className="um-table-inner">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Hierarchy</th>
                                <th>Domains</th>
                                <th>Geography / BU</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="um-empty">
                                            {users.length === 0
                                                ? 'No users found. Click "Create User" to add the first one.'
                                                : 'No users match your current filters.'}
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="um-user-cell">
                                            <Avatar name={user.name} role={user.role} />
                                            <div>
                                                <div className="um-user-name">{user.name}</div>
                                                <div className="um-user-email">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                                    </td>
                                    <td>
                                        {user.hierarchy
                                            ? <span className="um-hierarchy-tag">{user.hierarchy}</span>
                                            : <Dash />}
                                    </td>
                                    <td>
                                        {user.domains?.length > 0 ? (
                                            <div className="um-tags-wrap">
                                                {user.domains.slice(0, 3).map(d => (
                                                    <span key={d} className="um-domain-tag">{d}</span>
                                                ))}
                                                {user.domains.length > 3 && (
                                                    <span className="um-tag-more">+{user.domains.length - 3}</span>
                                                )}
                                            </div>
                                        ) : <Dash />}
                                    </td>
                                    <td>
                                        <div className="um-geo-bu">
                                            {user.geographies?.length > 0 && (
                                                <span className="um-count-badge geo">{user.geographies.length} geo</span>
                                            )}
                                            {user.business_units?.length > 0 && (
                                                <span className="um-count-badge bu">{user.business_units.length} BU</span>
                                            )}
                                            {!user.geographies?.length && !user.business_units?.length && <Dash />}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="um-actions">
                                            <button
                                                className="um-action-btn edit"
                                                onClick={() => navigate(`/users/edit/${user.id}`)}
                                            >
                                                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                className="um-action-btn delete"
                                                onClick={() => setConfirmDelete(user)}
                                            >
                                                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"/>
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Delete confirmation modal ── */}
            {confirmDelete && (
                <div className="um-modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="um-modal" onClick={e => e.stopPropagation()}>
                        <div className="um-modal-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            </svg>
                        </div>
                        <h3 className="um-modal-title">Delete User</h3>
                        <p className="um-modal-body">
                            Permanently delete <strong>{confirmDelete.name}</strong> ({confirmDelete.email})?
                            This action cannot be undone.
                        </p>
                        <div className="um-modal-actions">
                            <button className="um-cancel-btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="um-confirm-btn" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
