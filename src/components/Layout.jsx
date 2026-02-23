import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineHome, HiOutlineTruck, HiOutlineUsers, HiOutlineCalendar, HiOutlineCreditCard, HiOutlineCog6Tooth, HiOutlineUserGroup, HiOutlineArrowRightOnRectangle, HiOutlineBars3, HiOutlineXMark, HiOutlineMapPin } from 'react-icons/hi2';

const navItems = [
    { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
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
            {/* Mobile overlay */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">
                            <HiOutlineTruck />
                        </div>
                        <div>
                            <h1 className="logo-text">DriveElite</h1>
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
                    <div className="user-card">
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
                <header className="top-bar">
                    <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
                        <HiOutlineBars3 />
                    </button>
                    <div className="top-bar-right">
                        {userProfile?.location && (
                            <span className="location-badge">
                                📍 {userProfile.location}
                            </span>
                        )}
                    </div>
                </header>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
