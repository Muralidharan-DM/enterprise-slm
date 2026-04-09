import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/UserManagement.css';

const SectionHeader = ({ number, color, title, subtitle }) => (
    <div className="uf-section-header">
        <div className="uf-section-num" style={{ background: `${color}22`, color }}>{number}</div>
        <div>
            <div className="uf-section-title">{title}</div>
            {subtitle && <div className="uf-section-sub">{subtitle}</div>}
        </div>
    </div>
);

const ChipSelect = ({ options, selected, onToggle, emptyMsg }) => (
    <div className="chip-group">
        {options.length === 0
            ? <span className="text-secondary" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>{emptyMsg || 'No options available'}</span>
            : options.map(opt => (
                <div
                    key={opt.id}
                    className={`chip ${selected.includes(opt.name) ? 'selected' : ''}`}
                    onClick={() => onToggle(opt.name)}
                >
                    {opt.name}
                </div>
            ))
        }
    </div>
);

const UserForm = ({ mode }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(mode === 'edit');

    const [master, setMaster] = useState({
        domains: [],
        subdomains: [],
        geographies: [],
        business_units: [],
        hierarchy_levels: []
    });

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user',
        hierarchy: '',
        domains: [],
        subdomains: [],
        geographies: [],
        business_units: []
    });

    const loadMaster = useCallback(async () => {
        try {
            const res = await API.get('users/master-data/');
            setMaster(res.data);
        } catch {
            toast.error("Failed to load options");
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
                role: d.role || 'user',
                hierarchy: d.hierarchy || '',
                domains: d.domains || [],
                subdomains: d.subdomains || [],
                geographies: d.geographies || [],
                business_units: d.business_units || [],
            });
        } catch {
            toast.error("Failed to load user data");
            navigate('/users');
        } finally {
            setPageLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadMaster();
        if (mode === 'edit' && id) fetchUser();
    }, [mode, id, loadMaster, fetchUser]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleChip = (field, name) => {
        setForm(prev => {
            const current = prev[field] || [];
            return {
                ...prev,
                [field]: current.includes(name)
                    ? current.filter(i => i !== name)
                    : [...current, name]
            };
        });
    };

    const handleDomainToggle = name => {
        setForm(prev => {
            const current = prev.domains;
            const next = current.includes(name)
                ? current.filter(i => i !== name)
                : [...current, name];
            // drop subdomains that no longer belong to any selected domain
            const validSubs = master.subdomains
                .filter(s => next.includes(s.domain))
                .map(s => s.name);
            return {
                ...prev,
                domains: next,
                subdomains: prev.subdomains.filter(s => validSubs.includes(s))
            };
        });
    };

    const availableSubdomains = master.subdomains.filter(s => form.domains.includes(s.domain));

    const handleSave = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'create') {
                await API.post('users/users/create/', form);
                toast.success("User created successfully");
            } else {
                await API.put(`users/users/update/${id}/`, form);
                toast.success("User updated successfully");
            }
            navigate('/users');
        } catch (err) {
            toast.error(err.response?.data?.error || "Save failed");
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

    return (
        <div className="user-management-container">
            {/* Page header */}
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
                            ? 'Set up credentials, role, and access permissions for a new user.'
                            : 'Update user information, role, and access permissions.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">

                {/* ── Section 1: User Information ── */}
                <div className="card">
                    <SectionHeader number="01" color="#6366f1" title="User Information" subtitle="Basic account credentials and role assignment" />
                    <div className="um-grid-2">
                        <div>
                            <label className="form-label">Full Name <span className="uf-required">*</span></label>
                            <input
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                required
                                className="form-input"
                                placeholder="e.g. John Smith"
                            />
                        </div>
                        <div>
                            <label className="form-label">Email Address <span className="uf-required">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="form-input"
                                placeholder="email@enterprise.com"
                            />
                        </div>
                        <div>
                            <label className="form-label">
                                {mode === 'create' ? 'Password' : 'New Password'}
                                {mode === 'create' && <span className="uf-required"> *</span>}
                                {mode === 'edit' && <span className="uf-optional"> (leave blank to keep current)</span>}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required={mode === 'create'}
                                className="form-input"
                                placeholder={mode === 'edit' ? '••••••••' : 'Enter password'}
                            />
                        </div>
                        <div>
                            <label className="form-label">Role <span className="uf-required">*</span></label>
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="form-input uf-select"
                            >
                                <option value="user">User — Standard access</option>
                                <option value="admin">Admin — Full privileges</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Section 2: Organizational Scope ── */}
                <div className="card">
                    <SectionHeader number="02" color="#8b5cf6" title="Organizational Scope" subtitle="Hierarchy level, domains, and subdomains this user can access" />
                    <div className="space-y-6">
                        <div>
                            <label className="form-label">Hierarchy Level</label>
                            <select
                                name="hierarchy"
                                value={form.hierarchy}
                                onChange={handleChange}
                                className="form-input uf-select"
                            >
                                <option value="">— Not assigned —</option>
                                {master.hierarchy_levels.map(lvl => (
                                    <option key={lvl.id} value={lvl.name}>{lvl.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="form-label">
                                Domains
                                {form.domains.length > 0 && <span className="uf-count"> ({form.domains.length} selected)</span>}
                            </label>
                            <ChipSelect
                                options={master.domains}
                                selected={form.domains}
                                onToggle={handleDomainToggle}
                            />
                        </div>

                        <div>
                            <label className="form-label">
                                Subdomains
                                {form.subdomains.length > 0 && <span className="uf-count"> ({form.subdomains.length} selected)</span>}
                            </label>
                            <ChipSelect
                                options={availableSubdomains}
                                selected={form.subdomains}
                                onToggle={name => toggleChip('subdomains', name)}
                                emptyMsg={form.domains.length === 0 ? 'Select a domain first to see subdomains' : 'No subdomains for selected domains'}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Regional & Business Access ── */}
                <div className="card">
                    <SectionHeader number="03" color="#ec4899" title="Regional & Business Access" subtitle="Geographic regions and business units this user operates in" />
                    <div className="space-y-6">
                        <div>
                            <label className="form-label">
                                Geographies
                                {form.geographies.length > 0 && <span className="uf-count"> ({form.geographies.length} selected)</span>}
                            </label>
                            <ChipSelect
                                options={master.geographies}
                                selected={form.geographies}
                                onToggle={name => toggleChip('geographies', name)}
                            />
                        </div>
                        <div>
                            <label className="form-label">
                                Business Units
                                {form.business_units.length > 0 && <span className="uf-count"> ({form.business_units.length} selected)</span>}
                            </label>
                            <ChipSelect
                                options={master.business_units}
                                selected={form.business_units}
                                onToggle={name => toggleChip('business_units', name)}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="uf-footer">
                    <button type="button" className="uf-discard-btn" onClick={() => navigate('/users')}>
                        Cancel
                    </button>
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
