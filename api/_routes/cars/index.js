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
            if (user.role !== 'super_admin' && user.location) {
                cars = cars.filter(c => c.location === user.location);
            }

            // Sort by createdAt desc
            cars.sort((a, b) => {
                const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
                const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

            return sendSuccess(res, cars);
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
