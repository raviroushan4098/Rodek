import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    const { id } = req.query;
    if (!id) return sendError(res, 400, 'Booking ID is required');

    const bookingRef = db.collection('bookings').doc(id);

    if (req.method === 'GET') {
        try {
            const doc = await bookingRef.get();
            if (!doc.exists) return sendError(res, 404, 'Booking not found');

            const booking = { id: doc.id, ...doc.data() };

            // Authorization: super_admin OR creator ONLY
            if (user.role !== 'super_admin' && booking.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: This booking detail is private to the creator');
            }

            // Enrich with car, customer, and payments
            if (booking.carId) {
                const carDoc = await db.collection('cars').doc(booking.carId).get();
                if (carDoc.exists) booking.car = { id: carDoc.id, ...carDoc.data() };
            }

            if (booking.customerId) {
                const custDoc = await db.collection('customers').doc(booking.customerId).get();
                if (custDoc.exists) booking.customer = { id: custDoc.id, ...custDoc.data() };
            }

            // Get payments for this booking
            const paymentsSnap = await db.collection('payments')
                .where('bookingId', '==', id)
                .get();
            booking.payments = paymentsSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const aT = a.createdAt?._seconds || a.createdAt?.seconds || 0;
                    const bT = b.createdAt?._seconds || b.createdAt?.seconds || 0;
                    return bT - aT;
                });

            // Compute payment status
            const paidAmount = booking.payments.reduce((sum, p) => sum + (p.amount || 0), 0) + (booking.advancePayment || 0);
            booking.paidAmount = paidAmount;
            booking.remainingBalance = (booking.totalCost || 0) - paidAmount;
            booking.paymentStatus = paidAmount <= 0 ? 'Unpaid' : paidAmount < booking.totalCost ? 'Partial' : 'Fully Paid';

            return sendSuccess(res, booking);
        } catch (error) {
            console.error('Get booking error:', error);
            return sendError(res, 500, 'Failed to fetch booking');
        }
    }

    if (req.method === 'PUT') {
        try {
            const doc = await bookingRef.get();
            if (!doc.exists) return sendError(res, 404, 'Booking not found');
            const currentBooking = doc.data();

            // Authorization: super_admin OR creator ONLY
            if (user.role !== 'super_admin' && currentBooking.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: You cannot modify this private booking');
            }

            const updates = { ...req.body, updatedAt: new Date() };
            delete updates.id;
            delete updates.createdAt;

            if (updates.totalCost) updates.totalCost = Number(updates.totalCost);
            if (updates.advancePayment) updates.advancePayment = Number(updates.advancePayment);
            if (updates.startDate) updates.startDate = new Date(updates.startDate);
            if (updates.endDate) updates.endDate = new Date(updates.endDate);
            if (updates.actualEndDate) updates.actualEndDate = new Date(updates.actualEndDate);

            // Overlap validation if dates or car are changing
            const checkStart = updates.startDate ? new Date(updates.startDate) : new Date(currentBooking.startDate?._seconds ? currentBooking.startDate._seconds * 1000 : currentBooking.startDate);
            const checkEnd = updates.endDate ? new Date(updates.endDate) : new Date(currentBooking.endDate?._seconds ? currentBooking.endDate._seconds * 1000 : currentBooking.endDate);
            const checkCarId = updates.carId || currentBooking.carId;
            const newStatus = updates.status || currentBooking.status;

            if (newStatus === 'active' || newStatus === 'pending') {
                checkStart.setHours(0, 0, 0, 0);
                checkEnd.setHours(0, 0, 0, 0);

                const existingBookingsSnap = await db.collection('bookings')
                    .where('carId', '==', checkCarId)
                    .where('status', 'in', ['active', 'pending'])
                    .get();

                let hasOverlap = false;
                let overlapDates = null;

                for (const existingDoc of existingBookingsSnap.docs) {
                    if (existingDoc.id === id) continue; // Skip current booking

                    const b = existingDoc.data();
                    const bStart = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                    bStart.setHours(0, 0, 0, 0);
                    const bEnd = new Date(b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate);
                    bEnd.setHours(0, 0, 0, 0);

                    if (checkStart <= bEnd && checkEnd >= bStart) {
                        hasOverlap = true;
                        overlapDates = `${bStart.toLocaleDateString('en-IN')} to ${bEnd.toLocaleDateString('en-IN')}`;
                        break;
                    }
                }

                if (hasOverlap) {
                    return sendError(res, 400, `Car is already booked. Conflicting reservation: ${overlapDates}`);
                }
            }

            // Handle optional payment recording during completion
            if (updates.paymentData) {
                const { amount, method, transactionReference, paymentDate } = updates.paymentData;
                if (amount > 0) {
                    const paymentData = {
                        bookingId: id,
                        userId: user.uid,
                        amount: Number(amount),
                        method: method || 'cash',
                        transactionReference: transactionReference || '',
                        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                        location: user.location || '',
                        createdAt: new Date(),
                    };
                    await db.collection('payments').add(paymentData);
                }
                delete updates.paymentData;
            }

            // If completing, set car back to available
            if (updates.status === 'completed') {
                if (currentBooking.carId) {
                    await db.collection('cars').doc(currentBooking.carId).update({ status: 'available' });
                }
            }

            await bookingRef.update(updates);
            const updated = await bookingRef.get();
            return sendSuccess(res, { id: updated.id, ...updated.data() });
        } catch (error) {
            console.error('Update booking error:', error);
            return sendError(res, 500, 'Failed to update booking');
        }
    }

    if (req.method === 'DELETE') {
        try {
            const doc = await bookingRef.get();
            if (!doc.exists) return sendError(res, 404, 'Booking not found');
            const booking = doc.data();

            // Authorization: super_admin OR creator ONLY
            if (user.role !== 'super_admin' && booking.userId !== user.uid) {
                return sendError(res, 403, 'Forbidden: You cannot delete this private booking');
            }

            // Set car back to available
            if (booking.carId && booking.status === 'active') {
                await db.collection('cars').doc(booking.carId).update({ status: 'available' });
            }

            await bookingRef.delete();
            return sendSuccess(res, { message: 'Booking deleted' });
        } catch (error) {
            return sendError(res, 500, 'Failed to delete booking');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
