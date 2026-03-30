import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import InstallPrompt from './InstallPrompt';
import { 
    HiOutlineHome, 
    HiOutlineTruck, 
    HiOutlineUsers, 
    HiOutlineCalendar, 
    HiOutlineCreditCard, 
    HiOutlineCog6Tooth, 
    HiOutlineUserGroup, 
    HiOutlineArrowRightOnRectangle, 
    HiOutlineBars3, 
    HiOutlineXMark, 
    HiOutlineMapPin 
} from 'react-icons/hi2';

const navItems = [
    { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/cars', icon: HiOutlineTruck, label: 'Cars' },
    { to: '/customers', icon: HiOutlineUsers, label: 'Customers' },
    { to: '/bookings', icon: HiOutlineCalendar, label: 'Bookings' },
    { to: '/payments', icon: HiOutlineCreditCard, label: 'Payments' },
];

const adminItems = [
    { to: '/locations', icon: HiOutlineMapPin, label: 'Locations' },
    { to: '/users', icon: HiOutlineUserGroup, label: 'Users' },
    { to: '/settings', icon: HiOutlineCog6Tooth, label: 'Settings' },
];

export default function Layout() {
    const { userProfile, logout, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = userProfile?.name
        ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    return (
        <div className="app-layout">
            {/* Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="sidebar-overlay visible" 
                        onClick={() => setSidebarOpen(false)} 
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`sidebar glass-card ${sidebarOpen ? 'sidebar-open' : ''}`} style={{ borderRadius: 0, borderRight: '1px solid var(--glass-border)' }}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">
                            <HiOutlineTruck />
                        </div>
                        <div>
                            <h1 className="logo-text">MetricStack</h1>
                            <p className="logo-sub">Fleet Manager</p>
                        </div>
                    </div>
                    <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
                        <HiOutlineXMark />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <p className="nav-label">Main</p>
                        {navItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="nav-icon" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    {isSuperAdmin && (
                        <div className="nav-section">
                            <p className="nav-label">Admin</p>
                            {adminItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="nav-icon" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-card glass-card">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-info">
                            <p className="user-name">{userProfile?.name || 'User'}</p>
                            <p className="user-role">{userProfile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
                        </div>
                        <button className="logout-btn" onClick={handleLogout} title="Logout">
                            <HiOutlineArrowRightOnRectangle />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                <header className="top-bar glass-header">
                    <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <AnimatePresence mode="wait">
                            {!sidebarOpen ? (
                                <motion.button 
                                    key="hamburger"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="menu-btn mobile-touch-target" 
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <HiOutlineBars3 />
                                </motion.button>
                            ) : (
                                <motion.div 
                                    key="logo"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="logo mobile-only"
                                    style={{ border: 'none', padding: 0, background: 'none' }}
                                >
                                    <div className="logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                                        <HiOutlineTruck />
                                    </div>
                                    <div>
                                        <h1 className="logo-text" style={{ fontSize: '1rem' }}>MetricStack</h1>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="top-bar-right">
                        <ThemeToggle />
                        {userProfile?.location && (
                            <span className="location-badge glass-card" style={{ padding: '4px 12px' }}>
                                📍 {userProfile.location}
                            </span>
                        )}
                    </div>
                </header>
                
                <div className="page-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{ height: '100%' }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Bottom Navigation for Mobile */}
                <nav className="bottom-nav glass-header">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon className="bottom-nav-icon" />
                            <span>{item.label}</span>
                            {location.pathname === item.to && (
                                <motion.div 
                                    layoutId="bottomNavIndicator"
                                    className="bottom-nav-indicator"
                                />
                            )}
                        </NavLink>
                    ))}
                </nav>

                <InstallPrompt />
            </main>
        </div>
    );
}
