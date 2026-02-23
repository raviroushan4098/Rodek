import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import { HiOutlinePlus } from 'react-icons/hi2';

export default function BookingList() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/bookings').then(setBookings).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

    const formatDate = (d) => {
        if (!d) return '—';
        const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Bookings</h2>
                    <p className="page-subtitle">{bookings.length} total reservations</p>
                </div>
                <Link to="/bookings/new" className="btn btn-primary"><HiOutlinePlus /> New Booking</Link>
            </div>

            <div className="glass-panel">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Vehicle</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b.id}>
                                    <td data-label="Customer" className="font-medium">{b.customer?.name || 'Unknown'}</td>
                                    <td data-label="Vehicle" className="text-muted">{b.car ? `${b.car.make} ${b.car.model}` : '—'}</td>
                                    <td data-label="Start" className="text-muted text-sm">{formatDate(b.startDate)}</td>
                                    <td data-label="End" className="text-muted text-sm">{formatDate(b.endDate)}</td>
                                    <td data-label="Total" className="font-medium">₹{(b.totalCost || 0).toLocaleString('en-IN')}</td>
                                    <td data-label="Status"><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                                    <td data-label="Actions"><Link to={`/bookings/${b.id}`} className="link-accent">View</Link></td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr><td colSpan="7" className="text-center text-muted py-6">No bookings yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
