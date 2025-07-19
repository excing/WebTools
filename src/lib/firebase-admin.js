import admin from 'firebase-admin';
import { env } from "$env/dynamic/private";

export function initializeFirebaseAdmin() {
    const serviceAccount = JSON.parse(
        env.GOOGLE_FIREBASE_ADMIN_SERVICE_ACCOUNT
    );

    if (!admin.apps || !admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount), // Your service account JSON
        });
    }

}