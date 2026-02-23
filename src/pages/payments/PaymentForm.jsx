import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function PaymentForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [form, setForm] = useState({
        bookingId: searchParams.get('bookingId') || '',
        amount: '', method: 'cash', transactionReference: '',
        paymentDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        Promise.all([apiFetch('/api/bookings'), apiFetch('/api/payments')])
            .then(([b, p]) => { setBookings(b); setPayments(p); })
            .catch(console.error);
    }, []);

    // Selected booking details
    const selectedBooking = useMemo(() => bookings.find(b => b.id === form.bookingId), [bookings, form.bookingId]);

    // Calculate paid so far and balance for selected booking
    const bookingFinancials = useMemo(() => {
        if (!selectedBooking) return { totalCost: 0, advance: 0, paid: 0, balance: 0 };

        const totalCost = Number(selectedBooking.totalCost) || 0;
        const advance = Number(selectedBooking.advancePayment) || 0;
        const paidFromPayments = payments
            .filter(p => p.bookingId === form.bookingId)
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalPaid = advance + paidFromPayments;
        const balance = Math.max(0, totalCost - totalPaid);

        return { totalCost, advance, paid: paidFromPayments, totalPaid, balance };
    }, [selectedBooking, payments, form.bookingId]);

    // Auto-fill balance as amount when booking is selected
    useEffect(() => {
        if (bookingFinancials.balance > 0 && !form.amount) {
            setForm(f => ({ ...f, amount: bookingFinancials.balance }));
        }
    }, [form.bookingId, bookingFinancials.balance]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch('/api/payments', { method: 'POST', body: JSON.stringify(form) });
            toast.success('Payment recorded!');
            if (form.bookingId) navigate(`/bookings/${form.bookingId}`);
            else navigate('/payments');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
    const formatDate = (d) => {
        if (!d) return '';
        const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Past payments for this booking
    const bookingPayments = useMemo(
        () => payments.filter(p => p.bookingId === form.bookingId),
        [payments, form.bookingId]
    );

    return (
        <div>
            <h2 className="page-title">Record Payment</h2>
            <div className="booking-layout">
                <form onSubmit={handleSubmit} className="form-card glass-panel">
                    <div className="form-grid">
                        <div className="form-group form-group-full">
                            <label>Booking *</label>
                            <select value={form.bookingId} onChange={(e) => setForm(f => ({ ...f, bookingId: e.target.value, amount: '' }))} required>
                                <option value="">Select booking...</option>
                                {bookings.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.customer?.name || 'Unknown'} — {b.car?.make} {b.car?.model} ({b.car?.plateNumber}) • {fmt(b.totalCost)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Amount (₹) *</label>
                            <input type="number" value={form.amount} onChange={set('amount')} placeholder="0" required min="1" />
                        </div>
                        <div className="form-group">
                            <label>Payment Method</label>
                            <select value={form.method} onChange={set('method')}>
                                <option value="cash">💵 Cash</option>
                                <option value="upi">📱 UPI</option>
                                <option value="bank_transfer">🏦 Bank Transfer</option>
                                <option value="card">💳 Card</option>
                                <option value="cheque">📝 Cheque</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Transaction Reference</label>
                            <input value={form.transactionReference} onChange={set('transactionReference')} placeholder="TXN-12345 / UPI ID" />
                        </div>
                        <div className="form-group">
                            <label>Payment Date</label>
                            <input type="date" value={form.paymentDate} onChange={set('paymentDate')} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => navigate('/payments')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>

                {/* Booking Financial Summary */}
                <div className="cost-summary glass-panel">
                    <h3 className="card-title">💰 Payment Summary</h3>

                    {selectedBooking ? (
                        <>
                            <div className="cost-car-info">
                                <span className="text-amber font-bold">
                                    {selectedBooking.car?.make} {selectedBooking.car?.model}
                                </span>
                                <span className="text-muted text-sm">
                                    {selectedBooking.customer?.name} • {selectedBooking.car?.plateNumber}
                                </span>
                                <span className="text-muted text-sm">
                                    {formatDate(selectedBooking.startDate)} → {formatDate(selectedBooking.endDate)}
                                </span>
                            </div>

                            <div className="cost-rows">
                                <div className="cost-row">
                                    <span>Total Cost</span>
                                    <span className="font-medium">{fmt(bookingFinancials.totalCost)}</span>
                                </div>
                                {bookingFinancials.advance > 0 && (
                                    <div className="cost-row text-blue">
                                        <span>Advance Paid</span>
                                        <span>−{fmt(bookingFinancials.advance)}</span>
                                    </div>
                                )}
                                {bookingFinancials.paid > 0 && (
                                    <div className="cost-row text-emerald">
                                        <span>Payments Made</span>
                                        <span>−{fmt(bookingFinancials.paid)}</span>
                                    </div>
                                )}
                                <div className="cost-row cost-row-total">
                                    <span>Balance Due</span>
                                    <span>{fmt(bookingFinancials.balance)}</span>
                                </div>
                                {bookingFinancials.balance === 0 && (
                                    <div style={{ textAlign: 'center', padding: '0.5rem', marginTop: '0.5rem' }}>
                                        <span className="badge badge-completed">✓ Fully Paid</span>
                                    </div>
                                )}
                            </div>

                            {/* Past payments for this booking */}
                            {bookingPayments.length > 0 && (
                                <div className="payment-history">
                                    <h4>Payment History</h4>
                                    {bookingPayments.map(p => (
                                        <div key={p.id} className="payment-entry">
                                            <div>
                                                <span className="capitalize">{p.method}</span>
                                                <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>{formatDate(p.paymentDate)}</span>
                                            </div>
                                            <span className="text-emerald font-bold">{fmt(p.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-muted text-sm">Select a booking to see payment details</p>
                    )}
                </div>
            </div>
        </div>
    );
}
