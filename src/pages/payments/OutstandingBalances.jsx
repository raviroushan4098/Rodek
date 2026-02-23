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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', minWidth: 'min(100%, 260px)', flex: '1 1 300px' }}>
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                                            background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.05))',
                                            border: '1px solid rgba(var(--primary-rgb), 0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--primary)', fontWeight: '600', fontSize: '1.2rem',
                                            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.1)'
                                        }}>
                                            {acc.customer.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: 'calc(100% - 65px)' }}>
                                            <Link to={`/customers/${acc.customer.id}`} className="font-bold hover:text-amber" style={{ fontSize: '1.15rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={(e) => e.stopPropagation()}>
                                                {acc.customer.name}
                                            </Link>
                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <span className="text-muted" style={{ whiteSpace: 'nowrap' }}>{acc.customer.phone}</span>
                                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                                                <span className="text-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                                                    Trust Score: <span className="font-bold">{acc.customer.trustScore}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial & Action Group */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'flex-start', flex: '1 1 300px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flexGrow: 1, minWidth: '100px' }}>
                                            <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Balance Due</span>
                                            <span className="font-bold text-rose" style={{ fontSize: '1.4rem', textShadow: '0 0 16px rgba(244, 63, 94, 0.2)' }}>
                                                ₹{acc.totalOutstanding.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        <div className="btn-group" style={{ gap: '0.5rem', flexShrink: 0 }}>
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
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {/* Desktop Header Row */}
                                                <div className="debt-grid-header hide-on-mobile" style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'minmax(80px, 1fr) minmax(100px, 1.5fr) minmax(120px, 1.5fr) auto auto auto',
                                                    gap: '1rem',
                                                    padding: '0 1rem 0.5rem 1rem',
                                                    borderBottom: '1px solid var(--border)',
                                                    color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    <div>Ref</div>
                                                    <div>Vehicle</div>
                                                    <div>Dates</div>
                                                    <div style={{ textAlign: 'right' }}>Total</div>
                                                    <div style={{ textAlign: 'right' }}>Paid</div>
                                                    <div style={{ textAlign: 'right' }}>Pending</div>
                                                </div>

                                                {/* Debt Cards */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {acc.unpaidBookings.map((ub) => {
                                                        const b = ub.booking;
                                                        const d1 = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                                                        const d2 = new Date(b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate);
                                                        const dateStr = `${d1.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${d2.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;

                                                        return (
                                                            <div key={b.id} className="debt-grid-row" style={{
                                                                background: 'var(--bg-card)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: '8px',
                                                                padding: '1rem',
                                                                display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between'
                                                            }}>
                                                                {/* Reference & Vehicle Info */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '140px', flex: '1 1 auto' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <Link to={`/bookings/${b.id}`} className="link-accent font-mono font-bold" style={{ fontSize: '0.9rem' }}>{b.id.slice(0, 6).toUpperCase()}</Link>
                                                                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                                                            {b.car ? `${b.car.make} ${b.car.model}` : 'Generic'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>{dateStr}</span>
                                                                </div>

                                                                {/* Financial Metrics */}
                                                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                        <span className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Booking</span>
                                                                        <span className="font-medium">₹{ub.totalCost.toLocaleString('en-IN')}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                        <span className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Paid</span>
                                                                        <span className="text-emerald font-medium">₹{ub.totalPaid.toLocaleString('en-IN')}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                                                                        <span className="text-rose" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Pending</span>
                                                                        <span className="text-rose font-bold" style={{ fontSize: '1.1rem' }}>₹{ub.debt.toLocaleString('en-IN')}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
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
