import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    if (req.method === 'GET') {
        const { minimal, search } = req.query;
        try {
            const snapshot = await db.collection('customers').get();
            let customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (search) {
                const s = search.toLowerCase();
                customers = customers.filter(c => 
                    (c.name && c.name.toLowerCase().includes(s)) ||
                    (c.phone && c.phone.includes(s)) ||
                    (c.aadharNumber && c.aadharNumber.includes(s))
                );
            }

            if (minimal === 'true') {
                // Return minimal data for the booking dropdown (Global Registry)
                return sendSuccess(res, customers.map(c => ({
                    id: c.id,
                    name: c.name,
                    aadharNumber: c.aadharNumber || 'N/A',
                    phone: c.phone
                })));
            }

            // Only super_admin sees all, admins see only their own UNLESS searching
            if (user.role !== 'super_admin' && !search) {
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
        const { name, email, phone, aadharNumber, licenseNumber, address, trustScore, idProofUrl, collegeIdUrl, agreementUrl } = req.body;

        if (!name || !phone || !aadharNumber) {
            return sendError(res, 400, 'Name, phone, and Aadhar number are required');
        }

        const sanitizedAadhar = aadharNumber.replace(/\D/g, '');

        try {
            // Global check for Aadhar duplicate (Backup for frontend check)
            const duplicateSnap = await db.collection('customers').where('aadharNumber', '==', sanitizedAadhar).limit(1).get();
            if (!duplicateSnap.empty) {
                return sendError(res, 409, 'A customer with this Aadhar number already exists in the registry.');
            }

            const customerData = {
                name,
                email: email || '',
                phone,
                aadharNumber: sanitizedAadhar,
                licenseNumber: licenseNumber || '',
                address: address || '',
                trustScore: Number(trustScore) || 70,
                idProofUrl: idProofUrl || '',
                collegeIdUrl: collegeIdUrl || '',
                agreementUrl: agreementUrl || '',
                userId: user.uid,
                location: user.location || '',
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
