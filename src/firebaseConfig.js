// Firebase exports for shared use across components
import { getApp, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Trim all env vars to prevent trailing newline/whitespace issues
const firebaseConfig = {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
    databaseURL: (import.meta.env.VITE_FIREBASE_DATABASE_URL || '').trim(),
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim()
};


// Initialize Firebase once
let app;
try {
    app = getApp();
} catch {
    app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const functions = getFunctions(app);
export default app;

// Firebase'in kendi e-posta aksiyon ayarlari.
// ARTIK KULLANILMIYOR: bu projede Firebase'in mail sablonlari kilitli
// ("Email template updates are currently unavailable for this project"),
// bu yuzden dogrulama ve sifre sifirlama maillerini Cloud Functions uzerinden
// kendimiz gonderiyoruz. Bkz. functions/authMail.js ve src/utils/authMail.js.
// Kilit kalkar da Firebase'in akisina donulurse diye kod burada duruyor.
export const AUTH_ACTION_SETTINGS = {
    url: 'https://wondiyo.com.tr/auth/action',
    handleCodeInApp: false,
};
