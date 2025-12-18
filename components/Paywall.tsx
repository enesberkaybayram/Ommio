import { router } from 'expo-router'; // Sayfayı kapatmak için
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useUser } from '../app/_layout'; // 👈 Global State'i çekiyoruz

export default function Paywall() {
    const { setIsPremium } = useUser(); // Global durumu güncellemek için
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getOfferings = async () => {
            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                    setPackages(offerings.current.availablePackages);
                }
            } catch (e) {
                Alert.alert("Hata", "Fiyat bilgisi çekilemedi.");
            }
        };
        getOfferings();
    }, []);

    const handlePurchase = async (pack: PurchasesPackage) => {
        setLoading(true);
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            
            // Satın alma başarılı mı?
            if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
                setIsPremium(true); // 🚨 KRİTİK NOKTA: Uygulamayı Premium yap
                Alert.alert("Harika! 🚀", "Premium özelliklerin açıldı. Widgetlarını kontrol et!");
                router.back(); // Paywall'u kapat
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert("Hata", e.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const customerInfo = await Purchases.restorePurchases();
            if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
                setIsPremium(true);
                Alert.alert("Başarılı", "Üyeliğin geri yüklendi.");
                router.back();
            } else {
                Alert.alert("Bilgi", "Aktif bir abonelik bulunamadı.");
            }
        } catch (e: any) {
            Alert.alert("Hata", "Geri yükleme başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Ommio Premium ✨</Text>
            
            <View style={styles.features}>
                <Text style={styles.featureItem}>🔓 Kilitli Widgetları Aç</Text>
                <Text style={styles.featureItem}>🔥 Sınırsız Alışkanlık Takibi</Text>
                <Text style={styles.featureItem}>📈 Detaylı İstatistikler</Text>
            </View>

            {packages.length === 0 ? (
                <ActivityIndicator size="large" color="#6366f1" />
            ) : (
                packages.map((pack) => (
                    <TouchableOpacity
                        key={pack.identifier}
                        onPress={() => handlePurchase(pack)}
                        style={styles.buyButton}
                        disabled={loading}
                    >
                        <Text style={styles.buyButtonText}>
                            {pack.product.title} - {pack.product.priceString}
                        </Text>
                    </TouchableOpacity>
                ))
            )}

            <TouchableOpacity onPress={handleRestore} style={styles.restoreButton} disabled={loading}>
                <Text style={styles.restoreText}>Satın Alımları Geri Yükle</Text>
            </TouchableOpacity>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator color="#fff" size="large" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
    header: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 30, color: '#1e293b' },
    features: { marginBottom: 40, paddingHorizontal: 20 },
    featureItem: { fontSize: 16, marginBottom: 12, color: '#475569', fontWeight: '500' },
    buyButton: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center', shadowColor: "#6366f1", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    buyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    restoreButton: { marginTop: 20, alignSelf: 'center' },
    restoreText: { color: '#94a3b8', fontSize: 14, textDecorationLine: 'underline' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});