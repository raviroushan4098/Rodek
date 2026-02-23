import 'dotenv/config';
import { db } from './api/_lib/firebase.js';

async function run() {
    try {
        const snapshot = await db.collection('bookings').get();
        console.log("Total bookings:", snapshot.docs.length);
        snapshot.docs.forEach(doc => {
            const b = doc.data();
            console.log(`ID: ${doc.id}, carId: ${b.carId}, status: ${b.status}, startDate: ${b.startDate?._seconds}, endDate: ${b.endDate?._seconds}`);
        });
    } catch(e) {
        console.error(e);
    }
}
run();
