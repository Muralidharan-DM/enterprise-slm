import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/Profile.css';

const Tag = ({ label }) => <span className="profile-tag">{label}</span>;

const AllAccessBadge = () => (
    <span className="profile-all-access">All Access</span>
);

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ username: '', first_name: '', last_name: '', password: '' });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await API.get('users/me/');
            setProfile(res.data);
            setForm({
                username: res.data.username || '',
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                password: '',
            });
            setPhotoPreview(res.data.profile_photo || null);
        } catch {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('username', form.username);
            fd.append('first_name', form.first_name);
            fd.append('last_name', form.last_name);
            if (form.password) fd.append('password', form.password);
            if (photoFile) fd.append('profile_photo', photoFile);
            await API.put('users/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Profile updated');
            setEditing(false);
            setPhotoFile(null);
            setForm(f => ({ ...f, password: '' }));
            fetchProfile();
        } catch {
            toast.error('Update failed');
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        setEditing(false);
        setPhotoFile(null);
        setPhotoPreview(profile?.profile_photo || null);
        setForm({
            username: profile?.username || '',
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            password: '',
        });
    };

    const getInitials = () => {
        const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.username || '?';
        return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    };

    const isAdmin = profile?.role === 'admin';

    if (loading) return (
        <div className="profile-page">
            <div className="profile-loading">Loading profile…</div>
        </div>
    );

    return (
        <div className="profile-page">
            <div className="profile-header-bar">
                <div>
                    <h1 className="page-title" style={{ marginBottom: 4 }}>My Profile</h1>
                    <p className="profile-subtitle">View and manage your account information</p>
                </div>
                {!editing ? (
                    <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                        <button className="btn-primary" form="profile-form" type="submit" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            <div className="profile-grid">

                {/* ── Left: Avatar + Identity ── */}
                <div className="profile-card profile-identity-card">
                    <div className="profile-avatar-wrap">
                        {photoPreview
                            ? <img src={photoPreview} alt="avatar" className="profile-avatar-img" />
                            : <div className="profile-avatar-initials">{getInitials()}</div>
                        }
                        {editing && (
                            <button
                                type="button"
                                className="profile-photo-btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Change photo"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                    <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-1-1H7.586l-1 1H4zm6 9a3 3 0 110-6 3 3 0 010 6z"/>
                                </svg>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                    </div>

                    <div className="profile-identity-info">
                        <div className="profile-display-name">
                            {profile?.first_name || profile?.last_name
                                ? `${profile.first_name} ${profile.last_name}`.trim()
                                : profile?.username}
                        </div>
                        <div className="profile-email">{profile?.email}</div>
                        <span className={`profile-role-badge ${isAdmin ? 'admin' : 'user'}`}>
                            {isAdmin ? 'Administrator' : 'User'}
                        </span>
                    </div>

                    {profile?.hierarchy && (
                        <div className="profile-hierarchy">
                            <div className="profile-attr-label">Hierarchy Level</div>
                            <div className="profile-hierarchy-value">{profile.hierarchy}</div>
                        </div>
                    )}
                </div>

                {/* ── Right: Account + Access ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Account settings */}
                    <div className="profile-card">
                        <div className="profile-card-title">Account Settings</div>
                        <form id="profile-form" onSubmit={handleSave} className="profile-form-grid">
                            <div className="profile-field">
                                <label className="profile-field-label">Full Name</label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input
                                        className={`profile-input ${!editing ? 'readonly' : ''}`}
                                        value={form.first_name}
                                        onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                        placeholder="First name"
                                        readOnly={!editing}
                                    />
                                    <input
                                        className={`profile-input ${!editing ? 'readonly' : ''}`}
                                        value={form.last_name}
                                        onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                        placeholder="Last name"
                                        readOnly={!editing}
                                    />
                                </div>
                            </div>
                            <div className="profile-field">
                                <label className="profile-field-label">Username</label>
                                <input
                                    className={`profile-input ${!editing ? 'readonly' : ''}`}
                                    value={form.username}
                                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                    readOnly={!editing}
                                />
                            </div>
                            <div className="profile-field">
                                <label className="profile-field-label">Email Address</label>
                                <input
                                    className="profile-input readonly"
                                    value={profile?.email || ''}
                                    readOnly
                                />
                            </div>
                            {editing && (
                                <div className="profile-field">
                                    <label className="profile-field-label">New Password <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(leave blank to keep current)</span></label>
                                    <input
                                        type="password"
                                        className="profile-input"
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        placeholder="Enter new password"
                                    />
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Access attributes */}
                    <div className="profile-card">
                        <div className="profile-card-title">Organizational Access</div>
                        <div className="profile-access-grid">

                            <div className="profile-access-section">
                                <div className="profile-attr-label">Domains</div>
                                <div className="profile-tags">
                                    {isAdmin
                                        ? <AllAccessBadge />
                                        : profile?.domains?.length > 0
                                            ? profile.domains.map(d => <Tag key={d} label={d} />)
                                            : <span className="profile-empty-attr">Not assigned</span>
                                    }
                                </div>
                            </div>

                            <div className="profile-access-section">
                                <div className="profile-attr-label">Sub-Domains</div>
                                <div className="profile-tags">
                                    {isAdmin
                                        ? <AllAccessBadge />
                                        : profile?.subdomains?.length > 0
                                            ? profile.subdomains.map(s => <Tag key={s} label={s} />)
                                            : <span className="profile-empty-attr">Not assigned</span>
                                    }
                                </div>
                            </div>

                            <div className="profile-access-section">
                                <div className="profile-attr-label">Geography</div>
                                <div className="profile-tags">
                                    {isAdmin
                                        ? <AllAccessBadge />
                                        : profile?.geographies?.length > 0
                                            ? profile.geographies.map(g => <Tag key={g} label={g} />)
                                            : <span className="profile-empty-attr">Not assigned</span>
                                    }
                                </div>
                            </div>

                            <div className="profile-access-section">
                                <div className="profile-attr-label">Business Units</div>
                                <div className="profile-tags">
                                    {isAdmin
                                        ? <AllAccessBadge />
                                        : profile?.business_units?.length > 0
                                            ? profile.business_units.map(b => <Tag key={b} label={b} />)
                                            : <span className="profile-empty-attr">Not assigned</span>
                                    }
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
