// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";
import { env } from "$env/dynamic/public";
import { browser } from "$app/environment";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = JSON.parse(
    env.PUBLIC_GOOGLE_FIREBASE_CONFIG
);

export const fireapp = () => {
    if (browser) {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        const analytics = getAnalytics(app);

        return {
            messaging, analytics
        }
    }
    throw new Error("YOUR PAGE IS NOT BROWSER");    
}