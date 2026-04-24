import { db } from '../_lib/firebase.js';
import { sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

    const { token } = req.body;
    if (!token) return sendError(res, 400, 'Token is required');

    try {
        const inviteDoc = await db.collection('signature_invites').doc(token).get();
        if (!inviteDoc.exists) return sendError(res, 404, 'Agreement invitation not found or already processed');
        
        const invite = inviteDoc.data();
        const { bookingData, expiresAt } = invite;

        // Strict expiry check
        if (expiresAt) {
            const expiryDate = expiresAt._seconds ? new Date(expiresAt._seconds * 1000) : new Date(expiresAt);
            if (Date.now() > expiryDate.getTime()) {
                return sendError(res, 410, 'This invitation has expired. Please request a new link.');
            }
        }

        // Determine next status: active if start date is today or earlier, else pending
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const start = new Date(bookingData.startDate);
        start.setHours(0, 0, 0, 0);

        let finalStatus = 'pending';
        if (start <= now) {
            finalStatus = 'active';
            await db.collection('cars').doc(bookingData.carId).update({ status: 'rented' });
        }

        // officially create the booking now
        const bookingRecord = {
            ...bookingData,
            userId: invite.userId, // Maintain ownership from invitation to creation
            status: finalStatus,
            signedAt: new Date(),
            signerIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            signerUserAgent: req.headers['user-agent'],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection('bookings').add(bookingRecord);



        // Delete the temporary invitation
        await inviteDoc.ref.delete();

        return sendSuccess(res, { 
            message: 'Agreement signed successfully! Your booking is now officially confirmed.', 
            bookingId: docRef.id,
            status: finalStatus 
        });
    } catch (error) {
        console.error('Accept agreement error:', error);
        return sendError(res, 500, 'Failed to process agreement signature');
    }
}
