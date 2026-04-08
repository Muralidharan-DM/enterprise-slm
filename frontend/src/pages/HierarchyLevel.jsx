import React, { useState } from 'react';
import toast from 'react-hot-toast';
import '../styles/OrgPages.css';

const LEVELS = [
    { id: 1, name: 'Executive Director', code: 'L1', description: 'C-Suite and executive leadership' },
    { id: 2, name: 'Senior Director', code: 'L2', description: 'Senior management and direction' },
    { id: 3, name: 'Manager', code: 'L3', description: 'Team management and oversight' },
    { id: 4, name: 'Senior Associate', code: 'L4', description: 'Senior individual contributors' },
    { id: 5, name: 'Associate', code: 'L5', description: 'Individual contributors' },
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

const HierarchyLevel = () => {
    const [levels, setLevels] = useState(LEVELS);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', description: '' });

    const openAdd = () => {
        setForm({ name: '', code: '', description: '' });
        setModal('add');
    };

    const openEdit = (level) => {
        setForm({ name: level.name, code: level.code, description: level.description, id: level.id });
        setModal('edit');
    };

    const handleSave = () => {
        if (!form.name.trim() || !form.code.trim()) { toast.error('Name and code are required'); return; }
        if (modal === 'edit') {
            setLevels(prev => prev.map(l => l.id === form.id ? { ...l, ...form } : l));
            toast.success('Hierarchy level updated');
        } else {
            setLevels(prev => [...prev, { id: uid(), ...form }]);
            toast.success('Hierarchy level created');
        }
        setModal(null);
    };

    const handleDelete = (id) => {
        setLevels(prev => prev.filter(l => l.id !== id));
        toast.success('Hierarchy level deleted');
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

            <div className="hierarchy-grid">
                {levels.map((level, idx) => (
                    <div key={level.id} className="hierarchy-card">
                        <div className="hierarchy-rank">L{idx + 1}</div>
                        <div className="hierarchy-info">
                            <div className="hierarchy-name">{level.name}</div>
                            <div className="hierarchy-code">Code: <strong>{level.code}</strong></div>
                            <div className="hierarchy-desc">{level.description}</div>
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

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Hierarchy Level' : 'Add Hierarchy Level'} onClose={() => setModal(null)}>
                    <div className="form-group">
                        <label className="form-label">Level Name</label>
                        <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Senior Manager" autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Code</label>
                        <input className="form-input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. L3" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief role description..." />
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

export default HierarchyLevel;
