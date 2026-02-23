import { db, auth } from './_lib/firebase.js';
import { verifyAuth, requireRole, sendError, sendSuccess } from './_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');
    if (!requireRole(user, 'super_admin')) return sendError(res, 403, 'Forbidden');

    if (req.method === 'GET') {
        try {
            const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
            const users = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            return sendSuccess(res, users);
        } catch (error) {
            return sendError(res, 500, 'Failed to fetch users');
        }
    }

    if (req.method === 'PUT') {
        const { uid, name, role, location } = req.body;
        if (!uid) return sendError(res, 400, 'User UID is required');

        try {
            const updates = {};
            if (name) updates.name = name;
            if (role) updates.role = role;
            if (location !== undefined) updates.location = location;
            updates.updatedAt = new Date();

            await db.collection('users').doc(uid).update(updates);

            // Update display name in Firebase Auth
            if (name) {
                await auth.updateUser(uid, { displayName: name });
            }

            const updated = await db.collection('users').doc(uid).get();
            return sendSuccess(res, { uid: updated.id, ...updated.data() });
        } catch (error) {
            return sendError(res, 500, 'Failed to update user');
        }
    }

    if (req.method === 'DELETE') {
        const { uid } = req.body;
        if (!uid) return sendError(res, 400, 'User UID is required');

        try {
            await auth.deleteUser(uid);
            await db.collection('users').doc(uid).delete();
            return sendSuccess(res, { message: 'User deleted' });
        } catch (error) {
            return sendError(res, 500, 'Failed to delete user');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
