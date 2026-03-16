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

            // Authorization: super_admin OR same branch
            if (user.role !== 'super_admin' && data.location !== user.location) {
                return sendError(res, 403, 'Forbidden: You do not have access to vehicles from other branches');
            }

            // Live Status Calculation
            if (data.status !== 'maintenance') {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const bookingsSnap = await db.collection('bookings')
                    .where('carId', '==', id)
                    .where('status', 'in', ['pending', 'active'])
                    .get();
                
                const bookings = bookingsSnap.docs.map(d => d.data());
                
                const activeNow = bookings.find(b => {
                    const start = b.startDate?._seconds ? new Date(b.startDate._seconds * 1000) : new Date(b.startDate);
                    const end = b.endDate?._seconds ? new Date(b.endDate._seconds * 1000) : new Date(b.endDate);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    return start <= now && end >= now && b.status === 'active';
                });

                if (activeNow) {
                    data.status = 'rented';
                } else {
                    const hasUpcoming = bookings.find(b => {
                        const start = b.startDate?._seconds ? new Date(b.startDate._seconds * 1000) : new Date(b.startDate);
                        start.setHours(0, 0, 0, 0);
                        return start > now;
                    });
                    if (hasUpcoming) data.status = 'upcoming';
                    else data.status = 'available';
                }
            }

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
            const currentCar = doc.data();

            // Authorization
            if (user.role !== 'super_admin' && currentCar.location !== user.location) {
                return sendError(res, 403, 'Forbidden: You cannot modify vehicles from other branches');
            }

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
