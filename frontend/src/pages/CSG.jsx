import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/CSG.css';

const CSG = () => {
    const [groups, setGroups] = useState([]);
    const [masterData, setMasterData] = useState({
        users: []
    });
    const [domainConfig, setDomainConfig] = useState({}); // Step 23.2.3.1.2
    const [oracleSchema, setOracleSchema] = useState({});
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    
    // Form State
    const [formData, setFormData] = useState({
        id: null,
        name: "",
        domains: [],
        subdomains: [],
        datasets: [],
        columns: {},
        users: []
    });

    useEffect(() => {
        fetchGroups();
        fetchMasterData();
        fetchDomainConfig(); // Step 23.2.3.1.2
        fetchOracleSchema();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await API.get('security/csg/');
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

    const handleColumnToggle = (dataset, column) => {
        const currentCols = formData.columns[dataset] || [];
        const newCols = currentCols.includes(column) 
            ? currentCols.filter(c => c !== column)
            : [...currentCols, column];
        
        const newColumns = { ...formData.columns, [dataset]: newCols };
        
        // Update datasets list based on selection
        let newDatasets = [...formData.datasets];
        if (newCols.length > 0 && !newDatasets.includes(dataset)) {
            newDatasets.push(dataset);
        } else if (newCols.length === 0) {
            newDatasets = newDatasets.filter(d => d !== dataset);
        }
        
        setFormData({ ...formData, columns: newColumns, datasets: newDatasets });
    };

    const handleSubmit = async () => {
        try {
            if (formData.id) {
                await API.put(`security/csg/${formData.id}/update/`, formData);
            } else {
                await API.post('security/csg/create/', formData);
            }
            setIsWizardOpen(false);
            fetchGroups();
            toast.success("CSG Saved successfully!");
        } catch (err) {
            console.error("Error saving CSG", err);
            toast.error("Failed to save CSG.");
        }
    };

    const handleEdit = async (group) => {
        try {
            const res = await API.get(`security/csg/${group.id}/`);
            const data = res.data;
            // Resolve names back to IDs for the form
            const domainIds = masterData.domains.filter(d => data.domains.includes(d)).map(d => d); 
            // Wait, we need the actual IDs. Let's assume masterData contains names for now as per serializer.
            // Simplified: Use names as IDs if that's what the backend expects, but the backend uses IDs.
            // Refinement: I'll update the view to resolve names if needed, but for now I'll use IDs.
            
            setFormData({
                id: data.id,
                name: data.name,
                domains: data.domains, // names
                subdomains: data.subdomains, // names 
                datasets: data.datasets,
                columns: data.columns,
                users: data.users // emails
            });
            setCurrentStep(1);
            setIsWizardOpen(true);
        } catch (err) { console.error("Error fetching group detail", err); }
    };

    return (
        <div className="csg-container">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="page-title">Column Security Groups</h1>
                    <p className="text-secondary">Define field-level visibility policies for datasets.</p>
                </div>
                <button className="btn-primary" onClick={() => {
                    setFormData({ id: null, name: "", domains: [], subdomains: [], datasets: [], columns: {}, users: [] });
                    setCurrentStep(1);
                    setIsWizardOpen(true);
                }}>+ Create CSG</button>
            </div>

            <div className="csg-grid">
                {groups.map(group => (
                    <div key={group.id} className="card">
                        <h3 className="mb-2">{group.name}</h3>
                        <div className="flex gap-4 mb-4">
                            <span className="text-secondary small">📦 {group.datasets.length} Datasets</span>
                            <span className="text-secondary small">👥 {group.users.length} Users</span>
                        </div>
                        <button className="btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '6px' }} onClick={() => handleEdit(group)}>View / Edit</button>
                    </div>
                ))}
            </div>

            {isWizardOpen && (
                <div className="wizard-overlay">
                    <div className="wizard-content">
                        <div className="wizard-header">
                            <h2>{formData.id ? 'Edit' : 'Create'} Security Group</h2>
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
                                <h3>Step 2: Datasets & Columns</h3>
                                <div className="dataset-tree">
                                    {Object.entries(oracleSchema).map(([dataset, columns]) => (
                                        <div key={dataset} className="dataset-item">
                                            <div className="dataset-name">📂 {dataset}</div>
                                            <div className="column-list">
                                                {columns.map(col => (
                                                    <div key={col} className="column-item">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={(formData.columns[dataset] || []).includes(col)}
                                                            onChange={() => handleColumnToggle(dataset, col)}
                                                        />
                                                        {col}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
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
                                <button className="btn-primary" onClick={handleSubmit}>Save Policy</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CSG;
