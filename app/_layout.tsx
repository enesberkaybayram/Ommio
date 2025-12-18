import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import 'react-native-reanimated';

// Android Widget Handler
import { registerWidgetTaskHandler } from 'react-native-android-widget';

// ---------------------------------------------------------
// 1. GLOBAL VERİ ALANI
// ---------------------------------------------------------
interface UserContextType {
  isPremium: boolean;
  setIsPremium: (status: boolean) => void;
}

const UserContext = createContext<UserContextType>({
  isPremium: false,
  setIsPremium: () => {},
});

export const useUser = () => useContext(UserContext);

// ---------------------------------------------------------
// 2. ANDROID WIDGET KAYDI
// ---------------------------------------------------------
if (Platform.OS === 'android') {
    registerWidgetTaskHandler(async (props) => {
        return Promise.resolve();
    });
}

// API Anahtarlarınız
const API_KEY_IOS = "appl_FVIiiqWmMwTSBrzzmJEYvkLiTCn"; 
const API_KEY_ANDROID = "test_CCeaIBTLrhxUYhgkTdQcpZjFcLZ"; 

// Splash ekranını otomatik gizlemeyi durdur (Gerekli işlemler bitene kadar)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isPremium, setIsPremium] = useState(false);
  const colorScheme = useColorScheme();
  
  // ✅ FONT YÜKLEME KODU KALDIRILDI
  // Sadece uygulamanın hazır olduğunu belirtmek için bir state kullanabiliriz
  const [isReady, setIsReady] = useState(false);

  // RevenueCat ve Başlangıç İşlemleri
  useEffect(() => {
    const initApp = async () => {
        // 1. RevenueCat Ayarları
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        if (Platform.OS === 'ios') {
            Purchases.configure({ apiKey: API_KEY_IOS });
        } else if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: API_KEY_ANDROID });
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
                setIsPremium(true); 
                console.log("✅ Kullanıcı Premium");
            } else {
                setIsPremium(false);
                console.log("❌ Kullanıcı Ücretsiz");
            }
        } catch (e) {
            console.log("RevenueCat Hatası:", e);
        }

        // 2. İşlemler bitti, uygulamayı aç
        setIsReady(true);
        await SplashScreen.hideAsync();
    };

    initApp();
  }, []);

  if (!isReady) {
    return null; // Hazır olana kadar bekle
  }

  return (
    <UserContext.Provider value={{ isPremium, setIsPremium }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserContext.Provider>
  );
}

function useColorScheme() {
    return 'light'; 
}