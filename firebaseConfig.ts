import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  browserLocalPersistence,
  getAuth,
  initializeAuth
} from 'firebase/auth';
import { Firestore, getFirestore } from "firebase/firestore";
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

// Uygulama tipini belirttik
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Auth değişkenini 'Auth' tipiyle tanımlıyoruz
let auth: Auth;

if (Platform.OS === 'web') {
  // Web tarafında tarayıcı kalıcılığını kullanıyoruz.
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} else {
  // Mobil (Android/iOS) tarafı:
  // getAuth, React Native ortamını otomatik algılar ve AsyncStorage varsa kullanır.
  auth = getAuth(app);
}

// DB değişkenini 'Firestore' tipiyle tanımlıyoruz
const db: Firestore = getFirestore(app);

export { app, auth, db };
