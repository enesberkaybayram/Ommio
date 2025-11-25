import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';

// Firebase Konsolundan aldığın gerçek veriler:
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

let auth;

if (Platform.OS === 'web') {
  // Web ortamında 'browserLocalPersistence' kullanıyoruz
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} else {
  // Mobil (Android/iOS) ortamında 'AsyncStorage' kullanıyoruz
  // Hata riskine karşı try-catch bloğu ekledik
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (e) {
    // Eğer getReactNativePersistence bulunamazsa standart getAuth'a dön
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export { auth, db };
