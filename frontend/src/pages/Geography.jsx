import React, { useState } from 'react';
import toast from 'react-hot-toast';
import '../styles/OrgPages.css';

const INITIAL_REGIONS = [
    { id: 1, name: 'India', code: 'IN', flag: '🇮🇳', userCount: 24 },
    { id: 2, name: 'USA', code: 'US', flag: '🇺🇸', userCount: 18 },
    { id: 3, name: 'APAC', code: 'APAC', flag: '🌏', userCount: 31 },
    { id: 4, name: 'EMEA', code: 'EMEA', flag: '🌍', userCount: 15 },
    { id: 5, name: 'LATAM', code: 'LATAM', flag: '🌎', userCount: 8 },
];

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

const Geography = () => {
    const [regions, setRegions] = useState(INITIAL_REGIONS);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', flag: '' });

    const openAdd = () => { setForm({ name: '', code: '', flag: '' }); setModal('add'); };
    const openEdit = (r) => { setForm({ ...r }); setModal('edit'); };

    const handleSave = () => {
        if (!form.name.trim() || !form.code.trim()) { toast.error('Name and code are required'); return; }
        if (modal === 'edit') {
            setRegions(prev => prev.map(r => r.id === form.id ? { ...r, ...form } : r));
            toast.success('Region updated');
        } else {
            setRegions(prev => [...prev, { id: uid(), userCount: 0, ...form }]);
            toast.success('Region added');
        }
        setModal(null);
    };

    const handleDelete = (id) => {
        setRegions(prev => prev.filter(r => r.id !== id));
        toast.success('Region removed');
    };

    return (
        <div className="org-page">
            <div className="org-page-header">
                <div>
                    <h1 className="page-title">Geography</h1>
                    <p className="page-subtitle">Define geographic regions used for user access filtering and row-level security.</p>
                </div>
                <button className="btn-primary" onClick={openAdd}>+ Add Region</button>
            </div>

            {/* Summary bar */}
            <div className="stats-bar">
                <div className="stat-item">
                    <span className="stat-value">{regions.length}</span>
                    <span className="stat-label">Regions</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{regions.reduce((s, r) => s + r.userCount, 0)}</span>
                    <span className="stat-label">Total Users</span>
                </div>
            </div>

            <div className="chip-grid">
                {regions.map(region => (
                    <div key={region.id} className="geo-card">
                        <div className="geo-flag">{region.flag || '🌐'}</div>
                        <div className="geo-info">
                            <div className="geo-name">{region.name}</div>
                            <div className="geo-code">{region.code}</div>
                        </div>
                        <div className="geo-users">
                            <span className="user-badge">{region.userCount} users</span>
                        </div>
                        <div className="geo-actions">
                            <button className="btn-icon edit" onClick={() => openEdit(region)}>✏️</button>
                            <button className="btn-icon danger" onClick={() => handleDelete(region.id)}>🗑️</button>
                        </div>
                    </div>
                ))}
                {regions.length === 0 && (
                    <div className="empty-state">
                        <span style={{ fontSize: '3rem' }}>🗺️</span>
                        <p>No regions defined yet.</p>
                    </div>
                )}
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Region' : 'Add Region'} onClose={() => setModal(null)}>
                    <div className="form-group">
                        <label className="form-label">Region Name</label>
                        <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Middle East" autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Code</label>
                        <input className="form-input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. ME" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Flag Emoji (optional)</label>
                        <input className="form-input" value={form.flag} onChange={e => setForm(p => ({ ...p, flag: e.target.value }))} placeholder="e.g. 🌍" />
                    </div>
                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave}>{modal === 'edit' ? 'Update' : 'Add'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Geography;
