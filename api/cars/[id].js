import { db } from '../_lib/firebase.js';
import { verifyAuth, requireRole, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    const { id } = req.query;
    if (!id) return sendError(res, 400, 'Car ID is required');

    const carRef = db.collection('cars').doc(id);

    if (req.method === 'GET') {
        try {
            const doc = await carRef.get();
            if (!doc.exists) return sendError(res, 404, 'Car not found');
            const data = doc.data();

            let creatorName = 'System';
            if (data.userId) {
                const userDoc = await db.collection('users').doc(data.userId).get();
                if (userDoc.exists) creatorName = userDoc.data().name || userDoc.data().email || 'Unknown';
            }

            return sendSuccess(res, { id: doc.id, ...data, creatorName });
        } catch (error) {
            return sendError(res, 500, 'Failed to fetch car');
        }
    }

    if (req.method === 'PUT') {
        try {
            const doc = await carRef.get();
            if (!doc.exists) return sendError(res, 404, 'Car not found');

            const updates = { ...req.body, updatedAt: new Date() };
            delete updates.id;
            delete updates.createdAt;

            if (updates.dailyRate) updates.dailyRate = Number(updates.dailyRate);
            if (updates.mileage) updates.mileage = Number(updates.mileage);
            if (updates.year) updates.year = Number(updates.year);

            await carRef.update(updates);
            const updated = await carRef.get();
            return sendSuccess(res, { id: updated.id, ...updated.data() });
        } catch (error) {
            console.error('Update car error:', error);
            return sendError(res, 500, 'Failed to update car');
        }
    }

    if (req.method === 'DELETE') {
        if (!requireRole(user, 'super_admin')) {
            return sendError(res, 403, 'Only super_admin can delete cars');
        }

        try {
            const doc = await carRef.get();
            if (!doc.exists) return sendError(res, 404, 'Car not found');
            await carRef.delete();
            return sendSuccess(res, { message: 'Car deleted' });
        } catch (error) {
            return sendError(res, 500, 'Failed to delete car');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
