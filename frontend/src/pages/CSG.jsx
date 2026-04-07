import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/CSG.css';

const CSG = () => {
    const [groups, setGroups] = useState([]);
    const [masterData, setMasterData] = useState({
        domains: [],
        subdomains: [],
        users: []
    });
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
        fetchOracleSchema();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await API.get('security/csg/');
            setGroups(res.data);
        } catch (err) { console.error("Error fetching groups", err); }
    };

    const fetchMasterData = async () => {
        try {
            const domainRes = await API.get('users/master-data/');
            const userRes = await API.get('users/profiles/');
            setMasterData({
                domains: domainRes.data.domains,
                subdomains: domainRes.data.subdomains,
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

    const handleSubdomainToggle = (subName, parentDomain) => {
        const isSelected = formData.subdomains.includes(subName);
        let newSubdomains = isSelected 
            ? formData.subdomains.filter(s => s !== subName)
            : [...formData.subdomains, subName];
        
        let newDomains = [...formData.domains];
        if (!isSelected && !newDomains.includes(parentDomain)) {
            newDomains.push(parentDomain);
        }
        
        setFormData({ ...formData, subdomains: newSubdomains, domains: newDomains });
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
            alert("CSG Saved successfully!");
        } catch (err) {
            console.error("Error saving CSG", err);
            alert("Failed to save CSG.");
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
            <img src="/logo.png" alt="Decision Minds" style={{ width: '60px', marginBottom: '1rem' }} />
            <div className="csg-header">
                <h1>Column Security Groups</h1>
                <button className="add-btn" onClick={() => {
                    setFormData({ id: null, name: "", domains: [], subdomains: [], datasets: [], columns: {}, users: [] });
                    setCurrentStep(1);
                    setIsWizardOpen(true);
                }}>+ Add New Group</button>
            </div>

            <div className="csg-grid">
                {groups.map(group => (
                    <div key={group.id} className="csg-card">
                        <h3>{group.name}</h3>
                        <div className="csg-meta">
                            <p>Datasets: {group.datasets.length}</p>
                            <p>Users: {group.users.length}</p>
                        </div>
                        <button className="view-btn" onClick={() => handleEdit(group)}>View / Edit</button>
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
                                    {masterData.domains.map(dom => (
                                        <div 
                                            key={dom} 
                                            className={`chip ${formData.domains.includes(dom) ? 'selected' : ''}`}
                                            onClick={() => handleToggle(dom, formData.domains, 'domains')}
                                        >
                                            {dom}
                                        </div>
                                    ))}
                                </div>

                                <p className="section-title">Subdomains</p>
                                <div className="chip-group">
                                    {masterData.subdomains.map(sub => (
                                        <div 
                                            key={sub.name} 
                                            className={`chip ${formData.subdomains.includes(sub.name) ? 'selected' : ''}`}
                                            onClick={() => handleSubdomainToggle(sub.name, sub.domain)}
                                        >
                                            {sub.name} <small>({sub.domain})</small>
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
                            {currentStep > 1 && <button className="cancel-btn" onClick={() => setCurrentStep(currentStep - 1)}>Back</button>}
                            {currentStep < 3 ? (
                                <button className="save-btn" onClick={() => setCurrentStep(currentStep + 1)}>Next</button>
                            ) : (
                                <button className="save-btn" onClick={handleSubmit}>Save Group</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CSG;
