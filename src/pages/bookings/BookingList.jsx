import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { HiOutlinePlus } from 'react-icons/hi2';
import DateRangeFilter from '../../components/DateRangeFilter';
import PageLoader from '../../components/PageLoader';

export default function BookingList() {
    const { cache, updateCache } = useData();
    const [bookings, setBookings] = useState(cache.bookings || []);
    const [loading, setLoading] = useState(!cache.bookings);
    const [dateRange, setDateRange] = useState(null);
    const fetchStarted = useRef(false);

    useEffect(() => {
        if (fetchStarted.current) return;
        fetchStarted.current = true;

        apiFetch('/api/bookings')
            .then(res => {
                setBookings(res);
                updateCache('bookings', res);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [updateCache]);

    const filteredBookings = useMemo(() => {
        if (!dateRange || !dateRange.startDate || !dateRange.endDate) return bookings;

        const sDate = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
        const eDate = new Date(dateRange.endDate).setHours(23, 59, 59, 999);

        return bookings.filter(b => {
            // Check if the booking overlaps with the selected date range
            const bStart = b.startDate?._seconds ? b.startDate._seconds * 1000 : new Date(b.startDate).getTime();
            const bEnd = b.endDate?._seconds ? b.endDate._seconds * 1000 : new Date(b.endDate).getTime();
            if (!bStart || !bEnd) return true;

            // Overlap logic: bookingStart <= filterEnd AND bookingEnd >= filterStart
            return bStart <= eDate && bEnd >= sDate;
        });
    }, [bookings, dateRange]);

    if (loading) return <PageLoader source="BookingList" />;

    const formatDate = (d) => {
        if (!d) return '—';
        const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <div className="page-title-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 className="page-title">Bookings</h2>
                    <p className="page-subtitle">{filteredBookings.length} reservations in period</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateRangeFilter onFilterChange={setDateRange} />
                    <Link to="/bookings/new" className="btn btn-primary"><HiOutlinePlus /> New Booking</Link>
                </div>
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
                            {filteredBookings.map(b => (
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
                            {filteredBookings.length === 0 && (
                                <tr><td colSpan="7" className="text-center text-muted py-6">No bookings in this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
