import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';

export default function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch(`/api/customers/${id}`).then(setCustomer).catch(() => toast.error('Customer not found')).finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Delete this customer?')) return;
        try {
            await apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
            toast.success('Customer deleted');
            navigate('/customers');
        } catch (err) { toast.error(err.message); }
    };

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
    if (!customer) return <div className="empty-state"><p>Customer not found.</p></div>;

    const a = customer.analytics || {};
    const trustColor = (a.calculatedTrustScore || 70) >= 80 ? 'emerald' : (a.calculatedTrustScore || 70) >= 50 ? 'amber' : 'rose';

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">{customer.name}</h2>
                    <p className="page-subtitle">{customer.phone} {customer.email ? `• ${customer.email}` : ''}</p>
                </div>
                <div className="btn-group">
                    <Link to={`/customers/${id}/edit`} className="btn btn-secondary"><HiOutlinePencil /> Edit</Link>
                    <button className="btn btn-danger" onClick={handleDelete}><HiOutlineTrash /> Delete</button>
                </div>
            </div>

            <div className="detail-grid detail-grid-2">
                {/* Info */}
                <div className="glass-panel">
                    <h3 className="card-title">Customer Info</h3>
                    <div className="detail-fields">
                        <div className="detail-field"><span className="field-label">License</span><span>{customer.licenseNumber || '—'}</span></div>
                        <div className="detail-field"><span className="field-label">Address</span><span>{customer.address || '—'}</span></div>
                    </div>
                </div>

                {/* 360 Analytics */}
                <div className="glass-panel">
                    <h3 className="card-title">Customer 360 Intelligence</h3>
                    <div className="analytics-grid">
                        <div className="analytics-item">
                            <p className="analytics-label">Trust Score</p>
                            <div className="trust-score-wrap">
                                <div className={`trust-score-circle trust-${trustColor}`}>
                                    <span>{Math.round(a.calculatedTrustScore || 70)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="analytics-item">
                            <p className="analytics-label">Total Rentals</p>
                            <p className="analytics-value">{a.totalRentals || 0}</p>
                        </div>
                        <div className="analytics-item">
                            <p className="analytics-label">Lifetime Value</p>
                            <p className="analytics-value">₹{(a.lifetimeValue || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="analytics-item">
                            <p className="analytics-label">Avg. Duration</p>
                            <p className="analytics-value">{a.averageRentalDuration || 0} days</p>
                        </div>
                        <div className="analytics-item">
                            <p className="analytics-label">Late Returns</p>
                            <p className="analytics-value text-rose">{a.lateReturns || 0}</p>
                        </div>
                        <div className="analytics-item">
                            <p className="analytics-label">Damage Incidents</p>
                            <p className="analytics-value text-rose">{a.damageIncidents || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
