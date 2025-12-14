// firebaseConfig.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import {
  Auth, browserLocalPersistence,
  // @ts-ignore
  getReactNativePersistence, initializeAuth
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCKClbJrNCzTgNPsy9JcAMgmGpP1hQ1Ts4",
  authDomain: "ommio-30d72.firebaseapp.com",
  projectId: "ommio-30d72",
  storageBucket: "ommio-30d72.firebasestorage.app",
  messagingSenderId: "677937409612",
  appId: "1:677937409612:web:09e17f70f5e1a8904d0ee9",
  measurementId: "G-V7WP221WRP"
};

const app = initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === 'web') {
  auth = initializeAuth(app, { persistence: browserLocalPersistence });
} else {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const storage = getStorage(app);

export { app, auth, db, storage };
