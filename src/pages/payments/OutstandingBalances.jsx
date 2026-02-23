import { useState, useEffect } from 'react';
import { apiFetch } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineChatBubbleOvalLeftEllipsis, HiOutlineBanknotes, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineReceiptRefund } from 'react-icons/hi2';

export default function OutstandingBalances() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState(new Set());

    useEffect(() => {
        apiFetch('/api/payments/outstanding')
            .then(setAccounts)
            .catch(err => {
                console.error(err);
                toast.error('Failed to load outstanding accounts');
            })
            .finally(() => setLoading(false));
    }, []);

    const toggleExpand = (customerId) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(customerId)) next.delete(customerId);
            else next.add(customerId);
            return next;
        });
    };

    const handleSendReminder = (customer, amt) => {
        const text = encodeURIComponent(`Hello ${customer.name}, you have an outstanding balance of ₹${amt.toLocaleString('en-IN')} for your car rental. Please arrange for payment at your earliest convenience.`);
        window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    };

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

    const totalNetworkDebt = accounts.reduce((sum, a) => sum + a.totalOutstanding, 0);

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Accounts Receivable</h2>
                    <p className="page-subtitle">{accounts.length} customers with outstanding balances</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p className="text-muted text-sm">Total Network Debt</p>
                    <h3 className="font-bold text-rose" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                        ₹{totalNetworkDebt.toLocaleString('en-IN')}
                    </h3>
                </div>
            </div>

            {accounts.length === 0 ? (
                <div className="empty-state">
                    <p>All accounts are settled! There are no outstanding balances.</p>
                    <Link to="/payments" className="btn btn-primary mt-4">Back to Payments</Link>
                </div>
            ) : (
                <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {accounts.map(acc => {
                        const isExpanded = expandedIds.has(acc.customer.id);

                        return (
                            <div key={acc.customer.id} className="glass-panel outstanding-card" style={{ padding: '1.5rem' }}>
                                {/* Header / Summary */}
                                <div className="outstanding-card-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>

                                    {/* Profile */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="avatar-sm" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                            {acc.customer.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <Link to={`/customers/${acc.customer.id}`} className="font-bold hover:text-amber" style={{ fontSize: '1.1rem' }}>
                                                {acc.customer.name}
                                            </Link>
                                            <p className="text-muted text-sm">{acc.customer.phone} • Trust: {acc.customer.trustScore}</p>
                                        </div>
                                    </div>

                                    {/* Action & Debt */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p className="text-muted text-sm">Total Owed</p>
                                            <p className="font-bold text-rose" style={{ fontSize: '1.25rem' }}>
                                                ₹{acc.totalOutstanding.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="btn-group">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleSendReminder(acc.customer, acc.totalOutstanding)}
                                                title="WhatsApp Reminder"
                                            >
                                                <HiOutlineChatBubbleOvalLeftEllipsis size={18} />
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm flex-center gap-2"
                                                onClick={() => navigate(`/payments/new?customerId=${acc.customer.id}&amount=${acc.totalOutstanding}`)}
                                            >
                                                <HiOutlineBanknotes /> Settle
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => toggleExpand(acc.customer.id)}
                                            >
                                                {isExpanded ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded History Details */}
                                {isExpanded && (
                                    <div className="outstanding-history" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                        <h4 className="font-medium mb-3">Debt Origin History</h4>
                                        <div className="table-wrap">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Booking Ref</th>
                                                        <th>Vehicle</th>
                                                        <th>Dates</th>
                                                        <th style={{ textAlign: 'right' }}>Booking Total</th>
                                                        <th style={{ textAlign: 'right' }}>Amount Paid</th>
                                                        <th style={{ textAlign: 'right' }}>Debt Pending</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {acc.unpaidBookings.map(ub => {
                                                        const b = ub.booking;
                                                        const d1 = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                                                        const d2 = new Date(b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate);
                                                        const dateStr = `${d1.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${d2.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;

                                                        return (
                                                            <tr key={b.id}>
                                                                <td data-label="Ref">
                                                                    <Link to={`/bookings/${b.id}`} className="link-accent">{b.id.slice(0, 6).toUpperCase()}</Link>
                                                                </td>
                                                                <td data-label="Vehicle" className="text-muted">{b.car ? `${b.car.make} ${b.car.model}` : '—'}</td>
                                                                <td data-label="Dates" className="text-muted">{dateStr}</td>
                                                                <td data-label="Total" className="font-medium" style={{ textAlign: 'right' }}>₹{ub.totalCost.toLocaleString('en-IN')}</td>
                                                                <td data-label="Paid" className="text-emerald" style={{ textAlign: 'right' }}>₹{ub.totalPaid.toLocaleString('en-IN')}</td>
                                                                <td data-label="Pending" className="text-rose font-bold" style={{ textAlign: 'right' }}>₹{ub.debt.toLocaleString('en-IN')}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Partial Payments Log indicator */}
                                        <div className="mt-4 text-xs text-muted flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                                            <HiOutlineReceiptRefund /> *Amount Paid includes partial deposits and mid-rental installments via Cash/UPI.
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
