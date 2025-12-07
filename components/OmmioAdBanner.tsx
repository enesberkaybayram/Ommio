import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// --- GEÇİCİ OLARAK BU SATIRLARI YORUMA AL ---
// import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

export default function OmmioAdBanner({ isPremium }: { isPremium: boolean }) {
  // Premium ise null döndür
  if (isPremium) return null;

  // --- EXPO GO İÇİN SAHTE REKLAM ALANI ---
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.text}>Reklam Alanı (Expo Go)</Text>
        <Text style={styles.subText}>Gerçek reklamlar Development Build'de görünür.</Text>
      </View>
    </View>
  );

  // --- GERÇEK KOD (İLERİDE BU KISMI AÇACAKSIN) ---
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
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  subText: {
    fontSize: 10,
    color: '#94a3b8',
  }
});