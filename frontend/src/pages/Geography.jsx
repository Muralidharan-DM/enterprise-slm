import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';
import '../styles/OrgPages.css';
import ConfirmModal from '../components/ConfirmModal';

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

const Geography = () => {
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'add' | { id, name }
    const [confirmDelete, setConfirmDelete] = useState(null); // { id }
    const [formName, setFormName] = useState('');

    const fetchRegions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('users/geographies/');
            setRegions(res.data);
        } catch {
            toast.error('Failed to load geographies');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRegions(); }, [fetchRegions]);

    const openAdd = () => { setFormName(''); setModal('add'); };
    const openEdit = (r) => { setFormName(r.name); setModal(r); };
    const closeModal = () => { setModal(null); setFormName(''); };

    const handleSave = async () => {
        if (!formName.trim()) { toast.error('Name is required'); return; }
        try {
            if (modal === 'add') {
                await API.post('users/geographies/', { name: formName });
                toast.success('Geography added');
            } else {
                await API.put(`users/geographies/${modal.id}/`, { name: formName });
                toast.success('Geography updated');
            }
            fetchRegions();
            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        const { id } = confirmDelete;
        setConfirmDelete(null);
        try {
            await API.delete(`users/geographies/${id}/`);
            toast.success('Geography deleted');
            fetchRegions();
        } catch {
            toast.error('Delete failed');
        }
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

            <div className="stats-bar">
                <div className="stat-item">
                    <span className="stat-value">{regions.length}</span>
                    <span className="stat-label">Regions</span>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Loading...</div>
            ) : (
                <div className="bu-grid">
                    {regions.map((region, idx) => {
                        const color = COLORS[idx % COLORS.length];
                        const abbr = region.name.slice(0, 3).toUpperCase();
                        return (
                            <div key={region.id} className="bu-card" style={{ borderTop: `3px solid ${color}` }}>
                                <div className="bu-header">
                                    <div className="bu-code-badge" style={{ background: `${color}22`, color }}>
                                        {abbr}
                                    </div>
                                    <div className="bu-actions">
                                        <button className="btn-icon edit" onClick={() => openEdit(region)}>✏️</button>
                                        <button className="btn-icon danger" onClick={() => setConfirmDelete({ id: region.id, name: region.name })}>🗑️</button>
                                    </div>
                                </div>
                                <div className="bu-name">{region.name}</div>
                            </div>
                        );
                    })}
                    {regions.length === 0 && (
                        <div className="empty-state">
                            <span style={{ fontSize: '3rem' }}>🗺️</span>
                            <p>No regions defined yet.</p>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                open={!!confirmDelete}
                title={`Delete "${confirmDelete?.name}"?`}
                message="This region will be permanently removed from the system."
                confirmLabel="Delete Region"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
            />

            {modal && (
                <Modal
                    title={modal === 'add' ? 'Add Region' : 'Edit Region'}
                    onClose={closeModal}
                >
                    <div className="form-group">
                        <label className="form-label">Region Name</label>
                        <input
                            className="form-input"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="e.g. Middle East"
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            autoFocus
                        />
                    </div>
                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave}>
                            {modal === 'add' ? 'Add' : 'Update'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Geography;
