import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

    const { aadhar } = req.query;
    if (!aadhar) return sendError(res, 400, 'Aadhar number is required');

    const sanitized = aadhar.replace(/\D/g, '');

    try {
        // Search across ALL branches for this Aadhar
        const snap = await db.collection('customers').where('aadharNumber', '==', sanitized).limit(1).get();

        if (snap.empty) {
            return sendSuccess(res, { exists: false });
        }

        const customer = snap.docs[0].data();
        const ownerDoc = await db.collection('users').doc(customer.userId).get();
        const branchName = ownerDoc.exists ? (ownerDoc.data().location || 'Unknown Branch') : 'Unknown Branch';

        return sendSuccess(res, {
            exists: true,
            customer: {
                name: customer.name,
                branch: branchName,
                trustScore: customer.trustScore || 70
            }
        });
    } catch (error) {
        console.error('Verify Aadhar error:', error);
        return sendError(res, 500, 'Failed to verify Aadhar');
    }
}
