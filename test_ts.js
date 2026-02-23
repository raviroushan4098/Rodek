import { Timestamp } from 'firebase-admin/firestore';
const ts = Timestamp.now();
console.log("Raw object keys:", Object.keys(ts));
console.log("Stringified:", JSON.stringify(ts));
