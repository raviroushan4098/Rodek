import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { HiOutlineTruck, HiOutlineChartBar, HiOutlineDocumentCheck, HiOutlineUsers } from 'react-icons/hi2';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.3
        }
    }
};

const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    }
};

const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
        scale: 1, 
        opacity: 1,
        transition: { type: "spring", stiffness: 120, damping: 12 }
    }
};

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div className="landing-page">
            <div className="landing-bg-shapes">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0]
                    }} 
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="shape shape-1" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 0.8, 1],
                        rotate: [0, -90, 0]
                    }} 
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="shape shape-2" 
                />
                <motion.div 
                    animate={{ 
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }} 
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="shape shape-3" 
                />
            </div>

            <nav className="landing-nav glass-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, borderBottom: '1px solid var(--glass-border)' }}>
                <div className="landing-logo">
                    <HiOutlineTruck size={28} className="text-accent" />
                    <span className="logo-text">MetricStack</span>
                </div>
                <div className="flex-center gap-4">
                    <ThemeToggle />
                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
                    ) : (
                        <Link to="/login" className="btn btn-outline mobile-touch-target">Sign In</Link>
                    )}
                </div>
            </nav>

            <main className="landing-main" style={{ paddingTop: '80px' }}>
                <motion.section 
                    className="hero-section"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.h1 className="hero-title" variants={itemVariants}>
                        Next-Gen <span className="text-gradient">Fleet Management</span>
                    </motion.h1>
                    <motion.p className="hero-subtitle" variants={itemVariants}>
                        Streamline your car rental operations with real-time tracking, seamless booking workflows, and advanced financial analytics. Built for modern enterprises.
                    </motion.p>
                    <motion.div className="hero-actions" variants={itemVariants}>
                        {user ? (
                            <Link to="/dashboard" className="btn btn-primary hero-btn glass-glow">Launch Dashboard</Link>
                        ) : (
                            <Link to="/login" className="btn btn-primary hero-btn glass-glow">Get Started</Link>
                        )}
                        <a href="#features" className="btn btn-outline hero-btn mobile-touch-target">Explore Features</a>
                    </motion.div>
                </motion.section>

                <section id="features" className="features-section">
                    <motion.div 
                        className="feature-grid"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                    >
                        <motion.div className="feature-card glass-card" variants={cardVariants}>
                            <div className="feature-icon"><HiOutlineChartBar size={28} /></div>
                            <h3>Financial Intelligence</h3>
                            <p>Track outstanding debts, filter revenue by customizable date ranges, and monitor trust scores to mitigate renting risks.</p>
                        </motion.div>
                        <motion.div className="feature-card glass-card" variants={cardVariants}>
                            <div className="feature-icon"><HiOutlineTruck size={28} /></div>
                            <h3>Live Fleet Overview</h3>
                            <p>Instantly monitor which vehicles are rented, available, or undergoing maintenance. Sync fleet statuses globally.</p>
                        </motion.div>
                        <motion.div className="feature-card glass-card" variants={cardVariants}>
                            <div className="feature-icon"><HiOutlineUsers size={28} /></div>
                            <h3>Customer Profiles</h3>
                            <p>360-degree views of every renter. Manage KYC documents, rental history, and internal warning systems in one place.</p>
                        </motion.div>
                        <motion.div className="feature-card glass-card" variants={cardVariants}>
                            <div className="feature-icon"><HiOutlineDocumentCheck size={28} /></div>
                            <h3>Smart Bookings</h3>
                            <p>Prevent double configurations with automated conflict grids. Accurately handle advance bookings and partial deposits.</p>
                        </motion.div>
                    </motion.div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} MetricStack Systems. All Rights Reserved.</p>
            </footer>
        </div>
    );
}

