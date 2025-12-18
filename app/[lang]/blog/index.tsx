import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronLeft, Globe, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// Veri ve Çeviri dosyalarını import ediyoruz
import { LANGUAGES, TRANSLATIONS } from '../../../constants/translations';
import { allBlogPosts, SupportedLangs } from '../../../data/blog';

// Modern Renk Paleti
const COLORS = {
  primary: '#6366f1',
  primaryLight: '#e0e7ff', 
  background: '#F8FAFC',
  surface: '#ffffff',
  textDark: '#0f172a',
  textMedium: '#334155',
  subText: '#64748b',
  border: '#e2e8f0',
};

export default function BlogListScreen() {
  const router = useRouter();
  const { lang } = useLocalSearchParams<{ lang: string }>();
  const [isLangModalVisible, setLangModalVisible] = useState(false);
  
  // 1. Dil Belirleme (Varsayılan: en)
  const currentLang = (lang && allBlogPosts[lang as SupportedLangs]) ? (lang as SupportedLangs) : 'en';
  
  // 2. Çeviri Helper
  const t = (key: string) => {
    // @ts-ignore
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };
  
  // 3. Yazıları Çekme
  const posts = allBlogPosts[currentLang] || [];

  // 4. Dil Değiştirme Fonksiyonu
  const changeLanguage = (newLangCode: string) => {
    setLangModalVisible(false);
    // Sayfayı yeni dil koduyla değiştir (replace kullanarak geçmişi şişirmeyiz)
    router.replace(`/${newLangCode}/blog`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- MODERN HEADER BAŞLANGICI --- */}
      <View style={styles.modernHeader}>
        {/* Sol: Geri Butonu */}
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.iconButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <ChevronLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>

        {/* Orta: Logo ve Marka İsmi */}
        <TouchableOpacity 
          style={styles.brandContainer}
          activeOpacity={0.7}
          // router.replace('/') geçmişi sıfırlayarak ana sayfaya döner.
          // Eğer geri dönülebilir olsun isterseniz router.push('/') kullanın.
          onPress={() => router.replace('/')} 
      >
          <Image 
              source={require('../../../assets/Logo/Logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
          />
          <View style={styles.verticalDivider} />
          <Text style={styles.brandText}>{t('blog_header')}</Text>
      </TouchableOpacity>

        {/* Sağ: Dil Seçimi */}
        <TouchableOpacity 
            style={styles.langButton}
            onPress={() => setLangModalVisible(true)}
        >
            <Globe size={20} color={COLORS.textDark} />
            <Text style={styles.langButtonText}>{currentLang.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      {/* --- MODERN HEADER BİTİŞİ --- */}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sayfa Başlığı Alanı */}
        <View style={styles.heroSection}>
            <Text style={styles.pageTitle}>{t('latest_articles')}</Text>
            <Text style={styles.pageSubtitle}>
                {currentLang === 'tr' 
                    ? 'Ommio ekibinden güncel haberler, ipuçları ve rehberler.' 
                    : 'Latest news, tips and guides from the Ommio team.'}
            </Text>
        </View>

        {/* Blog Kartları */}
        {posts.map((post) => (
          <TouchableOpacity 
            key={post.slug}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/${currentLang}/blog/${post.slug}`)}
          >
            <View style={styles.cardAccent} />
            
            <View style={styles.cardContent}>
                <View style={styles.dateBadge}>
                    <CalendarDays size={12} color={COLORS.primary} />
                    <Text style={styles.dateText}>{post.date}</Text>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postSummary} numberOfLines={3}>{post.summary}</Text>
                
                <View style={styles.cardFooter}>
                    <Text style={styles.readMoreText}>{t('read_more')}</Text>
                    <View style={styles.arrowCircle}>
                        <ArrowRight size={14} color="#fff" />
                    </View>
                </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Boş Durum */}
        {posts.length === 0 && (
            <View style={styles.emptyState}>
                <BookOpen size={48} color={COLORS.subText} style={{opacity: 0.5}} />
                <Text style={styles.emptyText}>{t('no_posts')}</Text>
            </View>
        )}
        
        <View style={{height: 40}} />
      </ScrollView>

      {/* --- DİL SEÇİM MODALI --- */}
      <Modal visible={isLangModalVisible} transparent animationType="fade">
        <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setLangModalVisible(false)}
        >
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('language')}</Text>
                    <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                        <X size={24} color={COLORS.subText} />
                    </TouchableOpacity>
                </View>
                
                <FlatList 
                    data={LANGUAGES}
                    keyExtractor={(item) => item.code}
                    renderItem={({item}) => (
                        <TouchableOpacity 
                            style={[
                                styles.langOption, 
                                currentLang === item.code && styles.langOptionActive
                            ]}
                            onPress={() => changeLanguage(item.code)}
                        >
                            <Text style={{fontSize: 24, marginRight: 10}}>{item.flag}</Text>
                            <Text style={[
                                styles.langOptionText,
                                currentLang === item.code && { color: COLORS.primary, fontWeight: 'bold' }
                            ]}>
                                {item.label}
                            </Text>
                            {currentLang === item.code && (
                                <Check size={20} color={COLORS.primary} style={{marginLeft: 'auto'}} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // --- YENİ HEADER STİLLERİ ---
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    // Hafif gölge
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    zIndex: 10,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80, // Logonuzun boyutuna göre ayarlayın
    height: 30,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: 0.5,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  // --- İÇERİK ---
  content: { padding: 20 },
  
  heroSection: { marginBottom: 30, marginTop: 10 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5, marginBottom: 8 },
  pageSubtitle: { fontSize: 16, color: COLORS.subText, lineHeight: 24 },

  // --- KART TASARIMI ---
  card: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 20, 
    marginBottom: 20, 
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4
  },
  cardAccent: { width: 6, backgroundColor: COLORS.primary },
  cardContent: { flex: 1, padding: 20, gap: 10 },
  
  dateBadge: { 
    alignSelf: 'flex-start',
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: COLORS.primaryLight, 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    borderRadius: 12 
  },
  dateText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  postTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark, lineHeight: 28 },
  postSummary: { fontSize: 15, color: COLORS.subText, lineHeight: 22 },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  readMoreText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  arrowCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 15 },
  emptyText: { color: COLORS.subText, fontSize: 16, fontWeight: '500' },

  // --- MODAL STİLLERİ ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000", shadowOffset: {width:0, height:10}, shadowOpacity:0.25, shadowRadius:20, elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 15
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  langOptionActive: {
    backgroundColor: COLORS.primaryLight + '50', // Şeffaf arka plan
    borderRadius: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
  },
  langOptionText: { fontSize: 16, color: COLORS.textMedium }
});