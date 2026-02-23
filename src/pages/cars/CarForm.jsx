import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';

export default function CarForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState([]);
    const [form, setForm] = useState({
        make: '', model: '', year: new Date().getFullYear(), plateNumber: '', category: 'sedan',
        status: 'available', dailyRate: '', imageUrl: '', location: '', transmission: 'manual',
        fuelType: 'petrol', mileage: '',
    });

    useEffect(() => {
        apiFetch('/api/locations').then(setLocations).catch(() => { });
        if (isEdit) {
            apiFetch(`/api/cars/${id}`).then(car => {
                setForm({
                    make: car.make || '', model: car.model || '', year: car.year || '',
                    plateNumber: car.plateNumber || '', category: car.category || 'sedan',
                    status: car.status || 'available', dailyRate: car.dailyRate || '',
                    imageUrl: car.imageUrl || '', location: car.location || '',
                    transmission: car.transmission || 'manual', fuelType: car.fuelType || 'petrol',
                    mileage: car.mileage || '',
                });
            }).catch(() => toast.error('Failed to load car'));
        }
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await apiFetch(`/api/cars/${id}`, { method: 'PUT', body: JSON.stringify(form) });
                toast.success('Car updated!');
            } else {
                await apiFetch('/api/cars', { method: 'POST', body: JSON.stringify(form) });
                toast.success('Car added!');
            }
            navigate('/cars');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

    return (
        <div>
            <h2 className="page-title">{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <form onSubmit={handleSubmit} className="form-card glass-panel">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Make *</label>
                        <input value={form.make} onChange={set('make')} placeholder="Toyota" required />
                    </div>
                    <div className="form-group">
                        <label>Model *</label>
                        <input value={form.model} onChange={set('model')} placeholder="Camry" required />
                    </div>
                    <div className="form-group">
                        <label>Year</label>
                        <input type="number" value={form.year} onChange={set('year')} />
                    </div>
                    <div className="form-group">
                        <label>Plate Number *</label>
                        <input value={form.plateNumber} onChange={set('plateNumber')} placeholder="MH 01 AB 1234" required />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={form.category} onChange={set('category')}>
                            <option value="sedan">Sedan</option>
                            <option value="suv">SUV</option>
                            <option value="hatchback">Hatchback</option>
                            <option value="luxury">Luxury</option>
                            <option value="van">Van</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select value={form.status} onChange={set('status')}>
                            <option value="available">Available</option>
                            <option value="rented">Rented</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Daily Rate (₹)</label>
                        <input type="number" value={form.dailyRate} onChange={set('dailyRate')} placeholder="1500" />
                    </div>
                    <div className="form-group">
                        <label>Location *</label>
                        <select value={form.location} onChange={set('location')} required>
                            <option value="">Select Location</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Transmission</label>
                        <select value={form.transmission} onChange={set('transmission')}>
                            <option value="manual">Manual</option>
                            <option value="automatic">Automatic</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Fuel Type</label>
                        <select value={form.fuelType} onChange={set('fuelType')}>
                            <option value="petrol">Petrol</option>
                            <option value="diesel">Diesel</option>
                            <option value="electric">Electric</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="cng">CNG</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Mileage (km)</label>
                        <input type="number" value={form.mileage} onChange={set('mileage')} placeholder="0" />
                    </div>
                    <div className="form-group form-group-full">
                        <label>Vehicle Image</label>
                        <ImageUpload
                            value={form.imageUrl}
                            onChange={(url) => setForm(f => ({ ...f, imageUrl: url }))}
                            folder="cars"
                        />
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/cars')}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Add Vehicle'}
                    </button>
                </div>
            </form>
        </div>
    );
}
