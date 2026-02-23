import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CustomerForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', licenseNumber: '', address: '', trustScore: 70,
    });

    useEffect(() => {
        if (isEdit) {
            apiFetch(`/api/customers/${id}`).then(c => {
                setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', licenseNumber: c.licenseNumber || '', address: c.address || '', trustScore: c.trustScore || 70 });
            }).catch(() => toast.error('Failed to load customer'));
        }
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await apiFetch(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(form) });
                toast.success('Customer updated!');
            } else {
                await apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(form) });
                toast.success('Customer added!');
            }
            navigate('/customers');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

    return (
        <div>
            <h2 className="page-title">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSubmit} className="form-card glass-panel">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Name *</label>
                        <input value={form.name} onChange={set('name')} placeholder="John Doe" required />
                    </div>
                    <div className="form-group">
                        <label>Phone *</label>
                        <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                        <label>License Number</label>
                        <input value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="DL-12345" />
                    </div>
                    <div className="form-group form-group-full">
                        <label>Address</label>
                        <textarea value={form.address} onChange={set('address')} placeholder="Full address" rows={3} />
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/customers')}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
