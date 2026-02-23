import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiMapPin } from 'react-icons/fi';

export default function Locations() {
    const { userProfile } = useAuth();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);

    const load = () => {
        apiFetch('/api/locations')
            .then(setLocations)
            .catch(() => toast.error('Failed to load locations'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setAdding(true);
        try {
            await apiFetch('/api/locations', {
                method: 'POST',
                body: JSON.stringify({ name: newName.trim() }),
            });
            toast.success(`Location "${newName.trim()}" added!`);
            setNewName('');
            load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (loc) => {
        if (!confirm(`Delete location "${loc.name}"?`)) return;
        try {
            await apiFetch('/api/locations', {
                method: 'DELETE',
                body: JSON.stringify({ id: loc.id }),
            });
            toast.success('Location deleted');
            load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /><p>Loading locations...</p></div>;

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Manage Locations</h2>
                    <p className="page-subtitle">Add or remove rental locations</p>
                </div>
            </div>

            {/* Add new location */}
            <form onSubmit={handleAdd} className="glass-panel" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title">Add New Location</h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Location Name</label>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Mumbai, Delhi, Bangalore..."
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={adding} style={{ height: 'fit-content' }}>
                        <FiPlus /> {adding ? 'Adding...' : 'Add Location'}
                    </button>
                </div>
            </form>

            {/* Location list */}
            <div className="glass-panel">
                <h3 className="card-title">All Locations ({locations.length})</h3>
                {locations.length === 0 ? (
                    <div className="empty-state">
                        <p>No locations yet. Add your first location above.</p>
                    </div>
                ) : (
                    <div className="locations-grid">
                        {locations.map((loc) => (
                            <div key={loc.id} className="location-item">
                                <div className="location-info">
                                    <FiMapPin className="text-amber" />
                                    <span>{loc.name}</span>
                                </div>
                                <button
                                    className="btn-icon btn-icon-danger"
                                    onClick={() => handleDelete(loc)}
                                    title="Delete location"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
