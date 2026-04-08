import React, { useState } from 'react';
import toast from 'react-hot-toast';
import '../styles/OrgPages.css';

const INITIAL_DOMAINS = [
    {
        id: 1, name: 'Sales', color: '#6366f1',
        subdomains: [{ id: 101, name: 'Revenue' }, { id: 102, name: 'Orders' }]
    },
    {
        id: 2, name: 'Product', color: '#8b5cf6',
        subdomains: [{ id: 201, name: 'Catalog' }, { id: 202, name: 'Categories' }]
    },
    {
        id: 3, name: 'Finance', color: '#06b6d4',
        subdomains: [{ id: 301, name: 'Budgeting' }, { id: 302, name: 'Reporting' }]
    },
    {
        id: 4, name: 'HR', color: '#f59e0b',
        subdomains: [{ id: 401, name: 'Recruitment' }, { id: 402, name: 'Payroll' }]
    },
];

// Simple unique ID generator for local state
let _nextId = 500;
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

const Domains = () => {
    const [domains, setDomains] = useState(INITIAL_DOMAINS);
    const [expanded, setExpanded] = useState(new Set([1]));
    const [modal, setModal] = useState(null); // { type: 'domain'|'subdomain', domainId?, editing? }
    const [formName, setFormName] = useState('');

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

    const handleSave = () => {
        if (!formName.trim()) { toast.error('Name cannot be empty'); return; }

        if (modal.type === 'domain') {
            if (modal.editing) {
                setDomains(prev => prev.map(d => d.id === modal.editing.id ? { ...d, name: formName } : d));
                toast.success('Domain updated');
            } else {
                setDomains(prev => [...prev, { id: uid(), name: formName, color: '#6366f1', subdomains: [] }]);
                toast.success('Domain created');
            }
        } else {
            if (modal.editing) {
                setDomains(prev => prev.map(d => d.id === modal.domainId
                    ? { ...d, subdomains: d.subdomains.map(s => s.id === modal.editing.id ? { ...s, name: formName } : s) }
                    : d
                ));
                toast.success('Subdomain updated');
            } else {
                setDomains(prev => prev.map(d => d.id === modal.domainId
                    ? { ...d, subdomains: [...d.subdomains, { id: uid(), name: formName }] }
                    : d
                ));
                toast.success('Subdomain added');
            }
        }
        closeModal();
    };

    const deleteDomain = (id) => {
        setDomains(prev => prev.filter(d => d.id !== id));
        toast.success('Domain deleted');
    };

    const deleteSubdomain = (domainId, subId) => {
        setDomains(prev => prev.map(d => d.id === domainId
            ? { ...d, subdomains: d.subdomains.filter(s => s.id !== subId) }
            : d
        ));
        toast.success('Subdomain deleted');
    };

    return (
        <div className="org-page">
            <div className="org-page-header">
                <div>
                    <h1 className="page-title">Domains & Subdomains</h1>
                    <p className="page-subtitle">Manage your organization's analytical domains and their subdivisions.</p>
                </div>
                <button className="btn-primary" onClick={() => openModal('domain')}>
                    + Add Domain
                </button>
            </div>

            <div className="domain-tree">
                {domains.map(domain => (
                    <div key={domain.id} className="domain-node">
                        <div className="domain-header-row">
                            <button className="expand-toggle" onClick={() => toggleExpand(domain.id)}>
                                {expanded.has(domain.id) ? '▼' : '▶'}
                            </button>
                            <div className="domain-dot" style={{ background: domain.color }}></div>
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
                                            <button className="btn-icon danger" title="Delete" onClick={() => deleteSubdomain(domain.id, sub.id)}>🗑️</button>
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
