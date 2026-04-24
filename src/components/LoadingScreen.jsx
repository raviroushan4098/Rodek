import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingScreen = ({ isReady }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        console.log('[LoadingScreen] Mounted');
        if (!isReady) {
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) return 100;
                    return prev + Math.random() * 15;
                });
            }, 100);
            return () => clearInterval(timer);
        } else {
            console.log('[LoadingScreen] System Ready');
            setProgress(100);
        }
    }, [isReady]);

    return (
        <AnimatePresence>
            {!isReady && (
                <motion.div
                    className="loading-screen"
                    initial={{ opacity: 1 }}
                    exit={{ 
                        opacity: 0,
                        backdropFilter: 'blur(0px)',
                        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                    }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        background: '#0a0e17',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {/* Animated Background Blobs */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                        <motion.div
                            animate={{
                                x: [0, 50, -50, 0],
                                y: [0, -30, 30, 0],
                                scale: [1, 1.2, 0.9, 1],
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            style={{
                                position: 'absolute',
                                top: '20%',
                                left: '15%',
                                width: '40vw',
                                height: '40vw',
                                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
                                filter: 'blur(60px)',
                            }}
                        />
                        <motion.div
                            animate={{
                                x: [0, -40, 40, 0],
                                y: [0, 50, -50, 0],
                                scale: [1, 0.8, 1.1, 1],
                            }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            style={{
                                position: 'absolute',
                                bottom: '15%',
                                right: '10%',
                                width: '50vw',
                                height: '50vw',
                                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                                filter: 'blur(80px)',
                            }}
                        />
                    </div>

                    {/* Geometric Morphing Logo */}
                    <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '2rem' }}>
                        <motion.div
                            initial={{ rotate: 0, scale: 0.8 }}
                            animate={{ 
                                rotate: 360,
                                scale: [0.8, 1.1, 0.8],
                                borderRadius: ["20%", "50%", "30%", "20%"]
                            }}
                            transition={{ 
                                duration: 4, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: '2px solid var(--accent)',
                                background: 'rgba(245, 158, 11, 0.1)',
                                boxShadow: '0 0 30px var(--accent-glow)'
                            }}
                        />
                        <motion.div
                            initial={{ rotate: 45, scale: 0.5 }}
                            animate={{ 
                                rotate: -315,
                                scale: [0.5, 0.8, 0.5],
                                borderRadius: ["30%", "20%", "50%", "30%"]
                            }}
                            transition={{ 
                                duration: 4, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                            style={{
                                position: 'absolute',
                                top: '10%',
                                left: '10%',
                                width: '80%',
                                height: '80%',
                                border: '2px solid var(--blue)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                boxShadow: '0 0 20px var(--blue-glow)'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '2rem',
                            fontWeight: '800',
                            color: 'white',
                            letterSpacing: '-1px'
                        }}>
                            MS
                        </div>
                    </div>

                    {/* Progress Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: '700', 
                            letterSpacing: '2px',
                            color: 'white',
                            marginBottom: '0.5rem'
                        }}>
                            {Math.round(progress)}%
                        </div>
                        <div style={{ 
                            fontSize: '0.9rem', 
                            color: 'var(--text-secondary)',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '4px'
                        }}>
                            System Initiating
                        </div>
                    </motion.div>

                    {/* Progress Bar Container */}
                    <div style={{
                        width: '200px',
                        height: '4px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '2px',
                        marginTop: '2rem',
                        overflow: 'hidden'
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                            style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--accent), var(--blue))',
                                boxShadow: '0 0 10px var(--accent-glow)'
                            }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingScreen;
