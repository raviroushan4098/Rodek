import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    if (req.method === 'GET') {
        try {
            const snapshot = await db.collection('customers').get();
            let customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Only super_admin sees all, admins see only their own
            if (user.role !== 'super_admin') {
                customers = customers.filter(c => c.userId === user.uid);
            }

            // Sort by createdAt desc
            customers.sort((a, b) => {
                const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
                const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

            return sendSuccess(res, customers);
        } catch (error) {
            console.error('Get customers error:', error);
            return sendError(res, 500, 'Failed to fetch customers');
        }
    }

    if (req.method === 'POST') {
        const { name, email, phone, licenseNumber, address, trustScore } = req.body;

        if (!name || !phone) {
            return sendError(res, 400, 'Name and phone are required');
        }

        try {
            const customerData = {
                name,
                email: email || '',
                phone,
                licenseNumber: licenseNumber || '',
                address: address || '',
                trustScore: Number(trustScore) || 70,
                idProofUrl: '',
                collegeIdUrl: '',
                agreementUrl: '',
                userId: user.uid,
                createdAt: new Date(),
            };

            const docRef = await db.collection('customers').add(customerData);
            return sendSuccess(res, { id: docRef.id, ...customerData }, 201);
        } catch (error) {
            console.error('Create customer error:', error);
            return sendError(res, 500, 'Failed to create customer');
        }
    }

    return sendError(res, 405, 'Method not allowed');
}
