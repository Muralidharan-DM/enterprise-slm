import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/CSG.css';

// ── Step bar ──────────────────────────────────────────────────────────────────
const StepBar = ({ current, total, labels }) => (
    <div className="sg-stepbar">
        {Array.from({ length: total }, (_, i) => i + 1).map((s, idx) => (
            <React.Fragment key={s}>
                <div className="sg-step-item">
                    <div className={`sg-step-circle ${current >= s ? 'active' : ''} ${current > s ? 'done' : ''}`}>
                        {current > s ? '✓' : s}
                    </div>
                    <span className={`sg-step-label ${current === s ? 'active' : ''}`}>{labels[idx]}</span>
                </div>
                {idx < total - 1 && <div className={`sg-step-line ${current > s ? 'done' : ''}`} />}
            </React.Fragment>
        ))}
    </div>
);

const Chip = ({ label, selected, onClick }) => (
    <button type="button" className={`sg-chip ${selected ? 'active' : ''}`} onClick={onClick}>
        {label}
    </button>
);

const RSG = () => {
    const [groups, setGroups] = useState([]);
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);

    // Wizard
    const [wizardOpen, setWizardOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', domains: [], subdomains: [], filters: {}, users: [] });
    const [datasetSchema, setDatasetSchema] = useState({});
    const [schemaLoading, setSchemaLoading] = useState(false);

    // Detail page
    const [view, setView] = useState('list');
    const [detailGroup, setDetailGroup] = useState(null);
    const [autoUsers, setAutoUsers] = useState([]);

    // Add user modal
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [addUserLoading, setAddUserLoading] = useState(false);

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('security/rsg/');
            setGroups(res.data);
        } catch { toast.error('Failed to load groups'); }
        finally { setLoading(false); }
    }, []);

    const fetchDomains = useCallback(async () => {
        try {
            const res = await API.get('users/domains/manage/');
            setDomains(res.data);
        } catch { }
    }, []);

    useEffect(() => {
        fetchGroups();
        fetchDomains();
    }, [fetchGroups, fetchDomains]);

    const availableSubdomains = domains
        .filter(d => form.domains.includes(d.name))
        .flatMap(d => d.subdomains);

    const toggleDomain = (name) => {
        const removing = form.domains.includes(name);
        const domObj = domains.find(d => d.name === name);
        let newSubs = form.subdomains;
        if (removing && domObj) {
            const domSubNames = domObj.subdomains.map(s => s.name);
            newSubs = newSubs.filter(s => !domSubNames.includes(s));
        }
        setForm(f => ({
            ...f,
            domains: removing ? f.domains.filter(d => d !== name) : [...f.domains, name],
            subdomains: newSubs,
        }));
    };

    const toggleSub = (name) => setForm(f => ({
        ...f,
        subdomains: f.subdomains.includes(name) ? f.subdomains.filter(s => s !== name) : [...f.subdomains, name],
    }));

    const setFilter = (ds, col, value) => {
        setForm(f => {
            const dsFilters = { ...(f.filters[ds] || {}) };
            if (value.trim() === '') {
                delete dsFilters[col];
            } else {
                dsFilters[col] = value;
            }
            return { ...f, filters: { ...f.filters, [ds]: dsFilters } };
        });
    };

    const clearFilter = (ds, col) => {
        setForm(f => {
            const dsFilters = { ...(f.filters[ds] || {}) };
            delete dsFilters[col];
            if (Object.keys(dsFilters).length === 0) {
                const newFilters = { ...f.filters };
                delete newFilters[ds];
                return { ...f, filters: newFilters };
            }
            return { ...f, filters: { ...f.filters, [ds]: dsFilters } };
        });
    };

    const goToStep2 = async () => {
        if (!form.name.trim()) { toast.error('Group name is required'); return; }
        if (form.domains.length === 0) { toast.error('Select at least one domain'); return; }
        setSchemaLoading(true);
        try {
            const subs = form.subdomains.length > 0 ? form.subdomains : availableSubdomains.map(s => s.name);
            const res = await API.get(`security/datasets/?subdomains=${subs.join(',')}`);
            setDatasetSchema(res.data);
        } catch { toast.error('Failed to load datasets'); }
        finally { setSchemaLoading(false); }
        setStep(2);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                name: form.name,
                domains: form.domains,
                subdomains: form.subdomains,
                filters: form.filters,
                users: [],
            };
            if (editId) {
                await API.put(`security/rsg/${editId}/update/`, payload);
                toast.success('RSG updated');
            } else {
                await API.post('security/rsg/create/', payload);
                toast.success('RSG created — domain users auto-added');
            }
            setWizardOpen(false);
            fetchGroups();
        } catch { toast.error('Failed to save group'); }
    };

    const openCreate = () => {
        setEditId(null);
        setForm({ name: '', domains: [], subdomains: [], filters: {}, users: [] });
        setDatasetSchema({});
        setStep(1);
        setWizardOpen(true);
    };

    const openEdit = async (g) => {
        try {
            const res = await API.get(`security/rsg/${g.id}/`);
            const d = res.data;
            setEditId(d.id);
            setForm({ name: d.name, domains: d.domains, subdomains: d.subdomains, filters: d.filters || {}, users: d.users });
            setDatasetSchema({});
            setStep(1);
            setWizardOpen(true);
        } catch { toast.error('Failed to load group'); }
    };

    const openDetail = async (g) => {
        try {
            const [detRes, autoRes] = await Promise.all([
                API.get(`security/rsg/${g.id}/`),
                API.get(`security/rsg/${g.id}/auto-users/`),
            ]);
            setDetailGroup(detRes.data);
            setAutoUsers(autoRes.data || []);
        } catch {
            setDetailGroup(g);
            setAutoUsers([]);
        }
        setView('detail');
    };

    const refreshDetail = async (id) => {
        const [detRes, autoRes] = await Promise.all([
            API.get(`security/rsg/${id}/`),
            API.get(`security/rsg/${id}/auto-users/`),
        ]);
        setDetailGroup(detRes.data);
        setAutoUsers(autoRes.data || []);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this row security group?')) return;
        try {
            await API.delete(`security/rsg/${id}/delete/`);
            toast.success('Group deleted');
            fetchGroups();
        } catch { toast.error('Delete failed'); }
    };

    const openAddUser = async () => {
        setAddUserLoading(true);
        setAddUserOpen(true);
        try {
            const res = await API.get(`security/rsg/${detailGroup.id}/available-users/`);
            setAvailableUsers(res.data || []);
        } catch { setAvailableUsers([]); }
        finally { setAddUserLoading(false); }
    };

    const addUser = async (email) => {
        try {
            await API.post(`security/rsg/${detailGroup.id}/add-user/`, { email });
            toast.success(`${email} added`);
            setAvailableUsers(prev => prev.filter(u => u.email !== email));
            await refreshDetail(detailGroup.id);
        } catch { toast.error('Failed to add user'); }
    };

    const totalFilters = (g) => {
        const f = g.filters || {};
        if (typeof f === 'object' && !Array.isArray(f)) {
            const first = Object.values(f)[0];
            if (first && typeof first === 'object') {
                return Object.values(f).reduce((s, dsf) => s + Object.keys(dsf).length, 0);
            }
            return Object.keys(f).length;
        }
        return 0;
    };

    // ── Detail page ───────────────────────────────────────────────────────────
    if (view === 'detail' && detailGroup) {
        const autoEmails = new Set(autoUsers.map(u => u.email));
        const manualUsers = (detailGroup.users || []).filter(e => !autoEmails.has(e));

        return (
            <div className="sg-page">
                <div className="sg-detail-topbar">
                    <button className="sg-back-btn" onClick={() => { setView('list'); fetchGroups(); }}>
                        ← Back to Groups
                    </button>
                    <div className="sg-detail-topbar-actions">
                        <button className="btn-secondary" onClick={() => openEdit(detailGroup)}>✏️ Edit Group</button>
                        <button className="btn-danger" onClick={async () => { await handleDelete(detailGroup.id); setView('list'); }}>🗑️ Delete</button>
                    </div>
                </div>

                <div className="sg-detail-hero">
                    <div className="sg-card-icon rsg-icon" style={{ width: 56, height: 56, fontSize: '1.8rem' }}>🔏</div>
                    <div>
                        <h1 className="sg-detail-title">{detailGroup.name}</h1>
                        <span className="sg-type-badge rsg-badge">Row Security Group</span>
                    </div>
                </div>

                {/* Scope card */}
                <div className="sg-detail-card">
                    <div className="sg-detail-card-title">Scope</div>
                    <div className="sg-detail-row">
                        <span className="sg-detail-label">Domains</span>
                        <div className="sg-chip-row">
                            {(detailGroup.domains || []).map(d => <span key={d} className="sg-tag domain">{d}</span>)}
                            {(detailGroup.domains || []).length === 0 && <span className="sg-empty-text">None</span>}
                        </div>
                    </div>
                    <div className="sg-detail-row">
                        <span className="sg-detail-label">Subdomains</span>
                        <div className="sg-chip-row">
                            {(detailGroup.subdomains || []).map(s => <span key={s} className="sg-tag sub">{s}</span>)}
                            {(detailGroup.subdomains || []).length === 0 && <span className="sg-empty-text">All subdomains</span>}
                        </div>
                    </div>
                </div>

                {/* Row filters card */}
                <div className="sg-detail-card">
                    <div className="sg-detail-card-title">Active Row Filters</div>
                    {Object.keys(detailGroup.filters || {}).length === 0
                        ? <span className="sg-empty-text">No filters defined</span>
                        : Object.entries(detailGroup.filters || {}).map(([key, val]) => {
                            if (typeof val === 'object') {
                                return (
                                    <div key={key} className="sg-review-ds" style={{ marginBottom: '0.75rem' }}>
                                        <span className="sg-review-ds-name">📂 {key}</span>
                                        <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                            {Object.entries(val).map(([col, v]) => (
                                                <span key={col} className="sg-filter-tag">{col} = "{v}"</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return <span key={key} className="sg-filter-tag">{key} = "{val}"</span>;
                        })
                    }
                </div>

                {/* Users card */}
                <div className="sg-detail-card">
                    <div className="sg-detail-card-head">
                        <div className="sg-detail-card-title" style={{ marginBottom: 0 }}>Users</div>
                        <button className="btn-primary sg-btn-sm" onClick={openAddUser}>+ Add User</button>
                    </div>

                    {autoUsers.length === 0 && manualUsers.length === 0 && (
                        <p className="sg-empty-text" style={{ marginTop: '0.75rem' }}>No users in this group yet.</p>
                    )}

                    {autoUsers.length > 0 && (
                        <div className="sg-user-section">
                            <div className="sg-user-section-label">Auto-matched <span className="sg-label-hint">(by domain/subdomain)</span></div>
                            <div className="sg-user-list">
                                {autoUsers.map(u => (
                                    <div key={u.email} className="sg-user-row">
                                        <span className="sg-avatar">{u.email[0].toUpperCase()}</span>
                                        <div className="sg-user-info">
                                            <span className="sg-user-email">{u.email}</span>
                                            {u.username && <span className="sg-user-name">{u.username}</span>}
                                        </div>
                                        <span className="sg-badge auto">Auto</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {manualUsers.length > 0 && (
                        <div className="sg-user-section">
                            <div className="sg-user-section-label">Manually added</div>
                            <div className="sg-user-list">
                                {manualUsers.map(email => (
                                    <div key={email} className="sg-user-row">
                                        <span className="sg-avatar">{email[0].toUpperCase()}</span>
                                        <div className="sg-user-info">
                                            <span className="sg-user-email">{email}</span>
                                        </div>
                                        <span className="sg-badge manual">Manual</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Add User modal */}
                {addUserOpen && (
                    <div className="sg-overlay" onClick={() => setAddUserOpen(false)}>
                        <div className="sg-mini-modal" onClick={e => e.stopPropagation()}>
                            <div className="sg-mini-modal-head">
                                <h3>Add User from Scope</h3>
                                <button className="sg-close" onClick={() => setAddUserOpen(false)}>✕</button>
                            </div>
                            <p className="sg-mini-modal-hint">Users from the same domain/subdomain not yet in this group:</p>
                            {addUserLoading ? (
                                <div className="sg-loading-msg">Loading...</div>
                            ) : availableUsers.length === 0 ? (
                                <p className="sg-empty-text" style={{ padding: '1rem 0' }}>All domain/subdomain users are already in this group.</p>
                            ) : (
                                <div className="sg-user-list">
                                    {availableUsers.map(u => (
                                        <div key={u.email} className="sg-user-row">
                                            <span className="sg-avatar">{u.email[0].toUpperCase()}</span>
                                            <div className="sg-user-info">
                                                <span className="sg-user-email">{u.email}</span>
                                                {u.username && <span className="sg-user-name">{u.username}</span>}
                                            </div>
                                            <button className="btn-primary sg-btn-sm" onClick={() => addUser(u.email)}>Add</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Wizard (edit) */}
                {wizardOpen && (
                    <div className="sg-overlay" onClick={() => setWizardOpen(false)}>
                        <div className="sg-wizard" onClick={e => e.stopPropagation()}>
                            <div className="sg-wizard-head">
                                <h2>Edit Row Security Group</h2>
                                <button className="sg-close" onClick={() => setWizardOpen(false)}>✕</button>
                            </div>
                            <StepBar current={step} total={3} labels={['Scope', 'Row Filters', 'Review & Save']} />
                            <div className="sg-wizard-body">{renderWizardBody()}</div>
                            <div className="sg-wizard-footer">
                                {step > 1 && <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>}
                                <div style={{ flex: 1 }} />
                                {step === 1 && <button className="btn-primary" onClick={goToStep2}>Next →</button>}
                                {step === 2 && <button className="btn-primary" onClick={() => setStep(3)}>Next →</button>}
                                {step === 3 && <button className="btn-primary" onClick={async () => { await handleSubmit(); await refreshDetail(editId); }}>Save Policy</button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Wizard body ───────────────────────────────────────────────────────────
    const renderWizardBody = () => (
        <>
            {step === 1 && (
                <div className="sg-step-pane">
                    <div className="sg-field">
                        <label className="sg-label">Group Name</label>
                        <input
                            className="form-input"
                            placeholder="e.g. APAC Region Filter"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            autoFocus
                        />
                    </div>
                    <div className="sg-field">
                        <label className="sg-label">Select Domains</label>
                        <div className="sg-chip-row">
                            {domains.map(d => (
                                <Chip key={d.id} label={d.name} selected={form.domains.includes(d.name)} onClick={() => toggleDomain(d.name)} />
                            ))}
                        </div>
                    </div>
                    {availableSubdomains.length > 0 && (
                        <div className="sg-field">
                            <label className="sg-label">Select Subdomains <span className="sg-label-hint">(optional)</span></label>
                            <div className="sg-chip-row">
                                {availableSubdomains.map(s => (
                                    <Chip key={s.id} label={s.name} selected={form.subdomains.includes(s.name)} onClick={() => toggleSub(s.name)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {step === 2 && (
                <div className="sg-step-pane">
                    <p className="sg-step-hint">Set row-level filters per dataset. Only rows matching <strong>all</strong> values will be visible.</p>
                    {schemaLoading ? (
                        <div className="sg-loading-msg">Loading datasets...</div>
                    ) : Object.keys(datasetSchema).length === 0 ? (
                        <div className="sg-loading-msg">No datasets found for selected scope.</div>
                    ) : (
                        <div className="sg-ds-list">
                            {Object.entries(datasetSchema).map(([dsName, cols]) => (
                                <div key={dsName} className="sg-ds-block">
                                    <div className="sg-ds-header">
                                        <span>📂 <strong>{dsName}</strong></span>
                                        {Object.keys(form.filters[dsName] || {}).length > 0 && (
                                            <span className="sg-badge rsg-active">
                                                {Object.keys(form.filters[dsName]).length} filter{Object.keys(form.filters[dsName]).length > 1 ? 's' : ''} active
                                            </span>
                                        )}
                                    </div>
                                    <div className="sg-filter-grid">
                                        {cols.map(col => (
                                            <div key={col} className="sg-filter-row">
                                                <span className="sg-filter-col">{col}</span>
                                                <span className="sg-filter-eq">=</span>
                                                <input
                                                    className="sg-filter-input"
                                                    placeholder="Any value"
                                                    value={(form.filters[dsName] || {})[col] || ''}
                                                    onChange={e => setFilter(dsName, col, e.target.value)}
                                                />
                                                {(form.filters[dsName] || {})[col] && (
                                                    <button type="button" className="sg-filter-clear" onClick={() => clearFilter(dsName, col)}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {step === 3 && (
                <div className="sg-step-pane">
                    <div className="sg-review-block">
                        <div className="sg-review-label">Group Name</div>
                        <div className="sg-review-value">{form.name}</div>
                    </div>
                    <div className="sg-review-block">
                        <div className="sg-review-label">Domains</div>
                        <div className="sg-chip-row">
                            {form.domains.map(d => <span key={d} className="sg-tag domain">{d}</span>)}
                            {form.domains.length === 0 && <span className="sg-empty-text">None</span>}
                        </div>
                    </div>
                    <div className="sg-review-block">
                        <div className="sg-review-label">Subdomains</div>
                        <div className="sg-chip-row">
                            {form.subdomains.map(s => <span key={s} className="sg-tag sub">{s}</span>)}
                            {form.subdomains.length === 0 && <span className="sg-empty-text">All subdomains</span>}
                        </div>
                    </div>
                    <div className="sg-review-block">
                        <div className="sg-review-label">Row Filter Rules</div>
                        {Object.keys(form.filters).length === 0
                            ? <span className="sg-empty-text">No filters defined</span>
                            : Object.entries(form.filters).map(([ds, dsFilters]) => (
                                <div key={ds} className="sg-review-ds">
                                    <span className="sg-review-ds-name">📂 {ds}</span>
                                    <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {Object.entries(dsFilters).map(([col, val]) => (
                                            <span key={col} className="sg-filter-tag">{col} = "{val}"</span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                    <div className="sg-review-block">
                        <div className="sg-review-label">Users</div>
                        <p className="sg-step-hint" style={{ margin: 0 }}>Users matching the selected domain/subdomain will be auto-added after save. Additional users can be added from the detail page.</p>
                    </div>
                </div>
            )}
        </>
    );

    // ── List view ─────────────────────────────────────────────────────────────
    return (
        <div className="sg-page">
            <div className="sg-header">
                <div>
                    <h1 className="page-title">Row Security Groups</h1>
                    <p className="sg-subtitle">Define record-level visibility policies using dynamic column filters.</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>+ Create RSG</button>
            </div>

            {loading ? (
                <div className="sg-empty">Loading...</div>
            ) : groups.length === 0 ? (
                <div className="sg-empty">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔏</div>
                    <p>No row security groups yet. Create one to filter record visibility.</p>
                </div>
            ) : (
                <div className="sg-grid">
                    {groups.map(g => (
                        <div key={g.id} className="sg-card">
                            <div className="sg-card-head">
                                <div className="sg-card-icon rsg-icon">🔏</div>
                                <div>
                                    <div className="sg-card-name">{g.name}</div>
                                    <div className="sg-card-meta">
                                        <span>🔍 {totalFilters(g)} filter rules</span>
                                        <span>👥 {(g.users || []).length} users</span>
                                    </div>
                                </div>
                            </div>
                            <div className="sg-card-tags">
                                {(g.domains || []).map(d => <span key={d} className="sg-tag domain">{d}</span>)}
                                {(g.subdomains || []).map(s => <span key={s} className="sg-tag sub">{s}</span>)}
                            </div>
                            <div className="sg-card-actions">
                                <button className="btn-secondary sg-btn-view" onClick={() => openDetail(g)}>View Details</button>
                                <button className="sg-icon-btn" title="Edit" onClick={() => openEdit(g)}>✏️</button>
                                <button className="sg-icon-btn danger" title="Delete" onClick={() => handleDelete(g.id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Wizard ──────────────────────────────────────────────────────── */}
            {wizardOpen && (
                <div className="sg-overlay" onClick={() => setWizardOpen(false)}>
                    <div className="sg-wizard" onClick={e => e.stopPropagation()}>
                        <div className="sg-wizard-head">
                            <h2>{editId ? 'Edit' : 'Create'} Row Security Group</h2>
                            <button className="sg-close" onClick={() => setWizardOpen(false)}>✕</button>
                        </div>
                        <StepBar current={step} total={3} labels={['Scope', 'Row Filters', 'Review & Save']} />
                        <div className="sg-wizard-body">{renderWizardBody()}</div>
                        <div className="sg-wizard-footer">
                            {step > 1 && <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>}
                            <div style={{ flex: 1 }} />
                            {step === 1 && <button className="btn-primary" onClick={goToStep2}>Next →</button>}
                            {step === 2 && <button className="btn-primary" onClick={() => setStep(3)}>Next →</button>}
                            {step === 3 && <button className="btn-primary" onClick={handleSubmit}>Save Policy</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RSG;
