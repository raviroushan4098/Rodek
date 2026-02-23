import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    if (req.method === 'GET') {
        try {
            const snap = await db.collection('bookings').get();
            let bookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Log total fetched before filtering
            console.log(`[API /bookings] Total fetched: ${bookings.length}. User uid: ${user.uid}, role: ${user.role}, loc: ${user.location}`);

            if (user.role !== 'super_admin') {
                if (user.role === 'admin' && user.location) {
                    // Admins see their own bookings AND bookings for cars at their location
                    const carsSnap = await db.collection('cars').where('location', '==', user.location).get();
                    const locationCarIds = carsSnap.docs.map(d => d.id);
                    bookings = bookings.filter(b => b.userId === user.uid || locationCarIds.includes(b.carId));
                } else {
                    // Regular users see only their own
                    bookings = bookings.filter(b => b.userId === user.uid);
                }
            }

            console.log(`[API /bookings] Returning ${bookings.length} bookings after filtering.`);

            bookings.sort((a, b) => {
                const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
                const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

            // Enrich with car and customer names
            const carIds = [...new Set(bookings.map(b => b.carId).filter(Boolean))];
            const customerIds = [...new Set(bookings.map(b => b.customerId).filter(Boolean))];

            const carMap = {};
            for (const cid of carIds) {
                const doc = await db.collection('cars').doc(cid).get();
                if (doc.exists) carMap[cid] = doc.data();
            }

            const customerMap = {};
            for (const cid of customerIds) {
                const doc = await db.collection('customers').doc(cid).get();
                if (doc.exists) customerMap[cid] = doc.data();
            }

            const enriched = bookings.map(b => ({
                ...b,
                car: carMap[b.carId] ? { make: carMap[b.carId].make, model: carMap[b.carId].model, plateNumber: carMap[b.carId].plateNumber } : null,
                customer: customerMap[b.customerId] ? { name: customerMap[b.customerId].name, phone: customerMap[b.customerId].phone } : null,
            }));

            return sendSuccess(res, enriched);
        } catch (error) {
            console.error('Get bookings error:', error);
            return sendError(res, 500, 'Failed to fetch bookings');
        }
    }

    if (req.method === 'POST') {
        const { customerId, carId, startDate, startTime, endDate, endTime, advancePayment, totalCost, discount, discountType, notes } = req.body;

        if (!customerId || !carId || !startDate || !endDate) {
            return sendError(res, 400, 'Customer, car, start date, and end date are required');
        }

        try {
            const bookingData = {
                customerId,
                carId,
                userId: user.uid,
                startDate: new Date(startDate),
                startTime: startTime || '10:00',
                endDate: new Date(endDate),
                endTime: endTime || '10:00',
                actualEndDate: null,
                actualEndTime: null,
                incidentReported: false,
                incidentDescription: '',
                discount: Number(discount) || 0,
                discountType: discountType || 'flat',
                advancePayment: Number(advancePayment) || 0,
                totalCost: Number(totalCost) || 0,
                status: 'pending',
                notes: notes || '',
                createdAt: new Date(),
            };

            // Calculate start/end dates for overlap check
            const reqStart = new Date(startDate);
            reqStart.setHours(0, 0, 0, 0);
            const reqEnd = new Date(endDate);
            reqEnd.setHours(0, 0, 0, 0);

            // Check for overlapping bookings
            const existingBookingsSnap = await db.collection('bookings')
                .where('carId', '==', carId)
                .where('status', 'in', ['active', 'pending'])
                .get();

            let hasOverlap = false;
            let conflictDetails = null;

            for (const doc of existingBookingsSnap.docs) {
                const b = doc.data();
                const bStart = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                bStart.setHours(0, 0, 0, 0);
                const bEnd = new Date(b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate);
                bEnd.setHours(0, 0, 0, 0);

                if (reqStart <= bEnd && reqEnd >= bStart) {
                    hasOverlap = true;
                    let conflictUser = 'Unknown Admin';
                    if (b.userId) {
                        const uDoc = await db.collection('users').doc(b.userId).get();
                        if (uDoc.exists) {
                            conflictUser = uDoc.data().name || uDoc.data().email || 'Admin';
                        }
                    }

                    conflictDetails = {
                        dates: `${bStart.toLocaleDateString('en-IN')} to ${bEnd.toLocaleDateString('en-IN')}`,
                        admin: conflictUser
                    };
                    break;
                }
            }

            if (hasOverlap) {
                return res.status(409).json({
                    error: 'Conflict',
                    code: 'DOUBLE_BOOKING',
                    details: conflictDetails
                });
            }

            // Update car status to rented if booking starts today or earlier
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            if (start <= now) {
                await db.collection('cars').doc(carId).update({ status: 'rented' });
                bookingData.status = 'active';
            }

            const docRef = await db.collection('bookings').add(bookingData);
            return sendSuccess(res, { id: docRef.id, ...bookingData }, 201);
        } catch (error) {
            console.error('Create booking error:', error);
            return sendError(res, 500, 'Failed to create booking');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
