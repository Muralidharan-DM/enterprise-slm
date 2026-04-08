import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/CSG.css'; // Reuse CSG styles as requested

const RSG = () => {
    const [groups, setGroups] = useState([]);
    const [masterData, setMasterData] = useState({
        users: []
    });
    const [domainConfig, setDomainConfig] = useState({}); // Step 23.2.3.1.4
    const [oracleSchema, setOracleSchema] = useState({});
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    
    // Form State
    const [formData, setFormData] = useState({
        id: null,
        name: "",
        domains: [],
        subdomains: [],
        filters: {}, // Structure: {"Region": "APAC"}
        users: []
    });

    useEffect(() => {
        fetchGroups();
        fetchMasterData();
        fetchDomainConfig(); // Step 23.2.3.1.4
        fetchOracleSchema();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await API.get('security/rsg/');
            setGroups(res.data);
        } catch (err) { console.error("Error fetching groups", err); }
    };

    const fetchDomainConfig = async () => {
        try {
            const res = await API.get('users/domains/');
            setDomainConfig(res.data);
        } catch (err) { console.error("Error fetching domain config", err); }
    };

    const fetchMasterData = async () => {
        try {
            const userRes = await API.get('users/profiles/');
            setMasterData({
                users: userRes.data
            });
        } catch (err) { console.error("Error fetching master data", err); }
    };

    const fetchOracleSchema = async () => {
        try {
            const res = await API.get('data-studio/oracle-schema/');
            setOracleSchema(res.data);
        } catch (err) { console.error("Error fetching oracle schema", err); }
    };

    const handleToggle = (item, list, field) => {
        const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
        setFormData({ ...formData, [field]: newList });
    };

    const handleSubdomainToggle = (subName) => {
        const isSelected = formData.subdomains.includes(subName);
        let newSubdomains = isSelected 
            ? formData.subdomains.filter(s => s !== subName)
            : [...formData.subdomains, subName];
        
        setFormData({ ...formData, subdomains: newSubdomains });
    };

    const getAvailableSubdomains = () => {
        let subs = [];
        formData.domains.forEach(d => {
            if (domainConfig[d]) subs.push(...domainConfig[d].subdomains);
        });
        return [...new Set(subs)];
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...formData.filters, [key]: value };
        if (value === "" || value === null) {
            delete newFilters[key];
        }
        setFormData({ ...formData, filters: newFilters });
    };

    const handleSubmit = async () => {
        try {
            if (formData.id) {
                await API.put(`security/rsg/${formData.id}/update/`, formData);
            } else {
                await API.post('security/rsg/create/', formData);
            }
            setIsWizardOpen(false);
            fetchGroups();
            toast.success("RSG Saved successfully!");
        } catch (err) {
            console.error("Error saving RSG", err);
            toast.error("Failed to save RSG.");
        }
    };

    const handleEdit = async (group) => {
        try {
            const res = await API.get(`security/rsg/${group.id}/`);
            const data = res.data;
            setFormData({
                id: data.id,
                name: data.name,
                domains: data.domains,
                subdomains: data.subdomains,
                filters: data.filters,
                users: data.users
            });
            setCurrentStep(1);
            setIsWizardOpen(true);
        } catch (err) { console.error("Error fetching group detail", err); }
    };

    // Flatten columns for the filter dropdown
    const allColumns = Array.from(new Set(Object.values(oracleSchema).flat()));

    return (
        <div className="csg-container">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="page-title">Row Security Groups (RSG)</h1>
                    <p className="text-secondary">Define record-level visibility policies using dynamic column filters.</p>
                </div>
                <button className="btn-primary" onClick={() => {
                    setFormData({ id: null, name: "", domains: [], subdomains: [], filters: {}, users: [] });
                    setCurrentStep(1);
                    setIsWizardOpen(true);
                }}>+ Create RSG</button>
            </div>

            <div className="csg-grid">
                {groups.map(group => (
                    <div key={group.id} className="card">
                        <h3 className="mb-2">{group.name}</h3>
                        <div className="mb-4">
                            <div className="text-secondary small mb-1">Filters: {Object.keys(group.filters).join(', ') || 'None'}</div>
                            <div className="text-secondary small">👥 {group.users.length} Users Assigned</div>
                        </div>
                        <button className="btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '6px' }} onClick={() => handleEdit(group)}>View / Edit</button>
                    </div>
                ))}
            </div>

            {isWizardOpen && (
                <div className="wizard-overlay">
                    <div className="wizard-content">
                        <div className="wizard-header">
                            <h2>{formData.id ? 'Edit' : 'Create'} Row Security Group</h2>
                            <button className="cancel-btn" onClick={() => setIsWizardOpen(false)}>×</button>
                        </div>

                        <div className="wizard-steps">
                            <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''}`}>1</div>
                            <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''}`}>2</div>
                            <div className={`step-indicator ${currentStep >= 3 ? 'active' : ''}`}>3</div>
                        </div>

                        {currentStep === 1 && (
                            <div className="step-content">
                                <h3>Step 1: Group Name & Scope</h3>
                                <input 
                                    className="hierarchy-select" 
                                    placeholder="Enter Group Name" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                
                                <p className="section-title">Domains</p>
                                <div className="chip-group">
                                    {Object.keys(domainConfig).map(dom => (
                                        <div 
                                            key={dom} 
                                            className={`chip ${formData.domains.includes(dom) ? 'selected' : ''}`}
                                            onClick={() => handleToggle(dom, formData.domains, 'domains')}
                                        >
                                            {dom}
                                        </div>
                                    ))}
                                </div>

                                <p className="section-title">Subdomains (Dynamic)</p>
                                <div className="chip-group">
                                    {getAvailableSubdomains().map(sub => (
                                        <div 
                                            key={sub} 
                                            className={`chip ${formData.subdomains.includes(sub) ? 'selected' : ''}`}
                                            onClick={() => handleSubdomainToggle(sub)}
                                        >
                                            {sub}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="step-content">
                                <h3>Step 2: Dynamic Row Filters</h3>
                                <p>Select a column, operator, and value to restrict row visibility.</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                                    {/* For simplification, we allow one filter per column. Usually this UI would allow adding rows. */}
                                    {allColumns.map(col => (
                                        <div key={col} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ minWidth: '150px', fontWeight: 'bold' }}>{col}</span>
                                            <span style={{ color: '#666' }}>=</span>
                                            <input 
                                                className="hierarchy-select"
                                                style={{ marginBottom: 0, padding: '0.4rem' }}
                                                placeholder="Filter Value (e.g. APAC)"
                                                value={formData.filters[col] || ""}
                                                onChange={(e) => handleFilterChange(col, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '2rem' }}>
                                    <p className="section-title">Active Filters:</p>
                                    <div className="chip-group">
                                        {Object.entries(formData.filters).map(([k, v]) => (
                                            <div key={k} className="chip selected">
                                                {k} = "{v}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="step-content">
                                <h3>Step 3: Assign Users</h3>
                                <div className="chip-group">
                                    {masterData.users.map(user => (
                                        <div 
                                            key={user.id} 
                                            className={`chip ${formData.users.includes(user.email) ? 'selected' : ''}`}
                                            onClick={() => handleToggle(user.email, formData.users, 'users')}
                                        >
                                            {user.email}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            {currentStep > 1 && <button className="btn-secondary" onClick={() => setCurrentStep(currentStep - 1)}>Back</button>}
                            {currentStep < 3 ? (
                                <button className="btn-primary" onClick={() => setCurrentStep(currentStep + 1)}>Next Step</button>
                            ) : (
                                <button className="btn-primary" onClick={handleSubmit}>Save RSG Policy</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RSG;
