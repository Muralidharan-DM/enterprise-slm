import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    
    // Form fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await API.get("users/me/");
            setProfile(res.data);
            setFirstName(res.data.first_name || "");
            setLastName(res.data.last_name || "");
            if (res.data.profile_photo) {
                setPhotoPreview(res.data.profile_photo);
            }
        } catch (err) {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);
        if (password) formData.append("password", password);
        if (photo) formData.append("profile_photo", photo);

        try {
            await API.put("users/me/", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Profile updated successfully");
            setEditing(false);
            setPassword("");
            fetchProfile();
        } catch (err) {
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profile) return <div className="p-8">Loading Profile...</div>;

    return (
        <div className="profile-container p-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 className="page-title">User Profile</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Photo Card */}
                <div className="card text-center flex flex-col items-center">
                    <div className="profile-photo-wrapper mb-4" style={{ position: 'relative' }}>
                        <img 
                            src={photoPreview || "https://ui-avatars.com/api/?name=" + (profile?.email || 'User')} 
                            alt="Profile" 
                            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent-primary)' }}
                        />
                        {editing && (
                            <label className="photo-upload-label" style={{ 
                                position: 'absolute', bottom: 0, right: 0, 
                                background: 'var(--accent-primary)', padding: '8px', 
                                borderRadius: '50%', cursor: 'pointer', color: 'white'
                            }}>
                                📷
                                <input type="file" hidden onChange={handlePhotoChange} accept="image/*" />
                            </label>
                        )}
                    </div>
                    <h3 className="mb-1">{profile?.first_name} {profile?.last_name}</h3>
                    <p className="text-secondary small">{profile?.email}</p>
                    <div className="badge mt-4" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {profile?.role?.toUpperCase()}
                    </div>
                </div>

                {/* Account Settings Card */}
                <div className="card col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="m-0">Account Information</h3>
                        <button 
                            className={`btn-${editing ? 'secondary' : 'primary'}`} 
                            onClick={() => setEditing(!editing)}
                            style={{ padding: '6px 16px', fontSize: '0.9rem' }}
                        >
                            {editing ? "Cancel" : "Edit Profile"}
                        </button>
                    </div>

                    <form onSubmit={handleUpdate}>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="form-group">
                                <label className="text-secondary small d-block mb-1">First Name</label>
                                <input 
                                    type="text" 
                                    value={firstName} 
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={!editing}
                                    style={{ width: '100%', background: editing ? 'var(--bg-app)' : 'transparent', border: editing ? '1px solid var(--border-color)' : 'none' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="text-secondary small d-block mb-1">Last Name</label>
                                <input 
                                    type="text" 
                                    value={lastName} 
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={!editing}
                                    style={{ width: '100%', background: editing ? 'var(--bg-app)' : 'transparent', border: editing ? '1px solid var(--border-color)' : 'none' }}
                                />
                            </div>
                        </div>

                        <div className="form-group mb-6">
                            <label className="text-secondary small d-block mb-1">Update Password</label>
                            <input 
                                type="password" 
                                placeholder={editing ? "Leave blank to keep current" : "••••••••"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={!editing}
                                style={{ width: '100%', background: editing ? 'var(--bg-app)' : 'transparent', border: editing ? '1px solid var(--border-color)' : 'none' }}
                            />
                        </div>

                        {editing && (
                            <button type="submit" className="btn-primary w-100" disabled={loading}>
                                {loading ? "Updating..." : "Save Changes"}
                            </button>
                        )}
                    </form>

                    <hr className="my-8" style={{ opacity: 0.1 }} />

                    <h3 className="mb-4">Organizational Attributes</h3>
                    <div className="grid grid-cols-2 gap-y-6">
                        <div className="attr-item">
                            <label className="text-secondary small d-block">Geography</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile?.geographies?.map(g => <span key={Math.random()} className="pill" style={{ background: '#1f2937', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>{g}</span>)}
                                {(profile?.geographies?.length === 0 || !profile?.geographies) && <span className="text-secondary">Global</span>}
                            </div>
                        </div>
                        <div className="attr-item">
                            <label className="text-secondary small d-block">Business Units</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile?.business_units?.map(b => <span key={Math.random()} className="pill" style={{ background: '#1f2937', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>{b}</span>)}
                                {(profile?.business_units?.length === 0 || !profile?.business_units) && <span className="text-secondary">Corporate</span>}
                            </div>
                        </div>
                        <div className="attr-item">
                            <label className="text-secondary small d-block">Domains</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile?.domains?.map(d => <span key={Math.random()} className="pill" style={{ background: '#1f2937', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>{d}</span>)}
                            </div>
                        </div>
                        <div className="attr-item">
                            <label className="text-secondary small d-block">Sub-Domains</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile?.subdomains?.map(s => <span key={Math.random()} className="pill" style={{ background: '#1f2937', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>{s}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
