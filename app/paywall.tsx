import { router } from 'expo-router';
import { View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useUser } from './_layout'; // Global Context

export default function PaywallScreen() {
  const { setIsPremium } = useUser();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <RevenueCatUI.Paywall 
        // 👇 BU SATIR SİHİRLİDİR:
        // RevenueCat panelindeki 'Default' offering'e bağlı tasarımı otomatik çeker.
        
        onPurchaseCompleted={({ customerInfo }) => {
          console.log("Satın alma başarılı!", customerInfo);
          setIsPremium(true); // Uygulamayı premium yap
          router.back();      // Ekranı kapat
        }}
        
        onRestoreCompleted={({ customerInfo }) => {
           console.log("Geri yüklendi!", customerInfo);
           // 'premium' -> RevenueCat panelindeki Entitlement ID'niz
           if (customerInfo.entitlements.active['premium']) { 
             setIsPremium(true);
             router.back();
           }
        }}
        
        options={{
            displayCloseButton: true // Sağ/Sol üstte kapatma çarpısı çıkar
        }}
      />
    </View>
  );
}