import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../config/firebase';
import { useData } from './DataContext';

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

async function getToken() {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return user.getIdToken();
}

export async function apiFetch(path, options = {}) {
    const token = await getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };
    const res = await fetch(path, { ...options, headers });

    let data;
    try {
        data = await res.json();
    } catch {
        data = { error: 'Invalid server response' };
    }

    if (!res.ok) {
        const err = new Error(data.error || 'API error');
        err.status = res.status;
        err.code = data.code;
        err.details = data.details;
        throw err;
    }
    return data;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(() => {
        try {
            const cached = localStorage.getItem('metricstack_user_profile');
            return cached ? JSON.parse(cached) : null;
        } catch (err) {
            console.warn('Failed to parse cached profile:', err);
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
            setUser(firebaseUser);
            
            if (firebaseUser) {
                // OPTIMISTIC RENDER: If we have a cached profile, allow UI to show immediately
                if (userProfile) {
                    setLoading(false);
                }

                try {
                    const token = await firebaseUser.getIdToken();
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    
                    if (!res.ok) throw new Error('Refresh failed');
                    
                    const profile = await res.json();
                    
                    // DEEP COMPARISON GUARD: Only update state if data is ACTUALLY different
                    // This prevents the "Ripple Effect" re-render of the entire app
                    const currentStr = JSON.stringify(userProfile);
                    const newStr = JSON.stringify(profile);
                    
                    if (currentStr !== newStr) {
                        setUserProfile(profile);
                        localStorage.setItem('metricstack_user_profile', newStr);
                    }
                } catch (e) {
                    console.error('Background revalidation failed:', e);
                    if (!userProfile) setUserProfile(null);
                } finally {
                    setLoading(false);
                }
            } else {
                setUserProfile(null);
                localStorage.removeItem('metricstack_user_profile');
                setLoading(false);
            }
        });
        return unsub;
    }, []);

    const login = async (email, password) => {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return cred.user;
    };

    const { clearCache } = useData();

    const logout = async () => {
        await signOut(firebaseAuth);
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('metricstack_user_profile');
        clearCache();
    };

    const value = useMemo(() => ({
        user,
        userProfile,
        loading,
        login,
        logout,
        isAdmin: userProfile?.role === 'admin' || userProfile?.role === 'super_admin',
        isSuperAdmin: userProfile?.role === 'super_admin',
    }), [user, userProfile, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
