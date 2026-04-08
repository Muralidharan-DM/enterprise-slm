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

const HierarchyLevel = () => {
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'add' | { id, name }
    const [formName, setFormName] = useState('');

    const fetchLevels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('users/hierarchy-levels/');
            setLevels(res.data);
        } catch {
            toast.error('Failed to load hierarchy levels');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLevels(); }, [fetchLevels]);

    const openAdd = () => { setFormName(''); setModal('add'); };
    const openEdit = (level) => { setFormName(level.name); setModal(level); };
    const closeModal = () => { setModal(null); setFormName(''); };

    const handleSave = async () => {
        if (!formName.trim()) { toast.error('Name is required'); return; }
        try {
            if (modal === 'add') {
                await API.post('users/hierarchy-levels/', { name: formName });
                toast.success('Hierarchy level created');
            } else {
                await API.put(`users/hierarchy-levels/${modal.id}/`, { name: formName });
                toast.success('Hierarchy level updated');
            }
            fetchLevels();
            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this hierarchy level?')) return;
        try {
            await API.delete(`users/hierarchy-levels/${id}/`);
            toast.success('Hierarchy level deleted');
            fetchLevels();
        } catch {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="org-page">
            <div className="org-page-header">
                <div>
                    <h1 className="page-title">Hierarchy Levels</h1>
                    <p className="page-subtitle">Define organizational hierarchy tiers used in user assignment and access control.</p>
                </div>
                <button className="btn-primary" onClick={openAdd}>+ Add Level</button>
            </div>

            {loading ? (
                <div className="empty-state">Loading...</div>
            ) : (
                <div className="hierarchy-grid">
                    {levels.map((level, idx) => (
                        <div key={level.id} className="hierarchy-card">
                            <div className="hierarchy-rank">L{idx + 1}</div>
                            <div className="hierarchy-info">
                                <div className="hierarchy-name">{level.name}</div>
                            </div>
                            <div className="hierarchy-actions">
                                <button className="btn-icon edit" onClick={() => openEdit(level)}>✏️</button>
                                <button className="btn-icon danger" onClick={() => handleDelete(level.id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                    {levels.length === 0 && (
                        <div className="empty-state">
                            <span style={{ fontSize: '3rem' }}>🏛️</span>
                            <p>No hierarchy levels defined yet.</p>
                        </div>
                    )}
                </div>
            )}

            {modal && (
                <Modal
                    title={modal === 'add' ? 'Add Hierarchy Level' : 'Edit Hierarchy Level'}
                    onClose={closeModal}
                >
                    <div className="form-group">
                        <label className="form-label">Level Name</label>
                        <input
                            className="form-input"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="e.g. Senior Manager"
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

export default HierarchyLevel;
