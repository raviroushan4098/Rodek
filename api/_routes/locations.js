import { getFirestore } from 'firebase-admin/firestore';
import { verifyAuth, requireRole } from './_lib/auth.js';

const db = getFirestore();
const col = db.collection('locations');

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // GET — list all locations (any authenticated user)
    if (req.method === 'GET') {
        const snap = await col.orderBy('name').get();
        const locations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.json(locations);
    }

    // POST — create location (super_admin only)
    if (req.method === 'POST') {
        if (!requireRole(user, 'super_admin', res)) return;
        const { name } = req.body || {};
        if (!name || !name.trim()) return res.status(400).json({ error: 'Location name is required' });

        // Check for duplicates (case-insensitive)
        const existing = await col.where('name', '==', name.trim()).get();
        if (!existing.empty) return res.status(409).json({ error: 'Location already exists' });

        const doc = await col.add({
            name: name.trim(),
            createdAt: new Date().toISOString(),
            createdBy: user.uid,
        });
        return res.status(201).json({ id: doc.id, name: name.trim() });
    }

    // DELETE — remove location (super_admin only)
    if (req.method === 'DELETE') {
        if (!requireRole(user, 'super_admin', res)) return;
        const { id } = req.body || {};
        if (!id) return res.status(400).json({ error: 'Location ID is required' });

        await col.doc(id).delete();
        return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
