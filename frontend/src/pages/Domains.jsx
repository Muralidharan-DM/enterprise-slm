import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api'; // Step 24.2.2.2.1
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

const Domains = () => {
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(new Set());
    const [modal, setModal] = useState(null); // { type: 'domain'|'subdomain', domainId?, editing? }
    const [formName, setFormName] = useState('');

    const fetchDomains = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('users/domains/manage/');
            setDomains(res.data);
            // Expand first domain by default if available
            setExpanded(prev => {
                if (res.data.length > 0 && prev.size === 0) {
                    return new Set([res.data[0].id]);
                }
                return prev;
            });
        } catch (err) {
            toast.error("Failed to load domains from database");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    const toggleExpand = (id) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const openModal = (type, domainId = null, editing = null) => {
        setFormName(editing ? editing.name : '');
        setModal({ type, domainId, editing });
    };

    const closeModal = () => { setModal(null); setFormName(''); };

    const handleSave = async () => {
        if (!formName.trim()) { toast.error('Name cannot be empty'); return; }

        try {
            if (modal.type === 'domain') {
                if (modal.editing) {
                    await API.put(`users/domains/manage/${modal.editing.id}/`, { name: formName });
                    toast.success('Domain updated in database');
                } else {
                    await API.post('users/domains/manage/', { name: formName });
                    toast.success('New domain saved to database');
                }
            } else {
                if (modal.editing) {
                    await API.put(`users/subdomains/${modal.editing.id}/`, { name: formName });
                    toast.success('Subdomain updated in database');
                } else {
                    await API.post('users/subdomains/create/', { domainId: modal.domainId, name: formName });
                    toast.success('New subdomain saved to database');
                }
            }
            fetchDomains(); // Refresh from DB
            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.error || "Error saving changes");
        }
    };

    const deleteDomain = async (id) => {
        if (!window.confirm("Are you sure? This will delete all associated subdomains.")) return;
        try {
            await API.delete(`users/domains/manage/${id}/`);
            toast.success('Domain deleted from database');
            fetchDomains();
        } catch (err) {
            toast.error("Deletion failed");
        }
    };

    const deleteSubdomain = async (subId) => {
        if (!window.confirm("Delete this subdomain?")) return;
        try {
            await API.delete(`users/subdomains/${subId}/`);
            toast.success('Subdomain deleted from database');
            fetchDomains();
        } catch (err) {
            toast.error("Deletion failed");
        }
    };

    return (
        <div className="org-page">
            <div className="org-page-header">
                <div>
                    <h1 className="page-title">Domains & Subdomains</h1>
                    <p className="page-subtitle">Manage your organization's analytical domains and their subdivisions (Database Persistent).</p>
                </div>
                <button className="btn-primary" onClick={() => openModal('domain')}>
                    + Add Domain
                </button>
            </div>

            {loading ? (
                <div className="empty-state">Loading domains...</div>
            ) : (
                <div className="domain-tree">
                    {domains.map(domain => (
                        <div key={domain.id} className="domain-node">
                            <div className="domain-header-row">
                                <button className="expand-toggle" onClick={() => toggleExpand(domain.id)}>
                                    {expanded.has(domain.id) ? '▼' : '▶'}
                                </button>
                                <div className="domain-dot" style={{ background: '#6366f1' }}></div>
                                <span className="domain-name">{domain.name}</span>
                                <span className="subdomain-count">{domain.subdomains.length} subdomains</span>
                                <div className="domain-actions">
                                    <button className="btn-icon" title="Add Subdomain" onClick={() => { openModal('subdomain', domain.id); setExpanded(p => new Set([...p, domain.id])); }}>+</button>
                                    <button className="btn-icon edit" title="Edit Domain" onClick={() => openModal('domain', null, domain)}>✏️</button>
                                    <button className="btn-icon danger" title="Delete Domain" onClick={() => deleteDomain(domain.id)}>🗑️</button>
                                </div>
                            </div>

                            {expanded.has(domain.id) && (
                                <div className="subdomain-list">
                                    {domain.subdomains.length === 0 && (
                                        <div className="empty-subdomains">No subdomains yet. Click + to add one.</div>
                                    )}
                                    {domain.subdomains.map(sub => (
                                        <div key={sub.id} className="subdomain-item">
                                            <div className="subdomain-connector"></div>
                                            <span className="subdomain-name">{sub.name}</span>
                                            <div className="domain-actions">
                                                <button className="btn-icon edit" title="Edit" onClick={() => openModal('subdomain', domain.id, sub)}>✏️</button>
                                                <button className="btn-icon danger" title="Delete" onClick={() => deleteSubdomain(sub.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {domains.length === 0 && (
                        <div className="empty-state">
                            <span style={{ fontSize: '3rem' }}>🌐</span>
                            <p>No domains yet. Create your first domain to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {modal && (
                <Modal
                    title={modal.editing
                        ? `Edit ${modal.type === 'domain' ? 'Domain' : 'Subdomain'}`
                        : `Add ${modal.type === 'domain' ? 'Domain' : 'Subdomain'}`}
                    onClose={closeModal}
                >
                    <div className="form-group">
                        <label className="form-label">{modal.type === 'domain' ? 'Domain Name' : 'Subdomain Name'}</label>
                        <input
                            className="form-input"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder={modal.type === 'domain' ? 'e.g. Marketing' : 'e.g. Campaigns'}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            autoFocus
                        />
                    </div>
                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave}>
                            {modal.editing ? 'Update' : 'Create'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Domains;
