import 'dotenv/config';
import { db } from './api/_lib/firebase.js';

async function run() {
    try {
        const snapshot = await db.collection('bookings').doc('70cnfsW8FFgNnR8eWHpC').get();
        console.log(JSON.stringify(snapshot.data(), null, 2));
    } catch(e) {
        console.error(e);
    }
}
run();
