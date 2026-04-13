import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/UserManagement.css';

const UserForm = ({ mode }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(mode === 'edit');
    const [securityGroups, setSecurityGroups] = useState([]);

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        contact: '',
        role: 'user',
        security_group_ids: [], // list of selected group IDs (numbers)
    });

    const loadGroups = useCallback(async () => {
        try {
            const res = await API.get('security/groups/');
            setSecurityGroups(res.data);
        } catch {
            toast.error('Failed to load security groups');
        }
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const res = await API.get(`users/users/${id}/`);
            const d = res.data;
            setForm({
                username: d.username || '',
                email: d.email || '',
                password: '',
                contact: d.contact || '',
                role: d.role || 'user',
                security_group_ids: (d.security_groups || []).map(g => g.id),
            });
        } catch {
            toast.error('Failed to load user data');
            navigate('/users');
        } finally {
            setPageLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadGroups();
        if (mode === 'edit' && id) fetchUser();
    }, [mode, id, loadGroups, fetchUser]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => {
            const next = { ...prev, [name]: value };
            // When role changes, clear security_groups that don't match new role
            if (name === 'role') {
                const matchingIds = securityGroups
                    .filter(g => g.role === value)
                    .map(g => g.id);
                next.security_group_ids = prev.security_group_ids.filter(id => matchingIds.includes(id));
            }
            return next;
        });
    };

    // Toggle a group chip (select / deselect)
    const toggleGroup = (groupId) => {
        setForm(prev => {
            const ids = prev.security_group_ids;
            const next = ids.includes(groupId)
                ? ids.filter(i => i !== groupId)
                : [...ids, groupId];
            return { ...prev, security_group_ids: next };
        });
    };

    // Only show security groups matching the currently selected role
    const filteredGroups = securityGroups.filter(g => g.role === form.role);

    const handleSave = async e => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            username: form.username,
            email: form.email,
            contact: form.contact,
            role: form.role,
            security_group_ids: form.security_group_ids,
        };
        if (form.password) payload.password = form.password;
        try {
            if (mode === 'create') {
                if (!form.password) { toast.error('Password is required'); setLoading(false); return; }
                await API.post('users/users/create/', { ...payload, password: form.password });
                toast.success('User created successfully');
            } else {
                await API.put(`users/users/update/${id}/`, payload);
                toast.success('User updated successfully');
            }
            navigate('/users');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="user-management-container">
                <div className="um-loading"><div className="um-spinner" /><span>Loading user data...</span></div>
            </div>
        );
    }

    const selectedCount = form.security_group_ids.length;

    return (
        <div className="user-management-container">
            <div className="uf-page-header">
                <button className="uf-back-btn" onClick={() => navigate('/users')}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Users
                </button>
                <div>
                    <h1 className="page-title">
                        {mode === 'create' ? 'Create New User' : `Edit User: ${form.username}`}
                    </h1>
                    <p className="text-secondary">
                        {mode === 'create'
                            ? 'Set up credentials, role, and security groups for the new user.'
                            : 'Update user credentials, role, and security group assignments.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <div className="card">
                    <div className="uf-section-header">
                        <div className="uf-section-num" style={{ background: '#6366f122', color: '#6366f1' }}>01</div>
                        <div>
                            <div className="uf-section-title">User Information</div>
                            <div className="uf-section-sub">Basic account credentials and role assignment</div>
                        </div>
                    </div>
                    <div className="um-grid-2">
                        <div>
                            <label className="form-label">Full Name <span className="uf-required">*</span></label>
                            <input name="username" value={form.username} onChange={handleChange} required className="form-input" placeholder="e.g. John Smith" />
                        </div>
                        <div>
                            <label className="form-label">Email Address <span className="uf-required">*</span></label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required className="form-input" placeholder="email@enterprise.com" />
                        </div>
                        <div>
                            <label className="form-label">
                                {mode === 'create' ? <>Password <span className="uf-required">*</span></> : <>New Password <span className="uf-optional">(leave blank to keep current)</span></>}
                            </label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} required={mode === 'create'} className="form-input" placeholder={mode === 'edit' ? '••••••••' : 'Enter password'} />
                        </div>
                        <div>
                            <label className="form-label">Contact</label>
                            <input name="contact" value={form.contact} onChange={handleChange} className="form-input" placeholder="e.g. +1 555 000 0000" />
                        </div>
                        <div>
                            <label className="form-label">Role <span className="uf-required">*</span></label>
                            <select name="role" value={form.role} onChange={handleChange} className="form-input uf-select">
                                <option value="user">User — Standard access</option>
                                <option value="super_user">Super User — Elevated access</option>
                                <option value="admin">Admin — Full privileges</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="uf-section-header">
                        <div className="uf-section-num" style={{ background: '#8b5cf622', color: '#8b5cf6' }}>02</div>
                        <div>
                            <div className="uf-section-title">
                                Security Groups
                                {selectedCount > 0 && (
                                    <span style={{
                                        marginLeft: '0.6rem',
                                        background: '#6366f1',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        padding: '2px 10px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        verticalAlign: 'middle',
                                    }}>{selectedCount} selected</span>
                                )}
                            </div>
                            <div className="uf-section-sub">Select one or more security groups that control this user's data access</div>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">
                            Security Groups
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.4rem', fontWeight: 400 }}>
                                (showing {form.role.replace('_', ' ')} groups — click to select/deselect)
                            </span>
                        </label>

                        {filteredGroups.length === 0 ? (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                No security groups for <strong>{form.role.replace('_', ' ')}</strong> role.{' '}
                                <a href="/security/groups" style={{ color: 'var(--accent-primary)' }}>Create one in Security Groups.</a>
                            </p>
                        ) : (
                            <div className="uf-sg-chip-grid">
                                {filteredGroups.map(g => {
                                    const selected = form.security_group_ids.includes(g.id);
                                    return (
                                        <button
                                            key={g.id}
                                            type="button"
                                            className={`uf-sg-chip${selected ? ' selected' : ''}`}
                                            onClick={() => toggleGroup(g.id)}
                                        >
                                            <span className="uf-sg-chip-check">
                                                {selected ? (
                                                    <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                                                        <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
                                                        <rect x="2" y="2" width="12" height="12" rx="2"/>
                                                    </svg>
                                                )}
                                            </span>
                                            <span className="uf-sg-chip-name">{g.name}</span>
                                            {g.description && (
                                                <span className="uf-sg-chip-desc">{g.description}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedCount > 0 && (
                            <div className="uf-sg-selected-summary">
                                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <span>
                                    <strong>{selectedCount}</strong> group{selectedCount !== 1 ? 's' : ''} assigned:{' '}
                                    {filteredGroups
                                        .filter(g => form.security_group_ids.includes(g.id))
                                        .map(g => g.name)
                                        .join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="uf-footer">
                    <button type="button" className="uf-discard-btn" onClick={() => navigate('/users')}>Cancel</button>
                    <button type="submit" disabled={loading} className="btn-primary uf-submit-btn">
                        {loading
                            ? <><span className="uf-btn-spinner" /> Saving...</>
                            : mode === 'create' ? 'Create User' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;
