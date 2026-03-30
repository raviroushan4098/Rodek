import { db } from '../_lib/firebase.js';
import { sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

    const { token } = req.query;
    if (!token) return sendError(res, 400, 'Token is required');

    try {
        const inviteDoc = await db.collection('signature_invites').doc(token).get();
        if (!inviteDoc.exists) return sendError(res, 404, 'Agreement invitation not found');
        
        const invite = inviteDoc.data();
        const { bookingData, expiresAt } = invite;

        // Strict expiry check
        if (expiresAt) {
            const expiryDate = expiresAt._seconds ? new Date(expiresAt._seconds * 1000) : new Date(expiresAt);
            if (Date.now() > expiryDate.getTime()) {
                return sendError(res, 410, 'This invitation has expired (10-minute limit exceeded)');
            }
        }

        // Fetch car and customer for display
        const carDoc = await db.collection('cars').doc(bookingData.carId).get();
        const customerDoc = await db.collection('customers').doc(bookingData.customerId).get();

        const data = {
            id: token,
            startDate: bookingData.startDate,
            endDate: bookingData.endDate,
            expiresAt: expiresAt,
            car: carDoc.exists ? { make: carDoc.data().make, model: carDoc.data().model, plateNumber: carDoc.data().plateNumber } : null,
            customer: customerDoc.exists ? { name: customerDoc.data().name } : null
        };

        return sendSuccess(res, data);
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch agreement details');
    }
}
