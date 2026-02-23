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
                            <div key={acc.customer.id} className="glass-panel outstanding-card" style={{ padding: '0' }}>
                                {/* Header / Summary */}
                                <div className="outstanding-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'background 0.2s ease', borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.05)' : 'none' }} onClick={() => toggleExpand(acc.customer.id)}>

                                    {/* Profile Group */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.05))',
                                            border: '1px solid rgba(var(--primary-rgb), 0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--primary)', fontWeight: '600', fontSize: '1.2rem',
                                            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.1)'
                                        }}>
                                            {acc.customer.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <Link to={`/customers/${acc.customer.id}`} className="font-bold hover:text-amber" style={{ fontSize: '1.15rem', color: 'var(--text-main)' }} onClick={(e) => e.stopPropagation()}>
                                                {acc.customer.name}
                                            </Link>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                                                <span className="text-muted">{acc.customer.phone}</span>
                                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }} />
                                                <span className="text-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    Trust Score: <span className="font-bold">{acc.customer.trustScore}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial & Action Group */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                            <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Balance Due</span>
                                            <span className="font-bold text-rose" style={{ fontSize: '1.4rem', textShadow: '0 0 16px rgba(244, 63, 94, 0.2)' }}>
                                                ₹{acc.totalOutstanding.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        <div className="btn-group" style={{ gap: '0.5rem' }}>
                                            <button
                                                className="icon-btn-glow"
                                                onClick={(e) => { e.stopPropagation(); handleSendReminder(acc.customer, acc.totalOutstanding); }}
                                                title="Send WhatsApp Reminder"
                                                style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                onMouseOver={(e) => { e.currentTarget.style.color = '#25D366'; e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                            >
                                                <HiOutlineChatBubbleOvalLeftEllipsis size={22} />
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                onClick={(e) => { e.stopPropagation(); navigate(`/payments/new?customerId=${acc.customer.id}&amount=${acc.totalOutstanding}`); }}
                                            >
                                                <HiOutlineBanknotes size={18} /> Settle
                                            </button>
                                            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                                                {isExpanded ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded History Details */}
                                {isExpanded && (
                                    <div className="outstanding-history" style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)' }}>
                                        <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '1.25rem', marginTop: '1.5rem' }}>
                                            <h4 className="text-muted text-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Debt Origin Trajectory</h4>
                                            <div className="table-wrap" style={{
                                                background: 'var(--bg-card)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                overflow: 'hidden'
                                            }}>
                                                <table style={{ margin: 0 }}>
                                                    <thead>
                                                        <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                                                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Booking Ref</th>
                                                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehicle</th>
                                                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dates</th>
                                                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Booking Total</th>
                                                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Amount Paid</th>
                                                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Debt Pending</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {acc.unpaidBookings.map((ub, idx) => {
                                                            const b = ub.booking;
                                                            const d1 = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                                                            const d2 = new Date(b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate);
                                                            const dateStr = `${d1.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${d2.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
                                                            const isLast = idx === acc.unpaidBookings.length - 1;

                                                            return (
                                                                <tr key={b.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', background: 'transparent' }}>
                                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                                        <Link to={`/bookings/${b.id}`} className="link-accent font-mono text-sm">{b.id.slice(0, 6).toUpperCase()}</Link>
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem 1rem' }} className="text-sm font-medium">{b.car ? `${b.car.make} ${b.car.model}` : '—'}</td>
                                                                    <td style={{ padding: '0.75rem 1rem' }} className="text-muted text-sm">{dateStr}</td>
                                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }} className="text-sm">₹{ub.totalCost.toLocaleString('en-IN')}</td>
                                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }} className="text-emerald text-sm">₹{ub.totalPaid.toLocaleString('en-IN')}</td>
                                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }} className="text-rose font-bold text-sm">₹{ub.debt.toLocaleString('en-IN')}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Partial Payments Log indicator */}
                                            <div className="mt-3 text-xs text-muted flex-center gap-1" style={{ justifyContent: 'flex-start', opacity: 0.8 }}>
                                                <HiOutlineReceiptRefund size={14} /> *Amount Paid aggregates advance deposits plus mid-rental installments via specific Payment receipts.
                                            </div>
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
