import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

// --- EKSİK OLAN IMPORT BURASIYDI ---
// Bu satırı eklemezseniz uygulama hata verir
import { registerWidgetTaskHandler } from 'react-native-android-widget';

// Bu kod dosyanın en üst seviyesinde (component dışında) olmalı
if (Platform.OS === 'android') {
    // @ts-ignore
    registerWidgetTaskHandler(() => {
        // Arka planda widget güncelleme mantığı (İleri seviye)
        // Şimdilik boş bırakabiliriz, uygulama açıkken güncellenmesi yeterli.
        return Promise.resolve();
    });
}

export const unstable_settings = { anchor: '(tabs)', };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <>
      <Head>
        {/* Favicon'u buradan manuel olarak çağırıyoruz */}
        <link rel="icon" href="/favicon.ico?v=2" />
      </Head>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </>
  );
}