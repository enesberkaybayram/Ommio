import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

const LOGO_SOURCE = require('../assets/Logo/Icon.png'); 

// RENGİNİZ (app.json ile AYNI olmalı: #6366F1)
const APP_BG_COLOR = '#6366F1'; 

interface Props {
  onAnimationFinish: () => void;
}

export default function AnimatedSplash({ onAnimationFinish }: Props) {
  // Animasyon Değerleri
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(new Animated.Value(1)).current; // Patlama için
  
  // Cam Animasyonları
  const glassScale = useRef(new Animated.Value(0)).current; 
  const glassRotate = useRef(new Animated.Value(0)).current;

  // Yazı Animasyonları
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current; // Alttan yukarı gelecek

  const [isAppReady, setAppReady] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    async function prepare() {
      try {
        // Yükleme simülasyonu
        await new Promise(resolve => setTimeout(resolve, 1500));
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
      SplashScreen.hideAsync().then(() => {
        startAnimations();
      });
    }
  }, [isAppReady]);

  const startAnimations = () => {
    Animated.sequence([
      // 1. GİRİŞ: Cam Logo ve Yazı Geliyor
      Animated.parallel([
        // Camın gelişi
        Animated.timing(glassScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.elastic(1.1)), 
        }),
        Animated.timing(glassRotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Yazının gelişi (Hafif gecikmeli)
        Animated.sequence([
          Animated.delay(200), // Logo belirmeye başladıktan hemen sonra
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(textTranslate, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
              easing: Easing.out(Easing.back(1.5)),
            }),
          ])
        ])
      ]),
      
      // 2. BEKLEME
      Animated.delay(400),

      // 3. ÇIKIŞ: Yazı gider, Logo patlar
      Animated.sequence([
        // Yazıyı hemen yok et (Patlamaya karışmasın)
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        // Hazırlık (Küçülme)
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        // PATLAMA
        Animated.parallel([
          Animated.timing(scaleValue, {
            toValue: 50, // Ekranı kapla
            duration: 500,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          }),
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 200,
            delay: 100,
            useNativeDriver: true,
          })
        ])
      ])
    ]).start(() => {
      onAnimationFinish();
    });
  };

  const spin = glassRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-45deg', '0deg']
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={APP_BG_COLOR} />
      
      {/* CAM LOGO KUTUSU */}
      <Animated.View
        style={[
          styles.glassContainer,
          {
            transform: [
              { scale: Animated.multiply(glassScale, scaleValue) }, 
              { rotate: spin }
            ]
          }
        ]}
      >
        <View style={styles.shine} />
        <Animated.Image
          source={LOGO_SOURCE}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* METİN ALANI (Cam kutudan bağımsız, altında duruyor) */}
      <Animated.View 
        style={{ 
          opacity: textOpacity,
          transform: [{ translateY: textTranslate }],
          position: 'absolute', // Pozisyonu sabitlemek için
          bottom: '35%', // Ekranın biraz altında
        }}
      >
        <Text style={styles.brandText}>Ommio</Text>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: APP_BG_COLOR, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glassContainer: {
    // BOYUTLARI KÜÇÜLTTÜM (Eskisi 160'tı)
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderRadius: 36, // Orantılı olarak biraz kıstım
    alignItems: 'center',
    justifyContent: 'center',
    
    // Glassmorphism Çerçeve
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)', 
    borderTopColor: 'rgba(255, 255, 255, 0.6)', 
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    
    // Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    
    // Konumlandırma (Merkezden biraz yukarı alalım ki yazıya yer kalsın)
    marginBottom: 40, 
  },
  logo: {
    width: 120, // Kutu küçüldüğü için logo da orantılı küçüldü
    height: 120,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 28, // Okunaklı ve büyük
    fontWeight: '700', // Kalın font
    letterSpacing: 1.5, // Harf aralığı modern hava katar
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Varsa özel fontunu buraya yaz
    textShadowColor: 'rgba(0, 0, 0, 0.1)', // Hafif gölge okunabilirliği artırır
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  }
});