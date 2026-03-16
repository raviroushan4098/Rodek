import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import { HiOutlinePlus } from 'react-icons/hi2';

export default function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/customers').then(setCustomers).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

    const trustColor = (score) => score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'rose';

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Customers</h2>
                    <p className="page-subtitle">{customers.length} registered clients</p>
                </div>
                <Link to="/customers/new" className="btn btn-primary"><HiOutlinePlus /> Add Customer</Link>
            </div>

            <div className="glass-panel">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Aadhar</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Trust Score</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c => (
                                <tr key={c.id}>
                                    <td data-label="Name">
                                        <div className="flex-center gap-3">
                                            <div className="avatar-sm">{c.name?.[0] || '?'}</div>
                                            <span className="font-medium">{c.name}</span>
                                        </div>
                                    </td>
                                    <td data-label="Aadhar" className="text-muted">{c.aadharNumber || '—'}</td>
                                    <td data-label="Phone" className="text-muted">{c.phone}</td>
                                    <td data-label="Email" className="text-muted">{c.email || '—'}</td>
                                    <td data-label="Trust Score">
                                        <span className={`badge badge-${trustColor(c.trustScore || 70)}`}>
                                            {c.trustScore || 70}
                                        </span>
                                    </td>
                                    <td data-label="Actions">
                                        <Link to={`/customers/${c.id}`} className="link-accent">View</Link>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr><td colSpan="6" className="text-center text-muted py-6">No customers yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
