import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../contexts/AuthContext';
import { HiOutlineWallet, HiOutlineKey, HiOutlineSquares2X2, HiOutlineUserPlus, HiOutlineTruck, HiOutlineWrenchScrewdriver, HiOutlinePlus } from 'react-icons/hi2';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/dashboard')
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

    const stats = [
        { label: 'Total Revenue', value: `₹${(data?.totalRevenue || 0).toLocaleString('en-IN')}`, sub: 'Validated Payments', icon: HiOutlineWallet, color: 'amber' },
        { label: 'Active Rentals', value: data?.activeRentals || 0, sub: 'On the road', icon: HiOutlineKey, color: 'blue' },
        { label: 'Total Fleet', value: data?.totalCars || 0, sub: `${data?.carsInMaintenance || 0} in maintenance`, icon: HiOutlineSquares2X2, color: 'purple' },
        { label: 'New Clients', value: data?.newClients || 0, sub: 'This month', icon: HiOutlineUserPlus, color: 'rose' },
    ];

    const formatDate = (d) => {
        if (!d) return '';
        const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="page-dashboard">
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Executive Dashboard</h2>
                    <p className="page-subtitle">Real-time fleet performance and insights</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map(s => (
                    <div key={s.label} className={`stat-card stat-${s.color}`}>
                        <div className="stat-glow" />
                        <div className="stat-body">
                            <div>
                                <p className="stat-label">{s.label}</p>
                                <h3 className="stat-value">{s.value}</h3>
                                <p className={`stat-sub text-${s.color}`}>{s.sub}</p>
                            </div>
                            <div className={`stat-icon-wrap bg-${s.color}`}>
                                <s.icon />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Section */}
            <div className="dashboard-grid">
                {/* Recent Bookings */}
                <div className="glass-panel card-lg">
                    <div className="card-header">
                        <h3>Recent Reservations</h3>
                        <Link to="/bookings" className="link-accent">View All</Link>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Vehicle</th>
                                    <th>Dates</th>
                                    <th className="text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.recentBookings?.length > 0 ? data.recentBookings.map(b => (
                                    <tr key={b.id}>
                                        <td>
                                            <div className="flex-center gap-3">
                                                <div className="avatar-sm">{b.customer?.name?.[0] || '?'}</div>
                                                <span>{b.customer?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="text-muted">{b.car ? `${b.car.make} ${b.car.model}` : '—'}</td>
                                        <td className="text-muted text-sm">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td>
                                        <td className="text-right">
                                            <span className={`badge badge-${b.status}`}>{b.status}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="text-center text-muted py-6">No recent activity.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="dashboard-side">
                    {/* Quick Action */}
                    <div className="action-card">
                        <div className="action-bg-icon"><HiOutlineTruck /></div>
                        <div className="action-content">
                            <h3>Deploy New Vehicle</h3>
                            <p>Add a new car to your premium fleet inventory.</p>
                            <Link to="/cars/new" className="btn btn-white">
                                <HiOutlinePlus /> Add Vehicle
                            </Link>
                        </div>
                    </div>

                    {/* Maintenance */}
                    <div className="glass-panel">
                        <h3 className="card-title">Maintenance Alert</h3>
                        <div className="maintenance-list">
                            {data?.maintenanceCars?.length > 0 ? data.maintenanceCars.map(c => (
                                <div key={c.id} className="maintenance-item">
                                    <div className="maint-icon"><HiOutlineWrenchScrewdriver /></div>
                                    <div>
                                        <h4>{c.make} {c.model}</h4>
                                        <p>{c.plateNumber} • Unavailable</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted text-sm text-center italic">No vehicles in maintenance.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
