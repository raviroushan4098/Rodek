import { db, auth } from './firebase.js';

export async function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await auth.verifyIdToken(token);

        // Get user profile from Firestore
        const userDoc = await db.collection('users').doc(decoded.uid).get();
        if (!userDoc.exists) {
            return null;
        }

        return {
            uid: decoded.uid,
            email: decoded.email,
            ...userDoc.data(),
        };
    } catch (error) {
        console.error('Auth verification error:', error.message);
        return null;
    }
}

export function requireRole(user, role) {
    if (!user) return false;
    if (role === 'super_admin') return user.role === 'super_admin';
    return user.role === 'super_admin' || user.role === role;
}

export function sendError(res, status, message) {
    return res.status(status).json({ error: message });
}

export function sendSuccess(res, data, status = 200) {
    return res.status(status).json(data);
}
