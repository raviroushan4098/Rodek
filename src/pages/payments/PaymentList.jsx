import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import { HiOutlinePlus, HiOutlineBanknotes, HiOutlineCreditCard, HiOutlineDevicePhoneMobile, HiOutlineBuildingLibrary, HiOutlineDocumentText, HiOutlineArrowTrendingUp, HiOutlineFunnel, HiOutlineChevronRight } from 'react-icons/hi2';

export default function PaymentList() {
    const [payments, setPayments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        Promise.all([apiFetch('/api/payments'), apiFetch('/api/bookings')])
            .then(([p, b]) => { setPayments(p); setBookings(b); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (d) => {
        if (!d) return '—';
        const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (d) => {
        if (!d) return '';
        const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

    const bookingMap = useMemo(() => {
        const map = {};
        bookings.forEach(b => { map[b.id] = b; });
        return map;
    }, [bookings]);

    const enrichedPayments = useMemo(() => {
        return payments.map(p => ({ ...p, booking: bookingMap[p.bookingId] || null }));
    }, [payments, bookingMap]);

    const filteredPayments = useMemo(() => {
        if (filter === 'all') return enrichedPayments;
        return enrichedPayments.filter(p => p.method === filter);
    }, [enrichedPayments, filter]);

    // Stats
    const stats = useMemo(() => {
        const total = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const methods = {};
        payments.forEach(p => {
            const m = p.method || 'cash';
            methods[m] = (methods[m] || 0) + (Number(p.amount) || 0);
        });
        // Today's collection
        const today = new Date().toDateString();
        const todayTotal = payments
            .filter(p => {
                const d = p.paymentDate?._seconds ? new Date(p.paymentDate._seconds * 1000) : new Date(p.paymentDate);
                return d.toDateString() === today;
            })
            .reduce((s, p) => s + (Number(p.amount) || 0), 0);

        // Outstanding balance across all bookings
        const totalBookingCost = bookings.reduce((s, b) => s + (Number(b.totalCost) || 0), 0);
        const totalAdvance = bookings.reduce((s, b) => s + (Number(b.advancePayment) || 0), 0);
        const outstanding = Math.max(0, totalBookingCost - totalAdvance - total);

        return { total, count: payments.length, methods, todayTotal, outstanding };
    }, [payments, bookings]);

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

    const methodConfig = {
        cash: { icon: <HiOutlineBanknotes />, label: 'Cash', color: 'emerald' },
        upi: { icon: <HiOutlineDevicePhoneMobile />, label: 'UPI', color: 'blue' },
        bank_transfer: { icon: <HiOutlineBuildingLibrary />, label: 'Bank Transfer', color: 'purple' },
        card: { icon: <HiOutlineCreditCard />, label: 'Card', color: 'amber' },
        cheque: { icon: <HiOutlineDocumentText />, label: 'Cheque', color: 'rose' },
    };

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Payments</h2>
                    <p className="page-subtitle">{stats.count} transactions tracked</p>
                </div>
                <Link to="/payments/new" className="btn btn-primary"><HiOutlinePlus /> Record Payment</Link>
            </div>

            {/* Hero Stats */}
            <div className="payment-stats-hero">
                <div className="hero-stat hero-stat-primary">
                    <div className="hero-stat-icon"><HiOutlineBanknotes /></div>
                    <div className="hero-stat-content">
                        <span className="hero-stat-label">Total Revenue</span>
                        <span className="hero-stat-value">{fmt(stats.total)}</span>
                    </div>
                    <div className="hero-stat-badge">{stats.count} txns</div>
                </div>
                <div className="hero-stat hero-stat-success">
                    <div className="hero-stat-icon"><HiOutlineArrowTrendingUp /></div>
                    <div className="hero-stat-content">
                        <span className="hero-stat-label">Today's Collection</span>
                        <span className="hero-stat-value">{fmt(stats.todayTotal)}</span>
                    </div>
                </div>
                <Link to="/payments/outstanding" className="hero-stat hero-stat-warning" style={{ textDecoration: 'none', cursor: 'pointer', position: 'relative' }}>
                    <div className="hero-stat-icon"><HiOutlineFunnel /></div>
                    <div className="hero-stat-content">
                        <span className="hero-stat-label">Outstanding</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="hero-stat-value">{fmt(stats.outstanding)}</span>
                            <HiOutlineChevronRight className="text-amber" size={20} />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Method Breakdown Cards */}
            {Object.keys(stats.methods).length > 0 && (
                <div className="method-breakdown">
                    {Object.entries(stats.methods).map(([method, amount]) => {
                        const config = methodConfig[method] || methodConfig.cash;
                        const percent = stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0;
                        return (
                            <div key={method} className={`method-card method-card-${config.color}`} onClick={() => setFilter(filter === method ? 'all' : method)}>
                                <div className="method-card-top">
                                    <div className="method-card-icon">{config.icon}</div>
                                    <span className="method-card-pct">{percent}%</span>
                                </div>
                                <span className="method-card-amount">{fmt(amount)}</span>
                                <span className="method-card-label">{config.label}</span>
                                <div className="method-card-bar">
                                    <div className="method-card-bar-fill" style={{ width: `${percent}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filter Pills */}
            <div className="payment-filters">
                <button
                    className={`filter-pill ${filter === 'all' ? 'filter-active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({stats.count})
                </button>
                {Object.keys(methodConfig).map(m => {
                    const count = enrichedPayments.filter(p => p.method === m).length;
                    if (count === 0 && !stats.methods[m]) return null;
                    const config = methodConfig[m];
                    return (
                        <button
                            key={m}
                            className={`filter-pill ${filter === m ? 'filter-active' : ''}`}
                            onClick={() => setFilter(filter === m ? 'all' : m)}
                        >
                            {config.icon} {config.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Transactions Table */}
            <div className="glass-panel">
                <div className="table-header-row">
                    <h3 className="card-title">Recent Transactions</h3>
                    <span className="text-muted text-sm">{filteredPayments.length} results</span>
                </div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Vehicle</th>
                                <th>Method</th>
                                <th>Reference</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(p => {
                                const config = methodConfig[p.method] || methodConfig.cash;
                                return (
                                    <tr key={p.id}>
                                        <td data-label="Date">
                                            <div className="date-cell">
                                                <span>{formatDate(p.paymentDate)}</span>
                                                <span className="text-muted text-xs">{formatTime(p.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td data-label="Customer" className="font-medium">{p.booking?.customer?.name || '—'}</td>
                                        <td data-label="Vehicle" className="text-muted">
                                            {p.booking?.car ? `${p.booking.car.make} ${p.booking.car.model}` : '—'}
                                        </td>
                                        <td data-label="Method">
                                            <span className={`method-badge method-badge-${config.color}`}>
                                                {config.icon} {config.label}
                                            </span>
                                        </td>
                                        <td data-label="Reference" className="text-muted font-mono text-sm">{p.transactionReference || '—'}</td>
                                        <td data-label="Amount" className="font-bold text-emerald" style={{ textAlign: 'right', fontSize: '1rem' }}>
                                            {fmt(p.amount)}
                                        </td>
                                        <td data-label="Actions">
                                            {p.bookingId && (
                                                <Link to={`/bookings/${p.bookingId}`} className="link-accent text-sm">
                                                    View →
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-table-state">
                                            <HiOutlineBanknotes className="empty-table-icon" />
                                            <p>No transactions found</p>
                                            <Link to="/payments/new" className="btn btn-primary btn-sm">Record First Payment</Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
