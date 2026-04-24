import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi2';
import PageLoader from '../../components/PageLoader';

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showComplete, setShowComplete] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [completeForm, setCompleteForm] = useState({
        remarks: '',
        incidentReported: false,
        incidentDescription: '',
        actualEndDate: new Date().toISOString().split('T')[0],
        actualEndTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        recordPayment: false,
        paymentAmount: 0,
        paymentMethod: 'cash',
        paymentRef: '',
    });

    const loadBooking = () => {
        apiFetch(`/api/bookings/${id}`)
            .then(setBooking)
            .catch((err) => {
                if (err.status === 403) {
                    toast.error('Access Denied: This reservation detail is private');
                } else {
                    toast.error('Booking not found');
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadBooking(); }, [id]);

    const handleDelete = async () => {
        if (!confirm('Delete this booking?')) return;
        try {
            await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
            toast.success('Booking deleted');
            navigate('/bookings');
        } catch (err) { toast.error(err.message); }
    };

    const handleComplete = async () => {
        const remaining = booking.remainingBalance || 0;
        const msg = remaining > 0 
            ? `There is a pending balance of ₹${remaining.toLocaleString()}. Record final payment and complete?`
            : 'Mark this booking as completed? Car will be set to available.';
        
        if (!confirm(msg)) return;
        
        setCompleting(true);
        try {
            await apiFetch(`/api/bookings/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'completed',
                    completionRemarks: completeForm.remarks,
                    incidentReported: completeForm.incidentReported,
                    incidentDescription: completeForm.incidentDescription,
                    actualEndDate: completeForm.actualEndDate,
                    actualEndTime: completeForm.actualEndTime,
                    paymentData: completeForm.recordPayment ? {
                        amount: completeForm.paymentAmount,
                        method: completeForm.paymentMethod,
                        transactionReference: completeForm.paymentRef,
                    } : null
                }),
            });
            toast.success('Booking completed! Financials updated.');
            setShowComplete(false);
            loadBooking();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!booking) return <div className="empty-state"><p>Booking not found.</p></div>;

    const formatDate = (d) => {
        if (!d) return '—';
        const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const payStatusColor = { 'Unpaid': 'rose', 'Partial': 'amber', 'Fully Paid': 'emerald' };
    const isActive = booking.status === 'active' || booking.status === 'pending';

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Booking Details</h2>
                    <p className="page-subtitle">#{id.slice(0, 8)}</p>
                </div>
                <div className="btn-group">
                    {isActive && (
                        <button className="btn btn-primary" onClick={() => {
                            setCompleteForm(prev => ({
                                ...prev,
                                paymentAmount: Math.max(0, booking.remainingBalance || 0),
                                recordPayment: (booking.remainingBalance || 0) > 0
                            }));
                            setShowComplete(!showComplete);
                        }}>
                            <HiOutlineCheckCircle /> Complete
                        </button>
                    )}
                    <Link to={`/bookings/${id}/edit`} className="btn btn-secondary"><HiOutlinePencil /> Edit</Link>
                    <button className="btn btn-danger" onClick={handleDelete}><HiOutlineTrash /> Delete</button>
                </div>
            </div>

            {/* Complete Booking Panel with Smart Closure Ledger */}
            {showComplete && isActive && (
                <div className="glass-panel complete-panel" style={{ marginBottom: '1.5rem', border: '1px solid var(--emerald)' }}>
                    <div className="flex-between mb-4">
                        <h3 className="card-title" style={{ margin: 0 }}>✅ Smart Closure Ledger</h3>
                        <div className={`badge badge-${payStatusColor[booking.paymentStatus]}`}>{booking.paymentStatus}</div>
                    </div>

                    <div className="grid-3 mb-6 settlement-summary p-4 bg-header rounded-xl border border-dashed border-emerald/20">
                        <div className="text-center">
                            <p className="text-secondary text-xs uppercase mb-1">Total Cost</p>
                            <p className="font-bold text-lg">₹{(booking.totalCost || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-secondary text-xs uppercase mb-1">Already Paid</p>
                            <p className="font-bold text-lg text-emerald">₹{(booking.paidAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-secondary text-xs uppercase mb-1">Clearance Due</p>
                            <p className="font-bold text-lg text-rose">₹{(booking.remainingBalance || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Actual Return Date</label>
                            <input
                                type="date"
                                value={completeForm.actualEndDate}
                                onChange={e => setCompleteForm(f => ({ ...f, actualEndDate: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Actual Return Time</label>
                            <input
                                type="time"
                                value={completeForm.actualEndTime}
                                onChange={e => setCompleteForm(f => ({ ...f, actualEndTime: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="checkbox-label" style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={completeForm.recordPayment}
                                    onChange={e => setCompleteForm(f => ({ ...f, recordPayment: e.target.checked }))}
                                />
                                Record Final Payment
                            </label>
                        </div>

                        {completeForm.recordPayment && (
                            <>
                                <div className="form-group">
                                    <label>Payment Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={completeForm.paymentAmount}
                                        onChange={e => setCompleteForm(f => ({ ...f, paymentAmount: Number(e.target.value) }))}
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select
                                        value={completeForm.paymentMethod}
                                        onChange={e => setCompleteForm(f => ({ ...f, paymentMethod: e.target.value }))}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="card">Card</option>
                                        <option value="bank">Bank Transfer</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Transaction Reference</label>
                                    <input
                                        type="text"
                                        value={completeForm.paymentRef}
                                        onChange={e => setCompleteForm(f => ({ ...f, paymentRef: e.target.value }))}
                                        placeholder="Optional Ref ID"
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group form-group-full">
                            <label>Completion Remarks</label>
                            <textarea
                                value={completeForm.remarks}
                                onChange={e => setCompleteForm(f => ({ ...f, remarks: e.target.value }))}
                                rows={2}
                                placeholder="e.g. Car returned in good condition..."
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={completeForm.incidentReported}
                                    onChange={e => setCompleteForm(f => ({ ...f, incidentReported: e.target.checked }))}
                                />
                                ⚠️ Report Incident
                            </label>
                        </div>
                        {completeForm.incidentReported && (
                            <div className="form-group form-group-full">
                                <label>Incident Description</label>
                                <textarea
                                    value={completeForm.incidentDescription}
                                    onChange={e => setCompleteForm(f => ({ ...f, incidentDescription: e.target.value }))}
                                    rows={2}
                                    placeholder="Describe the incident..."
                                />
                            </div>
                        )}
                    </div>
                    <div className="form-actions mt-4">
                        <button className="btn btn-ghost" onClick={() => setShowComplete(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleComplete} disabled={completing}>
                            {completing ? 'Processing...' : '✅ Complete & Settle'}
                        </button>
                    </div>
                </div>
            )}

            <div className="detail-grid detail-grid-2">
                <div className="glass-panel">
                    <h3 className="card-title">Reservation Info</h3>
                    <div className="detail-fields">
                        <div className="detail-field"><span className="field-label">Status</span><span className={`badge badge-${booking.status}`}>{booking.status}</span></div>
                        <div className="detail-field"><span className="field-label">Customer</span><Link to={`/customers/${booking.customerId}`} className="link-accent">{booking.customer?.name || 'Unknown'}</Link></div>
                        <div className="detail-field"><span className="field-label">Vehicle</span><Link to={`/cars/${booking.carId}`} className="link-accent">{booking.car ? `${booking.car.make} ${booking.car.model}` : '—'}</Link></div>
                        <div className="detail-field"><span className="field-label">Start</span><span>{formatDate(booking.startDate)} {booking.startTime}</span></div>
                        <div className="detail-field"><span className="field-label">End</span><span>{formatDate(booking.endDate)} {booking.endTime}</span></div>
                        {booking.actualEndDate && <div className="detail-field"><span className="field-label">Actual Return</span><span>{formatDate(booking.actualEndDate)} {booking.actualEndTime}</span></div>}
                        {booking.completionRemarks && (
                            <div className="detail-field"><span className="field-label">Remarks</span><span>{booking.completionRemarks}</span></div>
                        )}
                        {booking.incidentReported && <div className="detail-field"><span className="field-label">⚠️ Incident</span><span className="text-rose">{booking.incidentDescription || 'Reported'}</span></div>}
                        {booking.notes && <div className="detail-field"><span className="field-label">Notes</span><span>{booking.notes}</span></div>}
                    </div>
                </div>

                <div className="glass-panel">
                    <h3 className="card-title">Payment Summary</h3>
                    <div className="payment-summary">
                        <div className="payment-row"><span>Total Cost</span><span className="font-bold">₹{(booking.totalCost || 0).toLocaleString('en-IN')}</span></div>
                        {booking.discount > 0 && (
                            <div className="payment-row text-emerald">
                                <span>🎁 Special Discount {booking.discountType === 'percent' ? `(${booking.discount}%)` : ''}</span>
                                <span className="font-medium">
                                    {booking.discountType === 'percent'
                                        ? `−₹${Math.round(((booking.totalCost || 0) / (1 - booking.discount / 100)) * booking.discount / 100).toLocaleString('en-IN')}`
                                        : `−₹${booking.discount.toLocaleString('en-IN')}`
                                    }
                                </span>
                            </div>
                        )}
                        <div className="payment-row"><span>Advance</span><span>₹{(booking.advancePayment || 0).toLocaleString('en-IN')}</span></div>
                        <div className="payment-row"><span>Paid</span><span className="text-emerald">₹{(booking.paidAmount || 0).toLocaleString('en-IN')}</span></div>
                        <div className="payment-row payment-row-total">
                            <span>Balance</span>
                            <span className={booking.remainingBalance > 0 ? 'text-rose' : 'text-emerald'}>
                                ₹{(booking.remainingBalance || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="payment-row">
                            <span>Status</span>
                            <span className={`badge badge-${payStatusColor[booking.paymentStatus] || 'gray'}`}>{booking.paymentStatus}</span>
                        </div>
                    </div>

                    {booking.payments?.length > 0 && (
                        <div className="payment-history">
                            <h4>Payment History</h4>
                            {booking.payments.map(p => (
                                <div key={p.id} className="payment-entry">
                                    <span>₹{p.amount?.toLocaleString('en-IN')}</span>
                                    <span className="text-muted">{p.method}</span>
                                    <span className="text-muted text-sm">{formatDate(p.paymentDate)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {isActive && (
                        <Link to={`/payments/new?bookingId=${id}`} className="btn btn-primary btn-full mt-4">Record Payment</Link>
                    )}
                </div>
            </div>
        </div>
    );
}
