import { db } from './_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from './_lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    try {
        // 1. Total Cars & Maintenance
        const carsSnap = await db.collection('cars').get();
        let allCars = carsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (user.role !== 'super_admin' && user.location) {
            allCars = allCars.filter(c => c.location === user.location);
        }
        const totalCars = allCars.length;
        const carsInMaintenance = allCars.filter(c => c.status === 'maintenance').length;
        const locationCarIds = allCars.map(c => c.id);

        // 2. Bookings
        const bookingsSnap = await db.collection('bookings').get();
        let allBookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (user.role !== 'super_admin') {
            if (user.role === 'admin' && user.location) {
                allBookings = allBookings.filter(b => b.userId === user.uid || locationCarIds.includes(b.carId));
            } else {
                allBookings = allBookings.filter(b => b.userId === user.uid);
            }
        }
        const locationBookingIds = allBookings.map(b => b.id);
        const totalAdvance = allBookings.reduce((sum, b) => sum + (b.advancePayment || 0), 0);
        const activeRentals = allBookings.filter(b => b.status === 'active').length;

        // 3. Total Revenue (Payments)
        const paymentsSnap = await db.collection('payments').get();
        let paymentsData = paymentsSnap.docs.map(d => d.data());
        if (user.role !== 'super_admin') {
            if (user.role === 'admin' && user.location) {
                paymentsData = paymentsData.filter(p => p.userId === user.uid || (p.bookingId && locationBookingIds.includes(p.bookingId)));
            } else {
                paymentsData = paymentsData.filter(p => p.userId === user.uid);
            }
        }
        const totalPayments = paymentsData.reduce((sum, d) => sum + (d.amount || 0), 0);
        const totalRevenue = totalPayments + totalAdvance;

        // New Clients This Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const customersSnap = await db.collection('customers').get();
        let allCustomers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (user.role !== 'super_admin') {
            allCustomers = allCustomers.filter(c => c.userId === user.uid);
        }
        const newClients = allCustomers.filter(c => {
            const createdAt = c.createdAt;
            if (!createdAt) return false;
            const date = createdAt._seconds ? new Date(createdAt._seconds * 1000) : new Date(createdAt);
            return date >= startOfMonth;
        }).length;

        // Recent Bookings (last 5)
        const recentBookings = allBookings
            .sort((a, b) => {
                const aTime = a.createdAt?._seconds || 0;
                const bTime = b.createdAt?._seconds || 0;
                return bTime - aTime;
            })
            .slice(0, 5);

        // Enrich recent bookings
        const carMap = {};
        allCars.forEach(c => { carMap[c.id] = c; });
        const customerMap = {};
        customersSnap.docs.forEach(c => { customerMap[c.id] = c.data(); });

        const enrichedRecent = recentBookings.map(b => ({
            ...b,
            car: carMap[b.carId] ? { make: carMap[b.carId].make, model: carMap[b.carId].model } : null,
            customer: customerMap[b.customerId] ? { name: customerMap[b.customerId].name } : null,
        }));

        // Maintenance Cars
        const maintenanceCars = allCars.filter(c => c.status === 'maintenance').slice(0, 3);

        return sendSuccess(res, {
            totalRevenue,
            activeRentals,
            totalCars,
            carsInMaintenance,
            newClients,
            recentBookings: enrichedRecent,
            maintenanceCars,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return sendError(res, 500, 'Failed to fetch dashboard data');
    }
}
