import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, useAuth } from '../../contexts/AuthContext';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiXMark, HiOutlineGlobeAlt } from 'react-icons/hi2';
import PageLoader from '../../components/PageLoader';

export default function CustomerList() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setLoading(true);
            const url = search ? `/api/customers?search=${search}` : '/api/customers';
            apiFetch(url)
                .then(setCustomers)
                .catch(console.error)
                .finally(() => setLoading(false));
        }, search ? 500 : 0);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    if (loading && customers.length === 0) return <PageLoader />;

    const trustColor = (score) => score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'rose';

    return (
        <div>
            <div className="page-title-row">
                <div>
                    <h2 className="page-title">Customers</h2>
                    <p className="page-subtitle">{customers.length} registered clients</p>
                </div>
                <div className="flex-center gap-3">
                    <div className="search-box glass-panel">
                        <HiOutlineMagnifyingGlass className="search-icon" />
                        <input 
                            placeholder="Find by Name, Aadhar or Phone..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && <HiXMark className="clear-icon" onClick={() => setSearch('')} />}
                    </div>
                    <Link to="/customers/new" className="btn btn-primary"><HiOutlinePlus /> Add Customer</Link>
                </div>
            </div>

            <div className="glass-panel">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Aadhar</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Trust Score</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c => (
                                <tr key={c.id}>
                                    <td data-label="Name">
                                        <div className="flex-center gap-3">
                                            <div className="avatar-sm">{c.name?.[0] || '?'}</div>
                                            <div>
                                                <div className="font-medium">{c.name}</div>
                                                {c.userId !== user.uid && (
                                                    <span className="badge badge-global mt-1">
                                                        <HiOutlineGlobeAlt /> Global Registry
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Aadhar" className="text-muted">{c.aadharNumber || '—'}</td>
                                    <td data-label="Phone" className="text-muted">{c.phone}</td>
                                    <td data-label="Email" className="text-muted">{c.email || '—'}</td>
                                    <td data-label="Trust Score">
                                        <span className={`badge badge-${trustColor(c.trustScore || 70)}`}>
                                            {c.trustScore || 70}
                                        </span>
                                    </td>
                                    <td data-label="Actions">
                                        <Link to={`/customers/${c.id}`} className="link-accent">View</Link>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr><td colSpan="6" className="text-center text-muted py-6">No customers yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
