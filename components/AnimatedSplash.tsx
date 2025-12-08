import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Logonun yolu (Senin projendeki yol)
const LOGO_SOURCE = require('../assets/Logo/Icon.png'); 

interface Props {
  onAnimationFinish: () => void;
}

export default function AnimatedSplash({ onAnimationFinish }: Props) {
  const animation = useRef(new Animated.Value(0)).current;
  const [isAppReady, setAppReady] = useState(false);

  useEffect(() => {
    // 1. Native Splash'in otomatik kapanmasını engelle
    SplashScreen.preventAutoHideAsync();

    // 2. Hazırlık işlemleri (Font yükleme, API ön kontrolleri vb. burada yapılabilir)
    async function prepare() {
      try {
        // Yapay bir gecikme ekleyebiliriz veya assetleri yükleyebiliriz
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // 3. Uygulama hazır olduğunda Native Splash'i gizle
      SplashScreen.hideAsync().then(() => {
        // 4. React Native animasyonunu başlat
        startAnimation();
      });
    }
  }, [isAppReady]);

  const startAnimation = () => {
    Animated.sequence([
      // Aşamalı animasyon: Önce hafifçe küçül
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Sonra hızla büyü ve yok ol
      Animated.timing(animation, {
        toValue: 2,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 5. Animasyon bitti, ana uygulamayı göster
      onAnimationFinish();
    });
  };

  // İnterpolasyonlar
  const scale = animation.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 0.8, 10], // Normal -> Hafif Küçük -> Çok Büyük (Ekrandan taşar)
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1, 1.5, 2],
    outputRange: [1, 1, 0, 0], // Son aşamada görünmez ol
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={LOGO_SOURCE}
        style={[
          styles.logo,
          {
            transform: [{ scale }],
            opacity: opacity,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // app.json splash rengiyle AYNI olmalı
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150, // app.json splash görselindeki ikon boyutuyla uyumlu olmalı
    height: 150,
  },
});