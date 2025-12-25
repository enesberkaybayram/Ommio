import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native'; // useColorScheme buradan çekildi
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import 'react-native-reanimated';
import { TRANSLATIONS } from '../constants/translations/index';

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

// Splash ekranını otomatik gizlemeyi durdur
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isPremium, setIsPremium] = useState(false);
  const colorScheme = useColorScheme();
  
  const [isReady, setIsReady] = useState(false);

  // RevenueCat ve Başlangıç İşlemleri
  useEffect(() => {
    const initApp = async () => {
        // 1. Web Kontrolü (BU SATIR ÇOK ÖNEMLİ - ÇÖKMEYİ ENGELLER)
        if (Platform.OS === 'web') {
            console.log("Web ortamı algılandı, RevenueCat başlatılmadı.");
            setIsReady(true);
            await SplashScreen.hideAsync();
            return; // Fonksiyondan çık, aşağıyı çalıştırma
        }

        // 2. RevenueCat Ayarları (Sadece Mobil için çalışır)
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        if (Platform.OS === 'ios') {
            Purchases.configure({ apiKey: API_KEY_IOS });
        } else if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: API_KEY_ANDROID });
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            if (typeof customerInfo.entitlements.active['Premium'] !== "undefined") {
                setIsPremium(true); 
                console.log("✅ Kullanıcı Premium");
            } else {
                setIsPremium(false);
                console.log("❌ Kullanıcı Ücretsiz");
            }
        } catch (e) {
            console.log("RevenueCat Hatası (Önemsiz):", e);
        }

        // 3. İşlemler bitti, uygulamayı aç
        setIsReady(true);
        await SplashScreen.hideAsync();
    };

    initApp();
  }, []);

  if (!isReady) {
    return null; // Hazır olana kadar bekle
  }
  
  const siteUrl = "https://ommio.app";

  // 👇 HATA BURADAYDI, DÜZELTİLDİ 👇
  // RootLayout içinde 'lang' state'i olmadığı için 'en' (İngilizce) varsayılan yaptık.
  // Bu sadece Google önizlemesi (meta tags) için geçerlidir, uygulama içi dil etkilenmez.
  const t = (key: string) => {
      // @ts-ignore
      return TRANSLATIONS['en']?.[key] || key; 
  };

  return (
    <UserContext.Provider value={{ isPremium, setIsPremium }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>

        {/* 👇 HEAD KISMI (WEB İÇİN) */}
        <Head>
          <title>Ommio</title>
          <meta property="og:title" content={t('onboard_step2_title')} />
          <meta property="og:description" content={t('onboard_step1_desc')} />
          
          {/* Link Paylaşım Görseli */}
          <meta property="og:image" content={`${siteUrl}/social-preview.png`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>
        
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