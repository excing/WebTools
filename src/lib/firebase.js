// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { env } from "$env/dynamic/public";
import { browser } from "$app/environment";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = JSON.parse(
    env.PUBLIC_GOOGLE_FIREBASE_CONFIG
);

let app;
let analytics;
let messaging;
let auth;

export const fireapp = () => {
    if (browser) {
        if (!app) {
            // Initialize Firebase
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);

            // Initialize Messaging
            messaging = getMessaging(app);
        }

        return {
            app,
            messaging,
            analytics,
            auth
        }
    }
    throw new Error("YOUR PAGE IS NOT BROWSER");
}

// 异步初始化 Analytics
export const initAnalytics = async () => {
    if (browser && !analytics && app) {
        try {
            if (await isSupported()) {
                analytics = getAnalytics(app);
                console.log("Analytics initialized");
            }
        } catch (error) {
            console.error("Failed to initialize Analytics:", error);
        }
    }
    return analytics;
}