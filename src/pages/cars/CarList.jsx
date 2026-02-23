import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../contexts/AuthContext';
import { HiOutlinePlus, HiOutlineEye } from 'react-icons/hi2';

export default function CarList() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/cars').then(setCars).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

    const statusColor = (s) => ({ available: 'emerald', rented: 'blue', maintenance: 'rose' }[s] || 'gray');

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Fleet Management</h2>
                    <p className="page-subtitle">{cars.length} vehicles in your fleet</p>
                </div>
                <Link to="/cars/new" className="btn btn-primary"><HiOutlinePlus /> Add Car</Link>
            </div>

            <div className="card-grid">
                {cars.map(car => (
                    <Link to={`/cars/${car.id}`} key={car.id} className="car-card glass-panel">
                        <div className="car-card-img">
                            {car.imageUrl ? (
                                <img src={car.imageUrl} alt={`${car.make} ${car.model}`} />
                            ) : (
                                <div className="car-card-placeholder">🚗</div>
                            )}
                            <span className={`badge badge-${statusColor(car.status)} car-badge`}>{car.status}</span>
                        </div>
                        <div className="car-card-body">
                            <h3>{car.make} {car.model}</h3>
                            <p className="text-muted">{car.year} • {car.plateNumber}</p>
                            <div className="car-card-meta">
                                <span className="car-rate">₹{(car.dailyRate || 0).toLocaleString('en-IN')}/day</span>
                                <span className="car-cat">{car.category}</span>
                            </div>
                            <div className="car-card-specs">
                                <span>{car.transmission}</span>
                                <span>{car.fuelType}</span>
                                {car.location && <span>📍 {car.location}</span>}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {cars.length === 0 && (
                <div className="empty-state">
                    <p>No cars in your fleet yet.</p>
                    <Link to="/cars/new" className="btn btn-primary"><HiOutlinePlus /> Add Your First Car</Link>
                </div>
            )}
        </div>
    );
}
