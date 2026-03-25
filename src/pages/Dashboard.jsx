import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../contexts/AuthContext';
import { 
    HiOutlineWallet, 
    HiOutlineKey, 
    HiOutlineSquares2X2, 
    HiOutlineUserPlus, 
    HiOutlineTruck, 
    HiOutlineWrenchScrewdriver, 
    HiOutlinePlus 
} from 'react-icons/hi2';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    }
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/dashboard')
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}
            />
        </div>
    );

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
        <motion.div 
            className="page-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="page-title-row">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="page-title">Executive Dashboard</h2>
                    <p className="page-subtitle">Real-time fleet performance and insights</p>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <motion.div 
                className="stats-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {stats.map(s => (
                    <motion.div key={s.label} className={`stat-card stat-${s.color} glass-card`} variants={cardVariants}>
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
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Section */}
            <div className="dashboard-grid">
                {/* Recent Bookings */}
                <motion.div 
                    className="glass-panel card-lg glass-card"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
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
                                <AnimatePresence>
                                    {data?.recentBookings?.length > 0 ? data.recentBookings.map((b, idx) => (
                                        <motion.tr 
                                            key={b.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + (idx * 0.05) }}
                                        >
                                            <td data-label="Client">
                                                <div className="flex-center gap-3">
                                                    <div className="avatar-sm">{b.customer?.name?.[0] || '?'}</div>
                                                    <span>{b.customer?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td data-label="Vehicle" className="text-muted">{b.car ? `${b.car.make} ${b.car.model}` : '—'}</td>
                                            <td data-label="Dates" className="text-muted text-sm">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td>
                                            <td data-label="Status" className="text-right">
                                                <span className={`badge badge-${b.status}`}>{b.status}</span>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <tr><td colSpan="4" className="text-center text-muted py-6">No recent activity.</td></tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Right sidebar */}
                <div className="dashboard-side">
                    {/* Quick Action */}
                    <motion.div 
                        className="action-card glass-glow"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="action-bg-icon"><HiOutlineTruck /></div>
                        <div className="action-content">
                            <h3>Deploy New Vehicle</h3>
                            <p>Add a new car to your premium fleet inventory.</p>
                            <Link to="/cars/new" className="btn btn-white">
                                <HiOutlinePlus /> Add Vehicle
                            </Link>
                        </div>
                    </motion.div>

                    {/* Maintenance */}
                    <motion.div 
                        className="glass-panel glass-card"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        <h3 className="card-title">Maintenance Alert</h3>
                        <div className="maintenance-list">
                            {data?.maintenanceCars?.length > 0 ? data.maintenanceCars.map((c, idx) => (
                                <motion.div 
                                    key={c.id} 
                                    className="maintenance-item"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 + (idx * 0.1) }}
                                >
                                    <div className="maint-icon"><HiOutlineWrenchScrewdriver /></div>
                                    <div>
                                        <h4>{c.make} {c.model}</h4>
                                        <p>{c.plateNumber} • Unavailable</p>
                                    </div>
                                </motion.div>
                            )) : (
                                <p className="text-muted text-sm text-center italic">No vehicles in maintenance.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
