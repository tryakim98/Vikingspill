/**
 * firebase.ts
 * Initialiserer Firebase-appen og Realtime Database (modulær v9+ API).
 * Konfigurasjonen leses fra .env (VITE_*-variabler) — se .env.example.
 */

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (import.meta.env.DEV && !firebaseConfig.apiKey) {
  console.warn('[firebase] Mangler VITE_FIREBASE_*-variabler i .env — kopier .env.example til .env og fyll inn verdiene.');
}

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
