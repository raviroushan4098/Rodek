import React, { useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Minimal Premium Loader (Transparent + Fast + Centered)
 */

const PageLoader = ({ message, source = "Unknown" }) => {
    useEffect(() => {
        const time = new Date().toLocaleTimeString();
        console.group(`[PageLoader] ${source} @ ${time}`);
        console.log(`Message: ${message || "No message"}`);
        console.count(`[Loader Counter: ${source}]`);
        console.groupEnd();
    }, [message, source]);

    return (
        <div style={styles.wrapper}>

            <div style={styles.loaderBox}>

                {/* RINGS */}
                <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>

                    {/* Background ring (very subtle) */}
                    <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="2"
                    />

                    {/* FAST ORANGE RING */}
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="#FF9A00"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="120 120"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} // 🔥 Faster
                        style={{
                            transformOrigin: "50% 50%",
                            filter: "drop-shadow(0 0 6px rgba(255,154,0,0.6))",
                        }}
                    />

                    {/* BLUE RING */}
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="120 120"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                        style={{
                            transformOrigin: "50% 50%",
                            filter: "drop-shadow(0 0 6px rgba(59,130,246,0.5))",
                        }}
                    />
                </svg>

                {/* CAR ICON */}
                <div style={styles.carWrap}>
                    <motion.svg
                        viewBox="0 0 120 50"
                        animate={{
                            opacity: [0.7, 1, 0.7],
                            scale: [1, 1.04, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{ width: "55px", height: "30px" }}
                    >
                        {/* Car Body */}
                        <path
                            d="M10 35 L20 25 C20 25 35 15 60 15 L85 15 C100 15 110 28 110 35 L110 42 L100 42 L100 38 C100 34 95 32 90 32 C85 32 80 34 80 38 L80 42 L40 42 L40 38 C40 34 35 32 30 32 C25 32 20 34 20 38 L20 42 L10 42 Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            style={{
                                filter: "drop-shadow(0 0 3px rgba(255,255,255,0.3))",
                            }}
                        />

                        {/* Roof Accent */}
                        <path
                            d="M30 25 C40 18, 70 18, 85 25"
                            fill="none"
                            stroke="#FF9A00"
                            strokeWidth="2"
                            strokeLinecap="round"
                            style={{
                                filter: "drop-shadow(0 0 6px rgba(255,154,0,0.6))",
                            }}
                        />

                        {/* Wheels */}
                        <circle cx="30" cy="38" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                        <circle cx="90" cy="38" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                    </motion.svg>
                </div>
            </div>

            {/* Optional Text */}
            {message && <p style={styles.text}>{message}</p>}
        </div>
    );
};

export default PageLoader;



/* ================= STYLES ================= */

const styles = {
    wrapper: {
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none", // 🔥 doesn't block clicks if needed
        zIndex: 9999,
    },

    loaderBox: {
        position: "relative",
        width: "90px",
        height: "90px",
    },

    carWrap: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "#ffffff", // auto adapts (can override via parent)
    },

    text: {
        marginTop: "12px",
        fontSize: "13px",
        color: "#94A3B8",
    },
};