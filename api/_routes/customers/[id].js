import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    const { id } = req.query;
    if (!id) return sendError(res, 400, 'Customer ID is required');

    const customerRef = db.collection('customers').doc(id);

    if (req.method === 'GET') {
        try {
            const doc = await customerRef.get();
            if (!doc.exists) return sendError(res, 404, 'Customer not found');

            const customer = { id: doc.id, ...doc.data() };

            // Authorization
            if (user.role !== 'super_admin' && customer.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: You do not have access to this client profile');
            }

            // Compute 360 analytics
            const bookingsSnap = await db.collection('bookings')
                .where('customerId', '==', id)
                .get();

            const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const completed = bookings.filter(b => b.status === 'completed');

            const analytics = {
                totalRentals: completed.length,
                lifetimeValue: completed.reduce((sum, b) => sum + (b.totalCost || 0), 0),
                averageRentalDuration: 0,
                lateReturns: 0,
                damageIncidents: bookings.filter(b => b.incidentReported).length,
                preferredCarType: 'N/A',
            };

            // Average rental duration
            if (completed.length > 0) {
                const totalDays = completed.reduce((sum, b) => {
                    const start = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                    const end = new Date(b.actualEndDate?._seconds ? b.actualEndDate._seconds * 1000 : (b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate));
                    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                    return sum + Math.max(diffDays, 1);
                }, 0);
                analytics.averageRentalDuration = Math.round((totalDays / completed.length) * 10) / 10;
            }

            // Late returns
            analytics.lateReturns = completed.filter(b => {
                if (!b.actualEndDate) return false;
                const scheduled = new Date(b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate);
                const actual = new Date(b.actualEndDate?._seconds ? b.actualEndDate._seconds * 1000 : b.actualEndDate);
                return actual > scheduled;
            }).length;

            // Trust score calculation
            let trustScore = 70;
            trustScore += analytics.totalRentals * 5;
            trustScore += Math.min((analytics.lifetimeValue / 5000) * 2, 20);
            trustScore -= analytics.lateReturns * 10;
            trustScore -= analytics.damageIncidents * 40;
            analytics.calculatedTrustScore = Math.max(0, Math.min(100, trustScore));

            return sendSuccess(res, { ...customer, analytics });
        } catch (error) {
            console.error('Get customer error:', error);
            return sendError(res, 500, 'Failed to fetch customer');
        }
    }

    if (req.method === 'PUT') {
        try {
            const doc = await customerRef.get();
            if (!doc.exists) return sendError(res, 404, 'Customer not found');
            const currentCustomer = doc.data();

            // Authorization
            if (user.role !== 'super_admin' && currentCustomer.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: You do not have access to modify this client profile');
            }

            const updates = { ...req.body, updatedAt: new Date() };
            delete updates.id;
            delete updates.createdAt;
            if (updates.trustScore) updates.trustScore = Number(updates.trustScore);

            await customerRef.update(updates);
            const updated = await customerRef.get();
            return sendSuccess(res, { id: updated.id, ...updated.data() });
        } catch (error) {
            return sendError(res, 500, 'Failed to update customer');
        }
    }

    if (req.method === 'DELETE') {
        try {
            const doc = await customerRef.get();
            if (!doc.exists) return sendError(res, 404, 'Customer not found');
            const customer = doc.data();

            // Authorization
            if (user.role !== 'super_admin' && customer.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: You do not have access to delete this client profile');
            }

            await customerRef.delete();
            return sendSuccess(res, { message: 'Customer deleted' });
        } catch (error) {
            return sendError(res, 500, 'Failed to delete customer');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
