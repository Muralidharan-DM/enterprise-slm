import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/UserManagement.css';

const UserForm = ({ mode }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [master, setMaster] = useState({
        domains: [],
        subdomains: [],
        geographies: [],
        business_units: [],
        hierarchy_levels: []
    });

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        role: "user",
        hierarchy: "",
        domains: [],
        subdomains: [],
        geographies: [],
        business_units: []
    });

    useEffect(() => {
        loadMaster();
        if (mode === 'edit' && id) {
            fetchUser();
        }
    }, [id, mode]);

    const loadMaster = async () => {
        try {
            const res = await API.get('users/master-data/');
            setMaster(res.data);
        } catch (err) {
            toast.error("Cloud synchronization failed");
        }
    };

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await API.get(`users/users/${id}/`);
            setForm({
                ...res.data,
                password: "" 
            });
        } catch (err) {
            toast.error("Resource acquisition failed");
            navigate('/users');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleListSelection = (item, field) => {
        const current = form[field] || [];
        if (current.includes(item)) {
            setForm(prev => ({ ...prev, [field]: current.filter(i => i !== item) }));
        } else {
            setForm(prev => ({ ...prev, [field]: [...current, item] }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "create") {
                await API.post("users/users/create/", form);
                toast.success("User identity initialized");
            } else {
                await API.put(`users/users/update/${id}/`, form);
                toast.success("Identity updated successfully");
            }
            navigate("/users");
        } catch (err) {
            toast.error(err.response?.data?.error || "Save operation aborted");
        } finally {
            setLoading(false);
        }
    };

    const getAvailableSubdomains = () => {
        if (!form.domains.length) return [];
        return master.subdomains.filter(s => form.domains.includes(s.domain));
    };

    return (
        <div className="user-management-container">
            <div className="mb-8">
                <h1 className="page-title">{mode === 'create' ? 'Onboard New Identity' : `Refine Identity: ${form.username}`}</h1>
                <p className="text-secondary">Define organizational boundaries and secure access protocols.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* SECTION 1: User Info */}
                <div className="card">
                    <div className="section-title">
                        <span style={{color: '#6366f1'}}>01</span> User Information
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Username</label>
                            <input name="username" value={form.username} onChange={handleChange} required className="form-input" placeholder="e.g. ganesh_dm" />
                        </div>
                        <div>
                            <label className="form-label">Email Address</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required className="form-input" placeholder="email@enterprise.com" />
                        </div>
                        {mode === 'create' && (
                            <div>
                                <label className="form-label">Temporary Password</label>
                                <input type="password" name="password" value={form.password} onChange={handleChange} required className="form-input" />
                            </div>
                        )}
                        <div>
                            <label className="form-label">Administrative Role</label>
                            <select name="role" value={form.role} onChange={handleChange} className="form-input" style={{height: '50px'}}>
                                <option value="user">USER</option>
                                <option value="admin">ADMIN</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Organization */}
                <div className="card">
                    <div className="section-title">
                        <span style={{color: '#8b5cf6'}}>02</span> Organizational Scope
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="form-label">Reporting Hierarchy</label>
                            <select name="hierarchy" value={form.hierarchy} onChange={handleChange} className="form-input" style={{height: '50px'}}>
                                <option value="">Select Level</option>
                                {master.hierarchy_levels.map(lvl => (
                                    <option key={lvl.id} value={lvl.name}>{lvl.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="form-label">Analytical Domains</label>
                            <div className="chip-group">
                                {master.domains.map(dom => (
                                    <div 
                                        key={dom.id}
                                        className={`chip ${form.domains.includes(dom.name) ? 'selected' : ''}`}
                                        onClick={() => toggleListSelection(dom.name, 'domains')}
                                    >
                                        {dom.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Subdomains (Dependent on Selection)</label>
                            <div className="chip-group">
                                {getAvailableSubdomains().map(sub => (
                                    <div 
                                        key={sub.id}
                                        className={`chip ${form.subdomains.includes(sub.name) ? 'selected' : ''}`}
                                        onClick={() => toggleListSelection(sub.name, 'subdomains')}
                                    >
                                        {sub.name}
                                    </div>
                                ))}
                                {form.domains.length === 0 && <span className="text-secondary italic small">Select a domain first...</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Access Control */}
                <div className="card">
                    <div className="section-title">
                        <span style={{color: '#ec4899'}}>03</span> Regional & Business Access
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="form-label">Geographic Boundaries</label>
                            <div className="chip-group">
                                {master.geographies.map(geo => (
                                    <div 
                                        key={geo.id}
                                        className={`chip ${form.geographies.includes(geo.name) ? 'selected' : ''}`}
                                        onClick={() => toggleListSelection(geo.name, 'geographies')}
                                    >
                                        {geo.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Business Units</label>
                            <div className="chip-group">
                                {master.business_units.map(bu => (
                                    <div 
                                        key={bu.id}
                                        className={`chip ${form.business_units.includes(bu.name) ? 'selected' : ''}`}
                                        onClick={() => toggleListSelection(bu.name, 'business_units')}
                                    >
                                        {bu.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-6 pt-6 pb-20">
                    <button type="button" className="text-secondary font-semibold" onClick={() => navigate('/users')}>Discard Changes</button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Committing...' : mode === 'create' ? 'Initialize Interface' : 'Update Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;
