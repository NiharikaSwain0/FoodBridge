import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log config for debugging (Safe: doesn't show secret keys in production build usually)
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing! Check your .env file and RESTART your dev server.");
}

let app;
let auth;
let db;
let storage;
let googleProvider;
let messaging = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();

  if (typeof window !== 'undefined') {
    try {
      messaging = getMessaging(app);
    } catch (e) {
      console.warn("Firebase Messaging not supported", e);
    }
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db, storage, googleProvider, messaging };
export default app;
