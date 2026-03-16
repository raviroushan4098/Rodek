import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import SearchableSelect from '../../components/SearchableSelect';

export default function BookingForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const queryCarId = searchParams.get('carId');
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [conflictError, setConflictError] = useState(null);
    const [cars, setCars] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [form, setForm] = useState({
        customerId: '', carId: queryCarId || '', startDate: '', startTime: '10:00', endDate: '', endTime: '10:00',
        discount: 0, discountType: 'flat', advancePayment: 0, totalCost: 0,
        notes: '', status: 'pending',
        actualEndDate: '', actualEndTime: '', incidentReported: false, incidentDescription: '',
    });

    useEffect(() => {
        Promise.all([
            apiFetch('/api/cars'), 
            apiFetch('/api/customers?minimal=true')
        ]).then(([c, cu]) => {
            setCars(c);
            setCustomers(cu);
        });
        if (isEdit) {
            apiFetch(`/api/bookings/${id}`).then(b => {
                const toDateStr = (d) => {
                    if (!d) return '';
                    const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
                    return date.toISOString().split('T')[0];
                };
                setForm({
                    customerId: b.customerId || '', carId: b.carId || '',
                    startDate: toDateStr(b.startDate), startTime: b.startTime || '10:00',
                    endDate: toDateStr(b.endDate), endTime: b.endTime || '10:00',
                    discount: b.discount || 0, discountType: b.discountType || 'flat',
                    advancePayment: b.advancePayment || 0, totalCost: b.totalCost || 0,
                    notes: b.notes || '', status: b.status || 'pending',
                    actualEndDate: toDateStr(b.actualEndDate), actualEndTime: b.actualEndTime || '',
                    incidentReported: b.incidentReported || false, incidentDescription: b.incidentDescription || '',
                });
            });
        }
    }, [id, isEdit]);

    // Get the selected car's daily rate
    const selectedCar = useMemo(() => cars.find(c => c.id === form.carId), [cars, form.carId]);
    const dailyRate = selectedCar?.dailyRate || 0;

    // Auto-calculate number of days and total cost
    const calculation = useMemo(() => {
        if (!form.startDate || !form.endDate || !dailyRate) {
            return { days: 0, subtotal: 0, discountAmount: 0, total: 0, balance: 0 };
        }
        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        const diffMs = end - start;
        const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        const subtotal = days * dailyRate;

        let discountAmount = 0;
        const discountVal = Number(form.discount) || 0;
        if (form.discountType === 'percent') {
            discountAmount = Math.round(subtotal * discountVal / 100);
        } else {
            discountAmount = discountVal;
        }

        const total = Math.max(0, subtotal - discountAmount);
        const advance = Number(form.advancePayment) || 0;
        const balance = Math.max(0, total - advance);

        return { days, subtotal, discountAmount, total, balance };
    }, [form.startDate, form.endDate, dailyRate, form.discount, form.discountType, form.advancePayment]);

    // Sync calculated total to form
    useEffect(() => {
        if (calculation.total > 0) {
            setForm(f => ({ ...f, totalCost: calculation.total }));
        }
    }, [calculation.total]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...form, totalCost: calculation.total };
            if (!payload.actualEndDate) { delete payload.actualEndDate; delete payload.actualEndTime; }
            if (isEdit) {
                await apiFetch(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
                toast.success('Booking updated!');
            } else {
                await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
                toast.success('Booking created!');
            }
            navigate('/bookings');
            navigate('/bookings');
        } catch (err) {
            if (err.code === 'DOUBLE_BOOKING') {
                setConflictError(err);
            } else {
                toast.error(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const setNum = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value === '' ? '' : Number(e.target.value) }));

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

    return (
        <div>
            <h2 className="page-title">{isEdit ? 'Edit Booking' : 'New Booking'}</h2>
            <div className="booking-layout">
                <form onSubmit={handleSubmit} className="form-card glass-panel">
                    <div className="form-grid">
                        {/* Customer & Car */}
                        <div className="form-group">
                            <label>Customer *</label>
                            <SearchableSelect
                                options={customers}
                                value={form.customerId}
                                onChange={(val) => setForm(f => ({ ...f, customerId: val }))}
                                placeholder="Search by name, Aadhar or phone..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Car *</label>
                            <select value={form.carId} onChange={set('carId')} required disabled={!!queryCarId}>
                                <option value="">Select car...</option>
                                {cars.filter(c => c.status === 'available' || c.id === form.carId).map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.make} {c.model} — {c.plateNumber} ({fmt(c.dailyRate)}/day)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dates & Times */}
                        <div className="form-group">
                            <label>Start Date *</label>
                            <input type="date" value={form.startDate} onChange={set('startDate')} required />
                        </div>
                        <div className="form-group">
                            <label>Start Time</label>
                            <input type="time" value={form.startTime} onChange={set('startTime')} />
                        </div>
                        <div className="form-group">
                            <label>End Date *</label>
                            <input type="date" value={form.endDate} onChange={set('endDate')} min={form.startDate} required />
                        </div>
                        <div className="form-group">
                            <label>End Time</label>
                            <input type="time" value={form.endTime} onChange={set('endTime')} />
                        </div>

                        {/* Discount */}
                        <div className="form-group">
                            <label>Discount</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    value={form.discount}
                                    onChange={setNum('discount')}
                                    placeholder="0"
                                    min="0"
                                    style={{ flex: 1 }}
                                />
                                <select
                                    value={form.discountType}
                                    onChange={set('discountType')}
                                    style={{ width: '80px' }}
                                >
                                    <option value="flat">₹</option>
                                    <option value="percent">%</option>
                                </select>
                            </div>
                        </div>

                        {/* Advance Payment */}
                        <div className="form-group">
                            <label>Advance Payment (₹)</label>
                            <input type="number" value={form.advancePayment} onChange={setNum('advancePayment')} placeholder="0" min="0" />
                        </div>

                        {/* Edit-only fields */}
                        {isEdit && (
                            <>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={form.status} onChange={set('status')}>
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Actual End Date</label>
                                    <input type="date" value={form.actualEndDate} onChange={set('actualEndDate')} />
                                </div>
                                <div className="form-group">
                                    <label>Actual End Time</label>
                                    <input type="time" value={form.actualEndTime} onChange={set('actualEndTime')} />
                                </div>
                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={form.incidentReported} onChange={set('incidentReported')} />
                                        Incident Reported
                                    </label>
                                </div>
                                {form.incidentReported && (
                                    <div className="form-group form-group-full">
                                        <label>Incident Description</label>
                                        <textarea value={form.incidentDescription} onChange={set('incidentDescription')} rows={3} />
                                    </div>
                                )}
                            </>
                        )}
                        <div className="form-group form-group-full">
                            <label>Notes</label>
                            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Additional notes..." />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => navigate('/bookings')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Booking' : 'Create Booking'}
                        </button>
                    </div>
                </form>

                {/* Cost Summary Panel */}
                <div className="cost-summary glass-panel">
                    <h3 className="card-title">💰 Cost Summary</h3>

                    {selectedCar ? (
                        <div className="cost-car-info">
                            <span className="text-amber font-bold">{selectedCar.make} {selectedCar.model}</span>
                            <span className="text-muted text-sm">{selectedCar.plateNumber}</span>
                        </div>
                    ) : (
                        <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>Select a car to see pricing</p>
                    )}

                    <div className="cost-rows">
                        <div className="cost-row">
                            <span>Daily Rate</span>
                            <span className="font-medium">{fmt(dailyRate)}</span>
                        </div>
                        <div className="cost-row">
                            <span>Duration</span>
                            <span className="font-medium">{calculation.days} day{calculation.days !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="cost-row">
                            <span>Subtotal</span>
                            <span className="font-medium">{fmt(calculation.subtotal)}</span>
                        </div>
                        {calculation.discountAmount > 0 && (
                            <div className="cost-row text-emerald">
                                <span>Discount {form.discountType === 'percent' ? `(${form.discount}%)` : ''}</span>
                                <span>−{fmt(calculation.discountAmount)}</span>
                            </div>
                        )}
                        <div className="cost-row cost-row-total">
                            <span>Total</span>
                            <span>{fmt(calculation.total)}</span>
                        </div>
                        {Number(form.advancePayment) > 0 && (
                            <>
                                <div className="cost-row text-blue">
                                    <span>Advance Paid</span>
                                    <span>−{fmt(form.advancePayment)}</span>
                                </div>
                                <div className="cost-row cost-row-balance">
                                    <span>Balance Due</span>
                                    <span>{fmt(calculation.balance)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Conflict Error Modal */}
            {conflictError && (
                <div className="modal-overlay" onClick={() => setConflictError(null)}>
                    <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(255, 99, 71, 0.3)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3 className="text-amber" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Car is Already Booked</h3>
                        <p className="text-muted" style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            The selected car is unavailable during these dates.
                        </p>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <span className="text-muted text-sm">Conflicting Dates:</span><br />
                                <span className="font-medium text-amber">{conflictError.details?.dates || 'Unknown dates'}</span>
                            </div>
                            <div>
                                <span className="text-muted text-sm">Booked By Admin:</span><br />
                                <span className="font-medium">{conflictError.details?.admin || 'Unknown'}</span>
                            </div>
                        </div>

                        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
                            Please select a different car or adjust your dates. Contact the admin listed above if this is a mistake.
                        </p>

                        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setConflictError(null)}>
                            Change Booking Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
