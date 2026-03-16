import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    if (req.method === 'GET') {
        try {
            const snap = await db.collection('payments').get();
            let payments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (user.role !== 'super_admin') {
                payments = payments.filter(p => p.userId === user.uid);
            }

            payments.sort((a, b) => {
                const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
                const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

            return sendSuccess(res, payments);
        } catch (error) {
            console.error('Get payments error:', error);
            return sendError(res, 500, 'Failed to fetch payments');
        }
    }

    if (req.method === 'POST') {
        const { bookingId, amount, method, transactionReference, paymentDate } = req.body;

        if (!bookingId || !amount) {
            return sendError(res, 400, 'Booking ID and amount are required');
        }

        try {
            const paymentData = {
                bookingId,
                userId: user.uid,
                amount: Number(amount),
                method: method || 'cash',
                transactionReference: transactionReference || '',
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                location: user.location || '',
                createdAt: new Date(),
            };

            const docRef = await db.collection('payments').add(paymentData);
            return sendSuccess(res, { id: docRef.id, ...paymentData }, 201);
        } catch (error) {
            console.error('Create payment error:', error);
            return sendError(res, 500, 'Failed to create payment');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
