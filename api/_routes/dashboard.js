import { db } from './_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from './_lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    try {
        // 1. Total Cars & Maintenance (BRANCH-WIDE)
        const carsSnap = await db.collection('cars').get();
        let allCars = carsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Location Filter for Ops
        if (user.role !== 'super_admin') {
            const userLoc = user.location || '';
            if (userLoc) {
                allCars = allCars.filter(c => c.location === userLoc);
            } else {
                // Unconfigured admin sees nothing unless they created it (unlikely for cars, but safe)
                allCars = allCars.filter(c => c.userId === user.uid);
            }
        }
        
        const totalCars = allCars.length;
        const carsInMaintenance = allCars.filter(c => c.status === 'maintenance').length;
        const locationCarIds = allCars.map(c => c.id);

        // 2. Bookings (BRANCH-WIDE for Fleet coordination)
        const bookingsSnap = await db.collection('bookings').get();
        let allBookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        if (user.role !== 'super_admin') {
            const userLoc = user.location || '';
            if (userLoc) {
                // Any booking for a car at this location is visible to Co-Admins
                allBookings = allBookings.filter(b => b.userId === user.uid || locationCarIds.includes(b.carId));
            } else {
                allBookings = allBookings.filter(b => b.userId === user.uid);
            }
        }
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const activeRentals = allBookings.filter(b => {
            const start = b.startDate?._seconds ? new Date(b.startDate._seconds * 1000) : new Date(b.startDate);
            const end = b.endDate?._seconds ? new Date(b.endDate._seconds * 1000) : new Date(b.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return b.status === 'active' && start <= now && end >= now;
        }).length;

        // 3. Revenue (USER-PRIVATE)
        const paymentsSnap = await db.collection('payments').get();
        let paymentsData = paymentsSnap.docs.map(d => d.data());
        
        if (user.role !== 'super_admin') {
            // Financial data is STRICTLY private to the creator
            paymentsData = paymentsData.filter(p => p.userId === user.uid);
        }
        
        const totalPayments = paymentsData.reduce((sum, d) => sum + (d.amount || 0), 0);
        
        // Only count advance payments for the user's OWN bookings
        const userOwnBookings = allBookings.filter(b => b.userId === user.uid);
        const totalAdvance = userOwnBookings.reduce((sum, b) => sum + (b.advancePayment || 0), 0);
        
        const totalRevenue = totalPayments + totalAdvance;

        // 4. New Clients This Month (USER-PRIVATE)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const customersSnap = await db.collection('customers').get();
        let allCustomers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        if (user.role !== 'super_admin') {
            // Customer lists are private to the admin who onboarded them
            allCustomers = allCustomers.filter(c => c.userId === user.uid);
        }
        
        const newClients = allCustomers.filter(c => {
            const createdAt = c.createdAt;
            if (!createdAt) return false;
            const date = createdAt._seconds ? new Date(createdAt._seconds * 1000) : new Date(createdAt);
            return date >= startOfMonth;
        }).length;

        // Recent Bookings (BRANCH-WIDE to see what's happening at the branch)
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

        // Maintenance Cars (BRANCH-WIDE)
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
