import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// --- GERÇEK UYGULAMA İÇİN (Development Build aldığında burayı aç) ---
// import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
// const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

export default function OmmioAdBanner({ isPremium }: { isPremium: boolean }) {
  // 1. Premium ise hiçbir şey gösterme
  if (isPremium) return null;

  // 2. WEB İSE -> Web'e özel geniş kutu göster (AdMob Web'de çalışmaz)
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={[styles.placeholder, styles.webPlaceholder]}>
          <Text style={styles.text}>Reklam Alanı (Web)</Text>
          <Text style={styles.subText}>Google AdSense entegrasyonu buraya yapılacak.</Text>
          {/* GERÇEK WEB REKLAMI İÇİN:
           Buraya Google AdSense scriptini veya iframe'ini koymalısınız.
           Örnek:
           <iframe 
             src="https://your-adsense-url..." 
             style={{border: 0, width: 320, height: 50}} 
           />
        */}
        </View>
      </View>
    );
  }

  // 3. MOBİL (EXPO GO / SİMÜLATÖR) İSE -> Küçük kutu göster
  // (Çünkü Expo Go'da 'react-native-google-mobile-ads' çalıştırırsan uygulama çöker)
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.text}>Reklam Alanı (Mobile)</Text>
        <Text style={styles.subText}>Expo Go modunda reklamlar görünmez.</Text>
      </View>
    </View>
  );

  // --- 4. GERÇEK MOBİL REKLAM KODU (BUILD SONRASI BU BLOĞU AÇACAKSIN) ---
  /*
  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
  */
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  placeholder: {
    width: 320,
    height: 50,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  // Web için daha geniş ve belirgin bir alan
  webPlaceholder: {
    width: '90%', 
    maxWidth: 728, // Standart Leaderboard reklam boyutu
    height: 90,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderStyle: 'solid'
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  subText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2
  }
});