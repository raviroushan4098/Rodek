import 'dotenv/config';
import { db } from './api/_lib/firebase.js';

async function check() {
    const users = await db.collection('users').get();
    console.log("Users in DB:");
    users.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.name || data.email} (${doc.id}): role=${data.role}, location=${data.location}`);
    });
}
check();
