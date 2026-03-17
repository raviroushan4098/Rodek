import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    if (req.method === 'GET') {
        try {
            const snapshot = await db.collection('cars').get();
            let cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Location-based filtering for non-super_admin
            if (user.role !== 'super_admin') {
                if (user.location) {
                    cars = cars.filter(c => c.location === user.location);
                } else {
                    // Safety: unconfigured admin only sees their own
                    cars = cars.filter(c => c.userId === user.uid);
                }
            }

            // 1. Fetch relevant bookings to compute live status
            const bookingsSnap = await db.collection('bookings')
                .where('status', 'in', ['active', 'pending'])
                .get();
            const allBookings = bookingsSnap.docs.map(d => ({ carId: d.data().carId, ...d.data() }));

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            // 2. Map Live Status
            const enrichedCars = cars.map(car => {
                if (car.status === 'maintenance') return car;

                const carBookings = allBookings.filter(b => b.carId === car.id);
                
                // Check if currently rented (active booking covering today)
                const isRented = carBookings.some(b => {
                    const start = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                    const end = new Date(b.endDate?._seconds ? b.endDate._seconds * 1000 : b.endDate);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    return b.status === 'active' && start <= now && end >= now;
                });

                if (isRented) return { ...car, status: 'rented' };

                // Check if upcoming (any pending booking, or active booking starting in future)
                const isUpcoming = carBookings.some(b => {
                    const start = new Date(b.startDate?._seconds ? b.startDate._seconds * 1000 : b.startDate);
                    start.setHours(0, 0, 0, 0);
                    return b.status === 'pending' || (b.status === 'active' && start > now);
                });

                if (isUpcoming) return { ...car, status: 'upcoming' };

                return { ...car, status: 'available' };
            });

            return sendSuccess(res, enrichedCars);
        } catch (error) {
            console.error('Get cars error:', error);
            return sendError(res, 500, 'Failed to fetch cars');
        }
    }

    if (req.method === 'POST') {
        const { make, model, year, plateNumber, category, status, dailyRate, imageUrl, location, transmission, fuelType, mileage } = req.body;

        if (!make || !model || !plateNumber) {
            return sendError(res, 400, 'Make, model, and plate number are required');
        }

        try {
            const carData = {
                make,
                model,
                year: year || new Date().getFullYear(),
                plateNumber,
                category: category || 'sedan',
                status: status || 'available',
                dailyRate: Number(dailyRate) || 0,
                imageUrl: imageUrl || '',
                location: location || user.location || '',
                transmission: transmission || 'manual',
                fuelType: fuelType || 'petrol',
                mileage: Number(mileage) || 0,
                userId: user.uid,
                createdAt: new Date(),
            };

            const docRef = await db.collection('cars').add(carData);
            return sendSuccess(res, { id: docRef.id, ...carData }, 201);
        } catch (error) {
            console.error('Create car error:', error);
            return sendError(res, 500, 'Failed to create car');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
