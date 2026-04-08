import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';
import '../styles/OrgPages.css';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

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
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'add' | { id, name }
    const [formName, setFormName] = useState('');
    const [formColor, setFormColor] = useState(COLORS[0]);

    const fetchUnits = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('users/business-units/');
            setUnits(res.data);
        } catch {
            toast.error('Failed to load business units');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUnits(); }, [fetchUnits]);

    const openAdd = () => { setFormName(''); setFormColor(COLORS[0]); setModal('add'); };
    const openEdit = (u) => {
        setFormName(u.name);
        setFormColor(u._color || COLORS[units.indexOf(u) % COLORS.length]);
        setModal(u);
    };
    const closeModal = () => { setModal(null); setFormName(''); };

    const handleSave = async () => {
        if (!formName.trim()) { toast.error('Name is required'); return; }
        try {
            if (modal === 'add') {
                await API.post('users/business-units/', { name: formName });
                toast.success('Business unit created');
            } else {
                await API.put(`users/business-units/${modal.id}/`, { name: formName });
                toast.success('Business unit updated');
            }
            fetchUnits();
            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this business unit?')) return;
        try {
            await API.delete(`users/business-units/${id}/`);
            toast.success('Business unit deleted');
            fetchUnits();
        } catch {
            toast.error('Delete failed');
        }
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

            <div className="stats-bar">
                <div className="stat-item">
                    <span className="stat-value">{units.length}</span>
                    <span className="stat-label">Business Units</span>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Loading...</div>
            ) : (
                <div className="bu-grid">
                    {units.map((unit, idx) => {
                        const color = COLORS[idx % COLORS.length];
                        return (
                            <div key={unit.id} className="bu-card" style={{ borderTop: `3px solid ${color}` }}>
                                <div className="bu-header">
                                    <div className="bu-code-badge" style={{ background: `${color}22`, color }}>
                                        {unit.name.slice(0, 3).toUpperCase()}
                                    </div>
                                    <div className="bu-actions">
                                        <button className="btn-icon edit" onClick={() => openEdit(unit)}>✏️</button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(unit.id)}>🗑️</button>
                                    </div>
                                </div>
                                <div className="bu-name">{unit.name}</div>
                            </div>
                        );
                    })}
                    {units.length === 0 && (
                        <div className="empty-state">
                            <span style={{ fontSize: '3rem' }}>🏢</span>
                            <p>No business units defined yet.</p>
                        </div>
                    )}
                </div>
            )}

            {modal && (
                <Modal
                    title={modal === 'add' ? 'Add Business Unit' : 'Edit Business Unit'}
                    onClose={closeModal}
                >
                    <div className="form-group">
                        <label className="form-label">Unit Name</label>
                        <input
                            className="form-input"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="e.g. Operations"
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            autoFocus
                        />
                    </div>
                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave}>
                            {modal === 'add' ? 'Create' : 'Update'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BusinessUnits;
