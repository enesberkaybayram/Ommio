import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// -----------------------------------------------------------------------
// 🚨 AYARLAR BÖLÜMÜ
// -----------------------------------------------------------------------

// 1. GERÇEK REKLAM ID'NİZİ BURAYA YAZIN (AdMob Sitesinden aldığınız /'lı olan)

// const PRODUCTION_ID = 'ca-app-pub-2340385969287749/2487423264'; 

// 2. ID SEÇİM MANTIĞI:
// - __DEV__ true ise (Bilgisayarda kod yazıyorsanız): TEST ID kullanır.
// - __DEV__ false ise (TestFlight veya App Store): GERÇEK ID kullanır.

// const adUnitId = __DEV__ ? TestIds.BANNER : PRODUCTION_ID;
const adUnitId = TestIds.BANNER;
// -----------------------------------------------------------------------

export default function OmmioAdBanner({ isPremium }: { isPremium: boolean }) {
  // Hata durumunu takip etmek için state (Opsiyonel, reklam yüklenmezse alanı gizler)
  const [adError, setAdError] = useState(false);

  // 1. KULLANICI PREMIUM İSE -> HİÇBİR ŞEY GÖSTERME
  if (isPremium) return null;

  // 2. WEB İSE -> ADSENSE YER TUTUCUSU GÖSTER
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webPlaceholder}>
          <Text style={styles.webText}>Reklam Alanı (Web)</Text>
          <Text style={styles.webSubText}>Google AdSense buraya gelecek.</Text>
        </View>
      </View>
    );
  }

  // 3. MOBİL (IOS / ANDROID) -> GERÇEK ADMOB REKLAMI
  return (
    <View style={styles.mobileContainer}>
      {/* Eğer hata aldıysak boş kutu gösterme, alanı gizle */}
      {!adError && (
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          // 👇 BU KISMI EKLEYİN
        onAdFailedToLoad={(error) => {
          // Reklam yüklenemezse hatayı ekrana bas
          Alert.alert(
            "AdMob ID Bulucu", 
            "Hata Mesajı: " + error.message
    );
  }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // --- MOBİL STİLLERİ ---
  mobileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
    // Arka plan rengi vermiyoruz, reklam şeffaf gelebilir.
  },

  // --- WEB STİLLERİ ---
  webContainer: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  webPlaceholder: {
    width: '90%', 
    maxWidth: 728,
    height: 90,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },
  webText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  webSubText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  }
});