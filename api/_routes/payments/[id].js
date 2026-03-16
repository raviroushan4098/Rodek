import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    const { id } = req.query;
    if (!id) return sendError(res, 400, 'Payment ID is required');

    const paymentRef = db.collection('payments').doc(id);

    if (req.method === 'GET') {
        try {
            const doc = await paymentRef.get();
            if (!doc.exists) return sendError(res, 404, 'Payment not found');
            const payment = doc.data();

            // Authorization
            if (user.role !== 'super_admin' && payment.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: You do not have access to this payment record');
            }

            return sendSuccess(res, { id: doc.id, ...payment });
        } catch (error) {
            return sendError(res, 500, 'Failed to fetch payment');
        }
    }

    if (req.method === 'PUT') {
        try {
            const doc = await paymentRef.get();
            if (!doc.exists) return sendError(res, 404, 'Payment not found');
            const currentPayment = doc.data();

            // Authorization
            if (user.role !== 'super_admin' && currentPayment.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: You do not have access to modify this payment record');
            }

            const updates = { ...req.body, updatedAt: new Date() };
            delete updates.id;
            if (updates.amount) updates.amount = Number(updates.amount);
            if (updates.paymentDate) updates.paymentDate = new Date(updates.paymentDate);
            await paymentRef.update(updates);
            const updated = await paymentRef.get();
            return sendSuccess(res, { id: updated.id, ...updated.data() });
        } catch (error) {
            return sendError(res, 500, 'Failed to update payment');
        }
    }

    if (req.method === 'DELETE') {
        try {
            const doc = await paymentRef.get();
            if (!doc.exists) return sendError(res, 404, 'Payment not found');
            const payment = doc.data();

            // Authorization
            if (user.role !== 'super_admin' && payment.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: You do not have access to delete this payment record');
            }

            await paymentRef.delete();
            return sendSuccess(res, { message: 'Payment deleted' });
        } catch (error) {
            return sendError(res, 500, 'Failed to delete payment');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
