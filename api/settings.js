import { db } from './_lib/firebase.js';
import { verifyAuth, requireRole, sendError, sendSuccess } from './_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');
    if (!requireRole(user, 'super_admin')) return sendError(res, 403, 'Forbidden');

    if (req.method === 'GET') {
        try {
            const snap = await db.collection('settings').get();
            const settings = snap.docs.map(doc => ({ key: doc.id, ...doc.data() }));
            return sendSuccess(res, settings);
        } catch (error) {
            return sendError(res, 500, 'Failed to fetch settings');
        }
    }

    if (req.method === 'POST') {
        const { settings } = req.body;
        if (!settings || !Array.isArray(settings)) {
            return sendError(res, 400, 'Settings array is required');
        }

        try {
            const batch = db.batch();
            settings.forEach(({ key, value, type, description }) => {
                const ref = db.collection('settings').doc(key);
                batch.set(ref, {
                    value: String(value),
                    type: type || 'string',
                    description: description || '',
                    updatedAt: new Date(),
                }, { merge: true });
            });
            await batch.commit();

            const snap = await db.collection('settings').get();
            const updated = snap.docs.map(doc => ({ key: doc.id, ...doc.data() }));
            return sendSuccess(res, updated);
        } catch (error) {
            return sendError(res, 500, 'Failed to update settings');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
