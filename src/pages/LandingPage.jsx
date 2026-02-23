import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineTruck, HiOutlineChartBar, HiOutlineDocumentCheck, HiOutlineUsers } from 'react-icons/hi2';

export default function LandingPage() {
    const { user } = useAuth(); // If they are already logged in, show "Dashboard", not "Sign In"

    return (
        <div className="landing-page">
            <div className="landing-bg-shapes">
                <div className="shape shape-1" />
                <div className="shape shape-2" />
                <div className="shape shape-3" />
            </div>

            <nav className="landing-nav">
                <div className="landing-logo">
                    <HiOutlineTruck size={28} className="text-accent" />
                    <span className="logo-text">MetricStack</span>
                </div>
                <div>
                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
                    ) : (
                        <Link to="/login" className="btn btn-outline">Sign In</Link>
                    )}
                </div>
            </nav>

            <main className="landing-main">
                <section className="hero-section">
                    <h1 className="hero-title">
                        Next-Gen <span className="text-gradient">Fleet Management</span>
                    </h1>
                    <p className="hero-subtitle">
                        Streamline your car rental operations with real-time tracking, seamless booking workflows, and advanced financial analytics. Built for modern enterprises.
                    </p>
                    <div className="hero-actions">
                        {user ? (
                            <Link to="/dashboard" className="btn btn-primary hero-btn">Launch Dashboard</Link>
                        ) : (
                            <Link to="/login" className="btn btn-primary hero-btn">Get Started</Link>
                        )}
                        <a href="#features" className="btn btn-outline hero-btn">Explore Features</a>
                    </div>
                </section>

                <section id="features" className="features-section">
                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon"><HiOutlineChartBar size={28} /></div>
                            <h3>Financial Intelligence</h3>
                            <p>Track outstanding debts, filter revenue by customizable date ranges, and monitor trust scores to mitigate renting risks.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><HiOutlineTruck size={28} /></div>
                            <h3>Live Fleet Overview</h3>
                            <p>Instantly monitor which vehicles are rented, available, or undergoing maintenance. Sync fleet statuses globally.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><HiOutlineUsers size={28} /></div>
                            <h3>Customer Profiles</h3>
                            <p>360-degree views of every renter. Manage KYC documents, rental history, and internal warning systems in one place.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><HiOutlineDocumentCheck size={28} /></div>
                            <h3>Smart Bookings</h3>
                            <p>Prevent double configurations with automated conflict grids. Accurately handle advance bookings and partial deposits.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} MetricStack Systems. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
