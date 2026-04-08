import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/UserManagement.css';

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        console.log("🚀 Initializing fetch: /api/users/");
        try {
            const res = await API.get('users/'); // Step 27.2.2.1.3 simplified path
            console.log("✅ Registry Data synchronized:", res.data);
            setUsers(res.data);
        } catch (err) {
            console.error("❌ Synchronization Failure:", err);
            toast.error("Failed to load user list");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-management-container">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="page-title">Enterprise Identity</h1>
                    <p className="text-secondary">Orchestrate organizational access, roles, and administrative hierarchies.</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/users/create')}>
                    ➕ Create New User
                </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                {loading ? (
                    <div className="p-10 text-center text-secondary">Synchronizing enterprise registry...</div>
                ) : (
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Domains</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-secondary italic">
                                        No enterprise users found. Onboard your first identity to begin.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="row-hover">
                                        <td className="font-semibold">{user.name}</td>
                                        <td style={{ color: '#9ca3af' }}>{user.email}</td>
                                        <td>
                                            <span className={`role-badge ${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2 flex-wrap">
                                                {user.domains && user.domains.length > 0 ? (
                                                    user.domains.map(d => (
                                                        <span key={d} className="chip" style={{fontSize: '0.7rem', padding: '2px 8px', cursor: 'default'}}>
                                                            {d}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-secondary italic small">Unassigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn-primary" 
                                                onClick={() => navigate(`/users/edit/${user.id}`)}
                                                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                                            >
                                                Modify
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
