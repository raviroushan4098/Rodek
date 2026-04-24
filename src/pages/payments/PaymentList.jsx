import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import { HiOutlinePlus, HiOutlineBanknotes, HiOutlineArrowTrendingUp, HiOutlineFunnel, HiOutlineChevronRight, HiOutlineCreditCard, HiOutlineDevicePhoneMobile, HiOutlineBuildingLibrary, HiOutlineDocumentText } from 'react-icons/hi2';
import DateRangeFilter from '../../components/DateRangeFilter';
import PageLoader from '../../components/PageLoader';

export default function PaymentList() {
    const [payments, setPayments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [dateRange, setDateRange] = useState(null);

    const [outstandingData, setOutstandingData] = useState([]);

    useEffect(() => {
        Promise.all([
            apiFetch('/api/payments'),
            apiFetch('/api/bookings'),
            apiFetch('/api/payments/outstanding')
        ])
            .then(([p, b, o]) => {
                setPayments(p);
                setBookings(b);
                setOutstandingData(o);
            })
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
        let result = enrichedPayments;

        // Apply Date Range Filter (Defaults to Current Month via component mount)
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            const sDate = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
            const eDate = new Date(dateRange.endDate).setHours(23, 59, 59, 999);

            result = result.filter(p => {
                const pDateStr = p.createdAt?._seconds ? p.createdAt._seconds * 1000 : p.createdAt;
                if (!pDateStr) return true;
                const pDate = new Date(pDateStr).getTime();
                return pDate >= sDate && pDate <= eDate;
            });
        }

        // Apply Payment Method type filter
        if (filter !== 'all') {
            result = result.filter(p => p.method === filter);
        }

        return result;
    }, [enrichedPayments, filter, dateRange]);

    // Stats (Calculated from the date-filtered slice)
    const stats = useMemo(() => {
        const sourceForStats = filteredPayments;
        const total = sourceForStats.reduce((s, p) => s + (Number(p.amount) || 0), 0);

        const methods = {};
        sourceForStats.forEach(p => {
            const m = p.method || 'cash';
            methods[m] = (methods[m] || 0) + (Number(p.amount) || 0);
        });

        // Today's total stays fixed to literal "today" regardless of the month filter
        const today = new Date().toDateString();
        const todayTotal = payments
            .filter(p => {
                const d = p.paymentDate?._seconds ? new Date(p.paymentDate._seconds * 1000) : new Date(p.paymentDate);
                return d.toDateString() === today;
            })
            .reduce((s, p) => s + (Number(p.amount) || 0), 0);

        // Calculate synchronized outstanding debt from the verified backend API, constrained by active Date Filter
        let totalNetworkDebt = 0;
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            const sDate = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
            const eDate = new Date(dateRange.endDate).setHours(23, 59, 59, 999);

            outstandingData.forEach(acc => {
                acc.unpaidBookings?.forEach(ub => {
                    const b = ub.booking;
                    if (!b) return;

                    const bStart = b.startDate?._seconds ? b.startDate._seconds * 1000 : new Date(b.startDate).getTime();
                    const bEnd = b.endDate?._seconds ? b.endDate._seconds * 1000 : new Date(b.endDate).getTime();

                    // If the booking overlaps with the selected date range, add its debt
                    if (!bStart || !bEnd || (bStart <= eDate && bEnd >= sDate)) {
                        totalNetworkDebt += (Number(ub.debt) || 0);
                    }
                });
            });
        } else {
            // Unfiltered state: sum all debts normally
            totalNetworkDebt = outstandingData.reduce((s, acc) => s + (Number(acc.totalOutstanding) || 0), 0);
        }

        return { total, count: sourceForStats.length, methods, todayTotal, outstanding: totalNetworkDebt };
    }, [filteredPayments, payments, outstandingData, dateRange]);

    if (loading) return <PageLoader />;

    const methodConfig = {
        cash: { icon: <HiOutlineBanknotes />, label: 'Cash', color: 'emerald' },
        upi: { icon: <HiOutlineDevicePhoneMobile />, label: 'UPI', color: 'blue' },
        bank_transfer: { icon: <HiOutlineBuildingLibrary />, label: 'Bank Transfer', color: 'purple' },
        card: { icon: <HiOutlineCreditCard />, label: 'Card', color: 'amber' },
        cheque: { icon: <HiOutlineDocumentText />, label: 'Cheque', color: 'rose' },
    };

    return (
        <div>
            <div className="page-title-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 className="page-title">Payments</h2>
                    <p className="page-subtitle">{stats.count} transactions in selected period</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateRangeFilter onFilterChange={(range) => setDateRange(range)} />
                    <Link to="/payments/new" className="btn btn-primary"><HiOutlinePlus /> Record Payment</Link>
                </div>
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
