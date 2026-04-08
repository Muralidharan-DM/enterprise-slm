import React, { useState } from 'react';
import toast from 'react-hot-toast';
import '../styles/OrgPages.css';

const INITIAL_BUS = [
    { id: 1, name: 'Retail Banking', code: 'RB', description: 'Consumer and SME banking products', userCount: 14, color: '#6366f1' },
    { id: 2, name: 'Risk & Compliance', code: 'RC', description: 'Regulatory and risk management functions', userCount: 9, color: '#ef4444' },
    { id: 3, name: 'Wealth Management', code: 'WM', description: 'Private banking and investment advisory', userCount: 7, color: '#f59e0b' },
    { id: 4, name: 'Corporate Banking', code: 'CB', description: 'Institutional and enterprise lending', userCount: 11, color: '#06b6d4' },
    { id: 5, name: 'Technology', code: 'TECH', description: 'Core banking and digital platforms', userCount: 22, color: '#10b981' },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

let _nextId = 10;
const uid = () => ++_nextId;

const Modal = ({ title, children, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h3>{title}</h3>
                <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">{children}</div>
        </div>
    </div>
);

const BusinessUnits = () => {
    const [units, setUnits] = useState(INITIAL_BUS);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', description: '', color: '#6366f1' });

    const openAdd = () => { setForm({ name: '', code: '', description: '', color: '#6366f1' }); setModal('add'); };
    const openEdit = (u) => { setForm({ ...u }); setModal('edit'); };

    const handleSave = () => {
        if (!form.name.trim() || !form.code.trim()) { toast.error('Name and code are required'); return; }
        if (modal === 'edit') {
            setUnits(prev => prev.map(u => u.id === form.id ? { ...u, ...form } : u));
            toast.success('Business unit updated');
        } else {
            setUnits(prev => [...prev, { id: uid(), userCount: 0, ...form }]);
            toast.success('Business unit created');
        }
        setModal(null);
    };

    const handleDelete = (id) => {
        setUnits(prev => prev.filter(u => u.id !== id));
        toast.success('Business unit deleted');
    };

    return (
        <div className="org-page">
            <div className="org-page-header">
                <div>
                    <h1 className="page-title">Business Units</h1>
                    <p className="page-subtitle">Manage enterprise business units for organizational access grouping.</p>
                </div>
                <button className="btn-primary" onClick={openAdd}>+ Add Unit</button>
            </div>

            {/* Stats bar */}
            <div className="stats-bar">
                <div className="stat-item">
                    <span className="stat-value">{units.length}</span>
                    <span className="stat-label">Business Units</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{units.reduce((s, u) => s + u.userCount, 0)}</span>
                    <span className="stat-label">Total Users</span>
                </div>
            </div>

            <div className="bu-grid">
                {units.map(unit => (
                    <div key={unit.id} className="bu-card" style={{ borderTop: `3px solid ${unit.color}` }}>
                        <div className="bu-header">
                            <div className="bu-code-badge" style={{ background: `${unit.color}22`, color: unit.color }}>
                                {unit.code}
                            </div>
                            <div className="bu-actions">
                                <button className="btn-icon edit" onClick={() => openEdit(unit)}>✏️</button>
                                <button className="btn-icon danger" onClick={() => handleDelete(unit.id)}>🗑️</button>
                            </div>
                        </div>
                        <div className="bu-name">{unit.name}</div>
                        <div className="bu-desc">{unit.description}</div>
                        <div className="bu-footer">
                            <span className="user-badge">{unit.userCount} members</span>
                        </div>
                    </div>
                ))}
                {units.length === 0 && (
                    <div className="empty-state">
                        <span style={{ fontSize: '3rem' }}>🏢</span>
                        <p>No business units defined yet.</p>
                    </div>
                )}
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Business Unit' : 'Add Business Unit'} onClose={() => setModal(null)}>
                    <div className="form-group">
                        <label className="form-label">Unit Name</label>
                        <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Operations" autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Code</label>
                        <input className="form-input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. OPS" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this unit..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-selector">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    className={`color-dot ${form.color === c ? 'selected' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setForm(p => ({ ...p, color: c }))}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave}>{modal === 'edit' ? 'Update' : 'Create'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BusinessUnits;
