import { db, auth } from '../_lib/firebase.js';
import { verifyAuth, requireRole, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed');
    }

    const user = await verifyAuth(req);
    if (!user || !requireRole(user, 'super_admin')) {
        return sendError(res, 403, 'Forbidden — super_admin only');
    }

    const { name, email, password, role, location } = req.body;

    if (!name || !email || !password) {
        return sendError(res, 400, 'Name, email, and password are required');
    }

    try {
        // Create Firebase Auth user
        const newUser = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        // Create Firestore user doc
        const userData = {
            name,
            email,
            role: role || 'admin',
            location: location || '',
            createdAt: new Date(),
        };
        await db.collection('users').doc(newUser.uid).set(userData);

        return sendSuccess(res, { uid: newUser.uid, ...userData }, 201);
    } catch (error) {
        console.error('Register error:', error);
        return sendError(res, 400, error.message);
    }
}
