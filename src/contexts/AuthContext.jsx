import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../config/firebase';

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
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                try {
                    const token = await firebaseUser.getIdToken();
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    const profile = await res.json();
                    setUserProfile(profile);
                } catch (e) {
                    console.error('Failed to fetch profile:', e);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = async (email, password) => {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return cred.user;
    };

    const logout = async () => {
        await signOut(firebaseAuth);
        setUser(null);
        setUserProfile(null);
    };

    const value = {
        user,
        userProfile,
        loading,
        login,
        logout,
        isAdmin: userProfile?.role === 'admin' || userProfile?.role === 'super_admin',
        isSuperAdmin: userProfile?.role === 'super_admin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
