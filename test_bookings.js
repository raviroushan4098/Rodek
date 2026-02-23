import 'dotenv/config';
import { db } from './api/_lib/firebase.js';
async function run() {
    try {
        const b = await db.collection('bookings').orderBy('createdAt', 'desc').limit(5).get();
        console.log("Total docs:", b.docs.length);
        b.forEach(doc => console.log(doc.id, doc.data()));
    } catch (e) { console.error(e); }
}
run();
