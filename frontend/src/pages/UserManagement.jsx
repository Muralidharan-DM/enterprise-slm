import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [masterData, setMasterData] = useState({
        geographies: [],
        business_units: [],
        domains: [],
        subdomains: []
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [hierarchyLevel, setHierarchyLevel] = useState("");
    const [selectedGeos, setSelectedGeos] = useState([]);
    const [selectedBUs, setSelectedBUs] = useState([]);
    const [selectedDomains, setSelectedDomains] = useState([]);
    const [selectedSubDomains, setSelectedSubDomains] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchMasterData();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await API.get('users/profiles/');
            setUsers(res.data);
        } catch (err) {
            console.error("Error fetching users", err);
        }
    };

    const fetchMasterData = async () => {
        try {
            const res = await API.get('users/master-data/');
            setMasterData(res.data);
        } catch (err) {
            console.error("Error fetching master data", err);
        }
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setHierarchyLevel(user.hierarchy_level || "");
        setSelectedGeos(user.geographies || []);
        setSelectedBUs(user.business_units || []);
        setSelectedDomains(user.domains || []);
        setSelectedSubDomains(user.subdomains || []);
        setIsModalOpen(true);
    };

    const toggleSelection = (item, selectedList, setSelectedList) => {
        if (selectedList.includes(item)) {
            setSelectedList(selectedList.filter(i => i !== item));
        } else {
            setSelectedList([...selectedList, item]);
        }
    };

    const handleSubdomainToggle = (sub) => {
        const subdomainName = sub.name;
        const parentDomain = sub.domain;

        if (selectedSubDomains.includes(subdomainName)) {
            setSelectedSubDomains(selectedSubDomains.filter(s => s !== subdomainName));
        } else {
            setSelectedSubDomains([...selectedSubDomains, subdomainName]);
            // Auto-select parent domain if not already selected
            if (!selectedDomains.includes(parentDomain)) {
                setSelectedDomains([...selectedDomains, parentDomain]);
            }
        }
    };

    const handleSave = async () => {
        try {
            await API.put(`users/profiles/${selectedUser.id}/`, {
                hierarchy_level: hierarchyLevel,
                geographies: selectedGeos,
                business_units: selectedBUs,
                domains: selectedDomains,
                subdomains: selectedSubDomains
            });
            setIsModalOpen(false);
            fetchUsers();
            alert("User updated successfully!");
        } catch (err) {
            console.error("Error updating user", err);
            alert("Failed to update user.");
        }
    };

    // Filter subdomains based on selected domains
    const availableSubdomains = masterData.subdomains.filter(
        sub => selectedDomains.length === 0 || selectedDomains.includes(sub.domain)
    );

    return (
        <div className="user-management-container">
            <h1>User Management</h1>
            <p>Manage geographies, domains, and business units for enterprise users.</p>

            <table className="user-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Hierarchy</th>
                        <th>Domains</th>
                        <th>Geographies</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.hierarchy_level || 'N/A'}</td>
                            <td>{user.domains.join(', ') || 'None'}</td>
                            <td>{user.geographies.join(', ') || 'None'}</td>
                            <td>
                                <button className="edit-btn" onClick={() => handleEdit(user)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Edit User: {selectedUser.email}</h2>
                            <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <div className="section">
                            <label className="section-title">Hierarchy Level</label>
                            <select 
                                className="hierarchy-select"
                                value={hierarchyLevel}
                                onChange={(e) => setHierarchyLevel(e.target.value)}
                            >
                                <option value="">Select Level</option>
                                <option value="L1 - Executive">L1 - Executive</option>
                                <option value="L2 - Management">L2 - Management</option>
                                <option value="L3 - Staff">L3 - Staff</option>
                            </select>
                        </div>

                        <div className="section">
                            <label className="section-title">Geographies</label>
                            <div className="chip-group">
                                {masterData.geographies.map(geo => (
                                    <div 
                                        key={geo}
                                        className={`chip ${selectedGeos.includes(geo) ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(geo, selectedGeos, setSelectedGeos)}
                                    >
                                        {geo}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="section">
                            <label className="section-title">Business Units</label>
                            <div className="chip-group">
                                {masterData.business_units.map(bu => (
                                    <div 
                                        key={bu}
                                        className={`chip ${selectedBUs.includes(bu) ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(bu, selectedBUs, setSelectedBUs)}
                                    >
                                        {bu}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="section">
                            <label className="section-title">Domains</label>
                            <div className="chip-group">
                                {masterData.domains.map(dom => (
                                    <div 
                                        key={dom}
                                        className={`chip ${selectedDomains.includes(dom) ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(dom, selectedDomains, setSelectedDomains)}
                                    >
                                        {dom}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="section">
                            <label className="section-title">Subdomains (Filtered by selected domains)</label>
                            <div className="chip-group">
                                {availableSubdomains.map(sub => (
                                    <div 
                                        key={sub.name}
                                        className={`chip ${selectedSubDomains.includes(sub.name) ? 'selected' : ''}`}
                                        onClick={() => handleSubdomainToggle(sub)}
                                    >
                                        {sub.name} <small style={{opacity: 0.7}}>({sub.domain})</small>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="save-btn" onClick={handleSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
