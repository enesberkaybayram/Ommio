2. Premium Ödeme Sistemi Nasıl Yapılır?

Bu işin en kritik ve "kurumsal" kısmıdır.

KURAL: Apple App Store ve Google Play Store, uygulama içindeki dijital özelliklerin (Premium üyelik gibi) satışı için kendi ödeme sistemlerini (In-App Purchase - IAP) kullanmanı zorunlu kılar.

Uygulama içine "Kredi Kartı Gir" veya "Stripe ile Öde" koyarsan uygulaman reddedilir.

Apple/Google her satıştan %15-%30 komisyon alır.

En Kolay Çözüm: RevenueCat In-App Purchase (IAP) kodlamak çok zordur (Sunucu doğrulama, makbuz okuma vs.). Bu yüzden sektör standardı RevenueCat kullanmaktır. Hem iOS hem Android'i tek bir kodla yönetirsin.

Adım Adım Yol Haritası:

Hesap Kurulumları:

RevenueCat hesabı aç.

Apple App Store Connect'te "Agreements, Tax, and Banking" bölümünü doldur (Banka hesabı girmezsen ödeme alamazsın).

Google Play Console'da ödeme profilini oluştur.

Paket Yükleme:

Bash
npx expo install react-native-purchases
App.json Ayarı (Eğer Expo kullanıyorsan): app.json dosyana şu plugin'i ekle:

JSON
"plugins": [
  ["react-native-purchases", { "googlePlayApiKey": "...", "iosApiKey": "..." }]
]
Kod Entegrasyonu:

Aşağıda, uygulamanın Premium satın alma ekranı için hazırladığım (RevenueCat mantığına uygun) örnek bir Paywall (Ödeme Duvarı) kodu var.

Bunu mevcut kodundaki "Premium'a Geç" butonuna bağlayacağız.

TypeScript
// --- GEREKLİ IMPORTLAR ---
import Purchases, { PurchasesPackage } from 'react-native-purchases';

// --- UYGULAMA BAŞLARKEN (useEffect içinde) ---
useEffect(() => {
    // RevenueCat'ten aldığın API Key'ler
    const setupPurchases = async () => {
        if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: "appl_Senin_RevenueCat_iOS_Keyin" });
        } else if (Platform.OS === 'android') {
            await Purchases.configure({ apiKey: "goog_Senin_RevenueCat_Android_Keyin" });
        }
        
        // Kullanıcının mevcut durumunu kontrol et (Daha önce almış mı?)
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            if (customerInfo.entitlements.active['pro_uyelik']) {
                // Veritabanını güncelle (Eğer senkronize değilse)
                if (!isPremium) {
                    await setDoc(doc(db, "users", user.uid), { isPremium: true }, { merge: true });
                    setIsPremium(true);
                }
            }
        } catch (e) {
            console.log("Satın alma geçmişi alınamadı", e);
        }
    };
    
    setupPurchases();
}, []);


// --- SATIN ALMA FONKSİYONU ---
const handlePurchase = async () => {
    try {
        // 1. RevenueCat'ten paketleri çek
        const offerings = await Purchases.getOfferings();
        
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
            const packageToBuy = offerings.current.availablePackages[0]; // Genelde Aylık/Yıllık paket
            
            // 2. Satın alma işlemini başlat (Apple/Google popup'ı açılır)
            const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
            
            // 3. Başarılı oldu mu?
            if (customerInfo.entitlements.active['pro_uyelik']) { // 'pro_uyelik' RevenueCat'te tanımladığın isim
                
                // Firebase'e kaydet
                await setDoc(doc(db, "users", user.uid), { isPremium: true }, { merge: true });
                setIsPremium(true);
                
                Alert.alert("Teşekkürler!", "Premium üyelik başarıyla aktif edildi. Reklamlar kaldırıldı.");
            }
        }
    } catch (e: any) {
        if (!e.userCancelled) {
            Alert.alert("Hata", "Satın alma işlemi başarısız: " + e.message);
        }
    }
};
Özet: Şu an ne yapmalısın?

Henüz şirket/banka hesabı ayarlarını yapmadıysan ve uygulamayı sadece test ediyorsan, şu anki "Yalandan Satın Alma" butonun kalabilir.

Ancak uygulamayı mağazaya (App Store / Play Store) göndermeden önce:

RevenueCat'i kurman şart.

Web sürümü için ise Stripe kullanman gerekir (Çünkü Web'de Apple/Google zorunluluğu yoktur, komisyon daha azdır).

Eğer "Ben şimdilik sadece kodun çalışır halini göreyim, parayı sonra hallederim" diyorsan, mevcut kodundaki setIsPremium(true) yapan basit butonu kullanmaya devam et. Mağazaya yüklerken o butonu gerçek kodla değiştirirsin.