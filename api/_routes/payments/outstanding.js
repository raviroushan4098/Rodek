import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    if (req.method === 'GET') {
        try {
            // 1. Fetch all bookings that are not cancelled
            // We consider 'active', 'rented', 'completed' as potentially having debt.
            const bookingsSnap = await db.collection('bookings').get();
            let bookings = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter out purely cancelled bookings
            bookings = bookings.filter(b => b.status !== 'cancelled');

            // 2. Fetch all successful payments
            const paymentsSnap = await db.collection('payments').get();
            const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 3. Calculate Outstanding per Booking
            const bookingDebtMap = {}; // bookingId -> debtAmount
            bookings.forEach(b => {
                const totalCost = Number(b.totalCost) || 0;

                // Find all payments for this booking
                const bookingPayments = payments.filter(p => p.bookingId === b.id);
                const totalPaid = bookingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

                const debt = totalCost - totalPaid;
                if (debt > 0) {
                    bookingDebtMap[b.id] = {
                        booking: b,
                        totalCost,
                        totalPaid,
                        debt,
                        payments: bookingPayments
                    };
                }
            });

            // 4. Group by Customer Account
            const accountsReceivableMap = {}; // customerId -> Grouped Data

            // To prevent N+1 queries for customers, let's fetch all customers first
            const customersSnap = await db.collection('customers').get();
            const allCustomers = {};
            customersSnap.docs.forEach(doc => {
                allCustomers[doc.id] = { id: doc.id, ...doc.data() };
            });

            // If an admin is requesting this, only show their own created customers
            let validCustomerIds = null;
            if (user.role !== 'super_admin') {
                validCustomerIds = new Set();
                Object.values(allCustomers).forEach(c => {
                    if (c.userId === user.uid) validCustomerIds.add(c.id);
                });
            }

            Object.values(bookingDebtMap).forEach(debtRecord => {
                const customerId = debtRecord.booking.customerId;
                if (!customerId) return;

                // Enforce admin isolation
                if (validCustomerIds && !validCustomerIds.has(customerId)) return;

                const customer = allCustomers[customerId];
                if (!customer) return;

                if (!accountsReceivableMap[customerId]) {
                    accountsReceivableMap[customerId] = {
                        customer: {
                            id: customer.id,
                            name: customer.name,
                            phone: customer.phone,
                            email: customer.email,
                            trustScore: customer.trustScore
                        },
                        totalOutstanding: 0,
                        unpaidBookings: []
                    };
                }

                accountsReceivableMap[customerId].totalOutstanding += debtRecord.debt;
                accountsReceivableMap[customerId].unpaidBookings.push(debtRecord);
            });

            // 5. Convert to array and sort by highest debt
            const results = Object.values(accountsReceivableMap).sort((a, b) => b.totalOutstanding - a.totalOutstanding);

            return sendSuccess(res, results);
        } catch (error) {
            console.error('Outstanding balances API Error:', error);
            return sendError(res, 500, 'Failed to calculate outstanding balances');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
