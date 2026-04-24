import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch, useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
    HiOutlinePencil, 
    HiOutlineTrash, 
    HiOutlineGlobeAlt, 
    HiOutlineCreditCard, 
    HiOutlineBanknotes, 
    HiOutlineQrCode, 
    HiOutlineClock 
} from 'react-icons/hi2';
import PageLoader from '../../components/PageLoader';

export default function CustomerDetail() {
    const { user, isSuperAdmin } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch(`/api/customers/${id}`)
            .then(setCustomer)
            .catch((err) => {
                if (err.status === 403) {
                    toast.error('Access Denied: This customer profile is private');
                } else {
                    toast.error('Customer not found');
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Delete this customer?')) return;
        try {
            await apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
            toast.success('Customer deleted');
            navigate('/customers');
        } catch (err) { toast.error(err.message); }
    };

    if (loading) return <PageLoader />;
    if (!customer) return <div className="empty-state"><p>Customer not found.</p></div>;

    const a = customer.analytics || {};
    const trustColor = (a.calculatedTrustScore || 70) >= 80 ? 'emerald' : (a.calculatedTrustScore || 70) >= 50 ? 'amber' : 'rose';

    const getMethodIcon = (method) => {
        switch (method?.toLowerCase()) {
            case 'card': return <HiOutlineCreditCard />;
            case 'upi': return <HiOutlineQrCode />;
            default: return <HiOutlineBanknotes />;
        }
    };

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <div className="flex-center gap-3">
                        <h2 className="page-title">{customer.name}</h2>
                        {customer.userId !== user.uid && (
                            <span className="badge badge-global">
                                <HiOutlineGlobeAlt /> Global Registry
                            </span>
                        )}
                    </div>
                    <p className="page-subtitle">{customer.phone} {customer.email ? `• ${customer.email}` : ''}</p>
                </div>
                <div className="btn-group">
                    {(customer.userId === user.uid || isSuperAdmin) && (
                        <>
                            <Link to={`/customers/${id}/edit`} className="btn btn-secondary"><HiOutlinePencil /> Edit</Link>
                            <button className="btn btn-danger" onClick={handleDelete}><HiOutlineTrash /> Delete</button>
                        </>
                    )}
                </div>
            </div>

            {/* Financial Summary Grid */}
            <div className="financial-grid mt-4">
                <div className="glass-panel stat-card accent-purple">
                    <div className="label">Lifetime Value</div>
                    <div className="value">₹{(customer.financialSummary?.totalCost || 0).toLocaleString()}</div>
                </div>
                <div className="glass-panel stat-card accent-emerald">
                    <div className="label">Total Paid</div>
                    <div className="value">₹{(customer.financialSummary?.totalPaid || 0).toLocaleString()}</div>
                </div>
                <div className="glass-panel stat-card accent-amber">
                    <div className="label">Pending Dues</div>
                    <div className="value">₹{(customer.financialSummary?.pendingDues || 0).toLocaleString()}</div>
                </div>
            </div>

            <div className="grid-2 gap-4">
                {/* Left Column: Financial Activity */}
                <div className="glass-panel p-4">
                    <div className="flex-between mb-4">
                        <h3 className="section-title">Financial Activity</h3>
                        <span className="badge badge-secondary">{customer.payments?.length || 0} Transactions</span>
                    </div>

                    <div className="timeline-ledger">
                        {(customer.payments || []).length > 0 ? (
                            customer.payments.sort((a,b) => {
                                const aDate = new Date(a.paymentDate?._seconds ? a.paymentDate._seconds * 1000 : a.paymentDate);
                                const bDate = new Date(b.paymentDate?._seconds ? b.paymentDate._seconds * 1000 : b.paymentDate);
                                return bDate - aDate;
                            }).map((p, idx) => (
                                <div key={p.id || idx} className="timeline-item">
                                    <div className="timeline-marker" style={{ borderColor: idx === 0 ? 'var(--emerald)' : 'var(--text-muted)' }} />
                                    <div className="timeline-content glass-panel">
                                        <div className="timeline-details">
                                            <h4>₹{Number(p.amount).toLocaleString()} • {p.method?.toUpperCase()}</h4>
                                            <p className="flex-center gap-1">
                                                <HiOutlineClock size={12} /> 
                                                {new Date(p.paymentDate?._seconds ? p.paymentDate._seconds * 1000 : p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                            {p.transactionReference && (
                                                <p className="text-xs mt-1">Ref: <span className="font-mono">{p.transactionReference}</span></p>
                                            )}
                                        </div>
                                        <div className="text-accent">
                                            {getMethodIcon(p.method)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-muted">
                                <HiOutlineBanknotes size={32} className="mb-2 opacity-20" />
                                <p>No payment history found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Profile & Analytics */}
                <div className="flex-column gap-4">
                    <div className="glass-panel p-4">
                        <h3 className="section-title">Profile Integrity</h3>
                        <div className="flex-center justify-between">
                            <div className="trust-score-wrap">
                                <div className={`trust-score-circle trust-${trustColor}`} style={{ width: '80px', height: '80px', fontSize: '1.5rem' }}>
                                    <span>{Math.round(a.calculatedTrustScore || 70)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted">Trust Index</p>
                                <p className={`font-semibold text-${trustColor}`}>{trustColor.toUpperCase()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-4">
                        <h3 className="section-title">Identity Details</h3>
                        <div className="detail-list mt-2">
                            <div className="detail-field">
                                <span className="label">Aadhar Number</span>
                                <span className="value">{customer.aadharNumber || '—'}</span>
                            </div>
                            <div className="detail-field">
                                <span className="label">DL Number</span>
                                <span className="value">{customer.licenseNumber || '—'}</span>
                            </div>
                            <div className="detail-field">
                                <span className="label">Branch Owner</span>
                                <span className="value">{customer.location || 'Main Branch'}</span>
                            </div>
                            <div className="detail-field">
                                <span className="label">Home Address</span>
                                <span className="value">{customer.address || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-4">
                        <div className="flex-between mb-2">
                            <h3 className="section-title" style={{ margin: 0 }}>Rental Intelligence</h3>
                            <span className={`badge badge-${(a.damageIncidents || 0) > 0 ? 'rose' : (a.lateReturns || 0) > 0 ? 'amber' : 'emerald'}`}>
                                Risk: {(a.damageIncidents || 0) > 0 ? 'HIGH' : (a.lateReturns || 0) > 0 ? 'ELEVATED' : 'SECURE'}
                            </span>
                        </div>
                        <div className="grid-2 gap-3 mt-2">
                            <div className="p-3 bg-header rounded-lg">
                                <p className="text-xs text-muted mb-1">Total Rentals</p>
                                <p className="font-bold">{a.totalRentals || 0}</p>
                            </div>
                            <div className="p-3 bg-header rounded-lg">
                                <p className="text-xs text-muted mb-1">Incident Count</p>
                                <p className={`font-bold ${(a.damageIncidents || 0) > 0 ? 'text-rose' : ''}`}>{a.damageIncidents || 0}</p>
                            </div>
                        </div>

                        {/* Incident Dossier Detail */}
                        {(customer.bookings || []).some(b => b.incidentReported) && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[10px] uppercase text-rose font-bold tracking-widest mb-3">⚠️ Reported Incident Dossier</p>
                                <div className="flex-column gap-3">
                                    {customer.bookings.filter(b => b.incidentReported).map((b, i) => (
                                        <div key={i} className="p-3 rounded-lg bg-rose-glow/10 border border-rose/20">
                                            <div className="flex-between mb-1">
                                                <span className="text-xs font-bold text-rose">{b.car?.make} {b.car?.model}</span>
                                                <span className="text-[10px] text-muted">
                                                    {new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-300 italic">"{b.incidentDescription || 'No detailed description provided'}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Documents Preview */}
            <div className="glass-panel p-4 mt-4">
                <h3 className="section-title">KYC Documents</h3>
                <div className="grid-3 gap-3">
                    {customer.idProofUrl && (
                        <div className="document-card auto-preview-card">
                            <p className="text-muted text-sm mb-2 font-medium">Aadhar Card</p>
                            <div className="doc-preview-container">
                                {customer.idProofUrl.includes('.pdf') ? (
                                    <embed src={customer.idProofUrl} className="doc-preview-embed" type="application/pdf" />
                                ) : (
                                    <img src={customer.idProofUrl} alt="ID Proof" className="doc-preview-img" />
                                )}
                            </div>
                            <div className="btn-group mt-2">
                                <a href={customer.idProofUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm flex-1">
                                    View
                                </a>
                                <a href={customer.idProofUrl} target="_blank" rel="noreferrer" download className="btn btn-primary btn-sm flex-1">
                                    Download
                                </a>
                            </div>
                        </div>
                    )}

                    {customer.collegeIdUrl && (
                        <div className="document-card auto-preview-card">
                            <p className="text-muted text-sm mb-2 font-medium">College ID Card</p>
                            <div className="doc-preview-container">
                                {customer.collegeIdUrl.includes('.pdf') ? (
                                    <embed src={customer.collegeIdUrl} className="doc-preview-embed" type="application/pdf" />
                                ) : (
                                    <img src={customer.collegeIdUrl} alt="College ID" className="doc-preview-img" />
                                )}
                            </div>
                            <div className="btn-group mt-2">
                                <a href={customer.collegeIdUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm flex-1">
                                    View
                                </a>
                                <a href={customer.collegeIdUrl} target="_blank" rel="noreferrer" download className="btn btn-primary btn-sm flex-1">
                                    Download
                                </a>
                            </div>
                        </div>
                    )}

                    {customer.agreementUrl && (
                        <div className="document-card auto-preview-card">
                            <p className="text-muted text-sm mb-2 font-medium">Agreement</p>
                            <div className="doc-preview-container">
                                {customer.agreementUrl.includes('.pdf') ? (
                                    <embed src={customer.agreementUrl} className="doc-preview-embed" type="application/pdf" />
                                ) : (
                                    <img src={customer.agreementUrl} alt="Agreement" className="doc-preview-img" />
                                )}
                            </div>
                            <div className="btn-group mt-2">
                                <a href={customer.agreementUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm flex-1">
                                    View
                                </a>
                                <a href={customer.agreementUrl} target="_blank" rel="noreferrer" download className="btn btn-primary btn-sm flex-1">
                                    Download
                                </a>
                            </div>
                        </div>
                    )}

                    {!customer.idProofUrl && !customer.collegeIdUrl && !customer.agreementUrl && (
                        <p className="text-muted italic">No documents uploaded.</p>
                    )}
                </div>
            </div>

            {/* Experience History Ledger */}
            <div className="glass-panel p-4 mt-6" style={{ borderTop: '2px solid var(--purple)' }}>
                <div className="flex-between mb-4">
                    <h3 className="section-title" style={{ margin: 0 }}>🚗 Experience History Dossier</h3>
                    <span className="badge badge-purple">{customer.bookings?.length || 0} Sessions</span>
                </div>

                <div className="grid-2 gap-4">
                    {(customer.bookings || []).length > 0 ? (
                        customer.bookings.sort((a,b) => {
                            const aDate = new Date(a.startDate?._seconds ? a.startDate._seconds * 1000 : a.startDate);
                            const bDate = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                            return bDate - aDate;
                        }).map((b) => (
                            <div key={b.id} className="booking-session-card glass-panel p-4 border-l-4" style={{ borderColor: b.status === 'completed' ? 'var(--emerald)' : 'var(--amber)' }}>
                                <div className="flex-between mb-3">
                                    <div>
                                        <h4 className="text-lg font-bold">
                                            {b.car?.make} {b.car?.model}
                                        </h4>
                                        <p className="text-xs text-muted font-mono uppercase">{b.car?.plateNumber || 'No Plate'}</p>
                                    </div>
                                    <div className={`badge badge-${b.status === 'completed' ? 'emerald' : 'amber'}`}>
                                        {b.status?.toUpperCase()}
                                    </div>
                                </div>

                                <div className="grid-2 gap-3 mb-4">
                                    <div className="flex-column">
                                        <span className="text-[10px] uppercase text-muted tracking-wider">Rental Window</span>
                                        <span className="text-sm font-medium">
                                            {new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - 
                                            {new Date(b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex-column text-right">
                                        <span className="text-[10px] uppercase text-muted tracking-wider">Managed By</span>
                                        <span className="text-sm font-medium">{b.adminName}</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-header/50 rounded-xl grid-3 text-center border border-white/5">
                                    <div>
                                        <p className="text-[9px] uppercase text-muted">Total</p>
                                        <p className="text-sm font-bold">₹{(b.totalCost || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-muted">Cleared</p>
                                        <p className="text-sm font-bold text-emerald">₹{(b.paidForBooking || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-muted">Balance</p>
                                        <p className={`text-sm font-bold ${b.remainingForBooking > 0 ? 'text-rose' : 'text-muted'}`}>
                                            ₹{(b.remainingForBooking || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    {(b.userId === user.uid || isSuperAdmin) && (
                                        <Link to={`/bookings/${b.id}`} className="text-xs text-accent hover:underline flex-center gap-1">
                                            Full Session Report →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="form-group-full text-center py-8 text-muted opacity-50">
                            <p>No prior booking records found for this customer.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
