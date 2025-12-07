import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  CheckCircle2,
  ChevronLeft,
  Mail,
  ShieldCheck
} from 'lucide-react-native';
import React from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { privacyData, SupportedLangs } from '../../constants/privacyContent';

// Ommio Renk Paleti (Index'ten alındı)
const COLORS = {
  primary: '#6366f1', 
  secondary: '#a5b4fc', 
  background: '#F8FAFC', 
  surface: '#ffffff',
  textDark: '#1e293b', 
  textLight: '#64748b',
  subText: '#94a3b8',
  success: '#10b981',
  quoteBg: '#eef2ff', // Alıntılar için açık mor
  codeBg: '#f1f5f9',
};

export default function PrivacyScreen() {
  const router = useRouter();
  const { lang } = useLocalSearchParams<{ lang: string }>();
  
  // Dil güvenliği
  const currentLang = (lang && privacyData[lang as SupportedLangs]) 
    ? (lang as SupportedLangs) 
    : 'en';

  const data = privacyData[currentLang];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. HEADER (Custom) */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ommio</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* 2. HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.iconRing}>
            <ShieldCheck size={48} color={COLORS.primary} fill={COLORS.quoteBg} />
          </View>
          <Text style={styles.pageTitle}>{data.title}</Text>
          
          <View style={styles.badge}>
            <CheckCircle2 size={12} color={COLORS.success} />
            <Text style={styles.badgeText}>{data.lastUpdated}</Text>
          </View>
        </View>

        {/* 3. MARKDOWN CONTENT CARD */}
        <View style={styles.contentCard}>
          <Markdown style={markdownStyles}>
            {data.content}
          </Markdown>
        </View>

        {/* 4. FOOTER / CONTACT */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {currentLang === 'tr' ? 'Sorularınız mı var?' : 'Questions?'}
          </Text>
          <TouchableOpacity 
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:info@ommio.app')}
          >
            <Mail size={16} color="#fff" />
            <Text style={styles.contactBtnText}>
               {currentLang === 'tr' ? 'İletişime Geç' : 'Contact Support'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ANA STİLLER ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  scrollContent: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 15,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.textDark,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  contactBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

// --- MARKDOWN STİLLERİ (Ommio Temasına Uygun) ---
const markdownStyles = StyleSheet.create({
  // Genel Metin
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.textLight,
    fontFamily: 'System', 
  },
  // Başlıklar (H1, H2, H3...)
  heading1: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 25,
    marginBottom: 10,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 8,
  },
  // Liste Öğeleri
  list_item: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  bullet_list_icon: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 20, // Nokta büyüklüğü
    color: COLORS.primary, // Ommio mor rengi
    fontWeight: '900',
  },
  ordered_list_icon: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  // Alıntılar (Quote) - Önemli notlar için
  blockquote: {
    backgroundColor: COLORS.quoteBg,
    borderColor: COLORS.primary,
    borderLeftWidth: 4,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginVertical: 10,
    borderRadius: 8,
  },
  // Kalın yazılar
  strong: {
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  // Linkler
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  // Kod blokları (Eğer teknik bir şey yazarsan)
  code_inline: {
    backgroundColor: COLORS.codeBg,
    padding: 4,
    borderRadius: 4,
    fontFamily: 'Courier',
    fontSize: 14,
    color: COLORS.textDark,
  },
});