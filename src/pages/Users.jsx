import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import PageLoader from '../components/PageLoader';

export default function Users() {
    const { isSuperAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin', location: '' });
    const [saving, setSaving] = useState(false);

    const fetchUsers = () => {
        apiFetch('/api/users').then(setUsers).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
        apiFetch('/api/locations').then(setLocations).catch(() => { });
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
            toast.success('User created!');
            setForm({ name: '', email: '', password: '', role: 'admin', location: '' });
            setShowForm(false);
            fetchUsers();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    const handleRoleChange = async (uid, role) => {
        try {
            await apiFetch('/api/users', { method: 'PUT', body: JSON.stringify({ uid, role }) });
            toast.success('Role updated');
            fetchUsers();
        } catch (err) { toast.error(err.message); }
    };

    const handleLocationChange = async (uid, location) => {
        try {
            await apiFetch('/api/users', { method: 'PUT', body: JSON.stringify({ uid, location }) });
            toast.success('Location updated');
            fetchUsers();
        } catch (err) { toast.error(err.message); }
    };

    const handleDelete = async (uid) => {
        if (!confirm('Delete this user permanently?')) return;
        try {
            await apiFetch('/api/users', { method: 'DELETE', body: JSON.stringify({ uid }) });
            toast.success('User deleted');
            fetchUsers();
        } catch (err) { toast.error(err.message); }
    };

    if (loading) return <PageLoader />;

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

    return (
        <div>
            <div className="page-title-row">
                <h2 className="page-title">User Management</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <HiOutlinePlus /> {showForm ? 'Cancel' : 'Add User'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="form-card glass-panel mb-6">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Name *</label>
                            <input value={form.name} onChange={set('name')} required placeholder="Full name" />
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input type="email" value={form.email} onChange={set('email')} required placeholder="email@example.com" />
                        </div>
                        <div className="form-group">
                            <label>Password *</label>
                            <input type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="Min 6 chars" />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select value={form.role} onChange={set('role')}>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <select value={form.location} onChange={set('location')}>
                                <option value="">Select Location</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            )}

            <div className="glass-panel">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Location</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.uid}>
                                    <td data-label="Name" className="font-medium">{u.name}</td>
                                    <td data-label="Email" className="text-muted">{u.email}</td>
                                    <td data-label="Role">
                                        <select
                                            className="inline-select"
                                            value={u.role}
                                            onChange={e => handleRoleChange(u.uid, e.target.value)}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </td>
                                    <td data-label="Location">
                                        <select
                                            className="inline-select"
                                            value={u.location || ''}
                                            onChange={e => handleLocationChange(u.uid, e.target.value)}
                                        >
                                            <option value="">No Location</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td data-label="Actions">
                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(u.uid)} title="Delete user">
                                            <HiOutlineTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
