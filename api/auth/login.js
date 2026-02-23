import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed');
    }

    const user = await verifyAuth(req);
    if (!user) {
        // First-time login: create user doc if it doesn't exist
        const authHeader = req.headers.authorization;
        if (!authHeader) return sendError(res, 401, 'Unauthorized');

        try {
            const { auth } = await import('../_lib/firebase.js');
            const token = authHeader.split('Bearer ')[1];
            const decoded = await auth.verifyIdToken(token);

            let userDoc = await db.collection('users').doc(decoded.uid).get();

            if (!userDoc.exists) {
                // Auto-create user profile on first login
                const userData = {
                    name: decoded.name || decoded.email.split('@')[0],
                    email: decoded.email,
                    role: 'admin',
                    location: '',
                    createdAt: new Date(),
                };
                await db.collection('users').doc(decoded.uid).set(userData);
                return sendSuccess(res, { uid: decoded.uid, ...userData });
            }

            return sendSuccess(res, { uid: decoded.uid, ...userDoc.data() });
        } catch (error) {
            return sendError(res, 401, 'Invalid token');
        }
    }

    return sendSuccess(res, user);
}
