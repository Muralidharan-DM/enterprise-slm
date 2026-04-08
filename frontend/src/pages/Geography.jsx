import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';
import '../styles/OrgPages.css';

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

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this geography?')) return;
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
                <div className="chip-grid">
                    {regions.map(region => (
                        <div key={region.id} className="geo-card">
                            <div className="geo-flag">🌐</div>
                            <div className="geo-info">
                                <div className="geo-name">{region.name}</div>
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
            )}

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
