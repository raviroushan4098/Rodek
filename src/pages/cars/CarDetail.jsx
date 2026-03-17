import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch, useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineCalendarDays, HiOutlineCalendar } from 'react-icons/hi2';

export default function CarDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isSuperAdmin } = useAuth();
    const [car, setCar] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch(`/api/cars/${id}`),
            apiFetch(`/api/bookings`)
        ])
            .then(([carData, allBookings]) => {
                setCar(carData);
                console.log('All Bookings:', allBookings);

                // Filter upcoming bookings for this car
                const now = new Date();
                now.setHours(0, 0, 0, 0); // Reset time to midnight for accurate current day comparison

                const upcoming = allBookings
                    .filter(b => {
                        const isRightCar = b.carId === id;
                        const notFinished = b.status === 'active' || b.status === 'pending';
                        console.log(`Booking ${b.id}: carMatch=${isRightCar}, statusMatch=${notFinished} (status=${b.status})`);
                        return isRightCar && notFinished;
                    })
                    .filter(b => {
                        const endDate = b.endDate?._seconds ? new Date(b.endDate._seconds * 1000) : new Date(b.endDate);
                        endDate.setHours(0, 0, 0, 0);
                        const isUpcomingDate = endDate >= now;
                        console.log(`Booking ${b.id}: endDate=${endDate}, now=${now}, isUpcoming=${isUpcomingDate}`);
                        return isUpcomingDate; // Booking hasn't ended yet
                    })
                    .sort((a, b) => {
                        const d1 = a.startDate?._seconds ? a.startDate._seconds : new Date(a.startDate).getTime() / 1000;
                        const d2 = b.startDate?._seconds ? b.startDate._seconds : new Date(b.startDate).getTime() / 1000;
                        return d1 - d2;
                    });

                console.log('Upcoming filtered:', upcoming);
                setBookings(upcoming);
            })
            .catch((err) => {
                console.error('Fetch error:', err);
                toast.error('Failed to load car details');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this car?')) return;
        try {
            await apiFetch(`/api/cars/${id}`, { method: 'DELETE' });
            toast.success('Car deleted');
            navigate('/cars');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
    if (!car) return <div className="empty-state"><p>Car not found.</p></div>;

    const statusColor = { available: 'emerald', rented: 'blue', maintenance: 'rose', upcoming: 'amber' }[car.status] || 'gray';

    const formatDate = (d) => {
        if (!d) return '—';
        const date = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">{car.make} {car.model}</h2>
                    <p className="page-subtitle">{car.year} • {car.plateNumber}</p>
                </div>
                <div className="btn-group">
                    {car.status !== 'maintenance' && (
                        <Link to={`/bookings/new?carId=${id}`} className="btn btn-primary">
                            <HiOutlineCalendarDays /> Book Now
                        </Link>
                    )}
                    <Link to={`/cars/${id}/edit`} className="btn btn-secondary"><HiOutlinePencil /> Edit</Link>
                    {isSuperAdmin && (
                        <button className="btn btn-danger" onClick={handleDelete}><HiOutlineTrash /> Delete</button>
                    )}
                </div>
            </div>

            <div className="detail-grid detail-grid-2">
                <div className="glass-panel">
                    <h3 className="card-title">Vehicle Details</h3>
                    {car.imageUrl && (
                        <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                            <img src={car.imageUrl} alt={car.make} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                    )}
                    <div className="detail-fields">
                        <div className="detail-field">
                            <span className="field-label">Status</span>
                            <span className={`badge badge-${statusColor}`}>
                                {car.status === 'upcoming' ? 'Upcoming Booking' : car.status}
                            </span>
                        </div>
                        <div className="detail-field">
                            <span className="field-label">Category</span>
                            <span style={{ textTransform: 'capitalize' }}>{car.category}</span>
                        </div>
                        <div className="detail-field">
                            <span className="field-label">Daily Rate</span>
                            <span className="text-amber font-bold" style={{ fontSize: '1.1rem' }}>₹{(car.dailyRate || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="detail-field">
                            <span className="field-label">Transmission</span>
                            <span style={{ textTransform: 'capitalize' }}>{car.transmission}</span>
                        </div>
                        <div className="detail-field">
                            <span className="field-label">Fuel Type</span>
                            <span style={{ textTransform: 'capitalize' }}>{car.fuelType}</span>
                        </div>
                        <div className="detail-field">
                            <span className="field-label">Mileage</span>
                            <span>{car.mileage ? `${car.mileage.toLocaleString()} km` : '—'}</span>
                        </div>
                        <div className="detail-field">
                            <span className="field-label">Location</span>
                            <span>{car.location || '—'}</span>
                        </div>
                        <div className="detail-field" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                            <span className="field-label text-muted">Added By</span>
                            <span className="text-muted">{car.creatorName || 'System'}</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel">
                    <div className="table-header-row">
                        <h3 className="card-title">📅 Upcoming Reservations</h3>
                        <span className="text-muted text-sm">{bookings.length} scheduled</span>
                    </div>
                    {bookings.length > 0 ? (
                        <div className="timeline-list mt-4">
                            {bookings.map(b => {
                                const start = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                                const isDraft = start > new Date();
                                return (
                                    <div key={b.id} className="timeline-item" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span className="font-bold text-amber">{formatDate(b.startDate)} - {formatDate(b.endDate)}</span>
                                            <span className={`badge badge-${b.status === 'active' ? 'emerald' : 'blue'}`}>{isDraft ? 'Upcoming' : 'Active'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span className="text-muted">Customer: <Link to={`/customers/${b.customerId}`} className="link-accent">{b.customer?.name || 'View'}</Link></span>
                                            <Link to={`/bookings/${b.id}`} className="link-accent text-sm">View Booking →</Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ minHeight: '200px', padding: '3rem 1rem' }}>
                            <HiOutlineCalendar style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No upcoming reservations found.</p>
                            <span className="text-muted text-sm mt-2">The car is fully available.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
