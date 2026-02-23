import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
    }),
});
const db = getFirestore();

async function check() {
    const bSnap = await db.collection('bookings').get();
    console.log("Bookings:");
    bSnap.docs.forEach(d => {
        const b = d.data();
        console.log(`- ${d.id}: cost=${b.totalCost}, adv=${b.advancePayment}, dscnt=${b.discount} (${b.discountType}), customerId=${b.customerId}`);
    });
    const pSnap = await db.collection('payments').get();
    console.log("\nPayments:");
    pSnap.docs.forEach(d => {
        const p = d.data();
        console.log(`- ${d.id}: amount=${p.amount}, bookingId=${p.bookingId}`);
    });
    process.exit(0);
}
check();
