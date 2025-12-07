import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Calendar, Check, ChevronLeft, Globe, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Markdown from 'react-native-markdown-display';

// Veri ve Çeviri Dosyaları
import { LANGUAGES, TRANSLATIONS } from '../../../constants/translations';
import { allBlogPosts, SupportedLangs } from '../../../data/blog';

// --- SABİT DOMAIN (Bunu kendi domaininizle değiştirin) ---
const SITE_URL = "https://ommio.app"; 

const COLORS = {
  primary: '#6366f1',
  primaryLight: '#e0e7ff',
  background: '#F8FAFC',
  surface: '#ffffff',
  textDark: '#0f172a',
  textMedium: '#334155',
  subText: '#64748b',
  border: '#e2e8f0',
  codeBg: '#f1f5f9',
  quoteBg: '#eef2ff',
  quoteBorder: '#6366f1',
};

export default function BlogPostScreen() {
  const router = useRouter();
  const { lang, slug } = useLocalSearchParams<{ lang: string; slug: string }>();
  const [isLangModalVisible, setLangModalVisible] = useState(false);

  const currentLang = (lang && allBlogPosts[lang as SupportedLangs]) ? (lang as SupportedLangs) : 'en';
  
  const t = (key: string) => {
    // @ts-ignore
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const post = allBlogPosts[currentLang]?.find(p => p.slug === slug);

  const changeLanguage = (newLangCode: string) => {
    setLangModalVisible(false);
    router.replace(`/${newLangCode}/blog/${slug}`);
  };

  if (!post) {
    return (
      <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{color: COLORS.subText, fontSize: 16}}>{t('post_not_found')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}>
            <Text style={{color: COLORS.primary, fontWeight:'bold'}}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- SEO: STRUCTURED DATA (JSON-LD) ---
  // Google'ın yazıyı "NewsArticle" veya "BlogPosting" olarak anlamasını sağlar.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "image": post.image ? [post.image] : [`${SITE_URL}/assets/images/default-blog.jpg`],
    "datePublished": post.date, // Format: YYYY-MM-DD olmalı
    "dateModified": post.date,
    "author": [{
        "@type": "Organization", // veya "Person"
        "name": "Ommio Team",
        "url": SITE_URL
    }],
    "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${SITE_URL}/${currentLang}/blog/${slug}`
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      <Head>
        <title>{post.title} | Ommio Blog</title>
        <meta name="description" content={post.summary} />
        
        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.summary} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/${currentLang}/blog/${slug}`} />
        {post.image && <meta property="og:image" content={post.image} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.summary} />
        
        {/* Canonical URL (Çok Önemli: Kopya içerik cezasını engeller) */}
        <link rel="canonical" href={`${SITE_URL}/${currentLang}/blog/${slug}`} />
        
        {/* Alternate Languages (Google'a diğer dilleri bildirir) */}
        {LANGUAGES.map(l => (
             <link 
                key={l.code} 
                rel="alternate" 
                href={`${SITE_URL}/${l.code}/blog/${slug}`} 
                hrefLang={l.code} 
             />
        ))}

        {/* Structured Data Script */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Head>

      <Stack.Screen options={{ headerShown: false, title: post.title }} />

      {/* --- HEADER --- */}
      <View style={styles.modernHeader}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.iconButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <ChevronLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>

        {/* Semantic HTML: Web'de H1 olarak algılanması için accessibilityRole eklendi */}
        <TouchableOpacity 
                  style={styles.brandContainer}
                  activeOpacity={0.7}
                  onPress={() => router.replace('/')} 
                  accessibilityRole="header"
              >
                  <Image 
                      source={require('../../../assets/Logo/Logo.png')} 
                      style={styles.logoImage}
                      resizeMode="contain"
                  />
                  <View style={styles.verticalDivider} />
                  <Text style={styles.brandText}>Blog</Text>
              </TouchableOpacity>

        <TouchableOpacity 
            style={styles.langButton}
            onPress={() => setLangModalVisible(true)}
        >
            <Globe size={20} color={COLORS.textDark} />
            <Text style={styles.langButtonText}>{currentLang.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Semantic HTML: Main Article */}
      <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false} 
          // TypeScript hatasını önlemek için 'as any' ekliyoruz.
          // Expo Web bunu otomatik olarak HTML <main> etiketine çevirecektir.
          accessibilityRole={"main" as any} 
      >        
        <View style={styles.metaContainer}>
            <View style={styles.metaChip}>
                <Calendar size={14} color={COLORS.subText} />
                <Text style={styles.metaText}>{post.date}</Text>
            </View>
            <View style={[styles.metaChip, {borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '10'}]}>
                <User size={14} color={COLORS.primary} />
                <Text style={[styles.metaText, {color: COLORS.primary, fontWeight: '700'}]}>
                    {t('ommio_team')}
                </Text>
            </View>
        </View>

        {/* H1 Etiketi: Başlık H1 olmalıdır */}
        <Text style={styles.title} accessibilityRole="header" aria-level={1}>{post.title}</Text>

        <View style={styles.divider} />

        <View style={styles.markdownWrapper}>
            <Markdown style={markdownStyles}>
                {post.content}
            </Markdown>
        </View>
        
        <View style={styles.articleFooter}>
            <View style={styles.footerDot} />
            <View style={styles.footerDot} />
            <View style={styles.footerDot} />
        </View>

        <View style={{height: 60}} />
      </ScrollView>

      {/* MODAL KODLARI AYNI KALABİLİR */}
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

// ... generateStaticParams ve Styles kısımları aynen kalabilir ...
export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  const languages = Object.keys(allBlogPosts) as SupportedLangs[];
  languages.forEach((lang) => {
    allBlogPosts[lang].forEach((post) => {
      params.push({ lang: lang, slug: post.slug });
    });
  });
  return params;
}

const styles = StyleSheet.create({
    // ... mevcut stilleriniz
    container: { flex: 1, backgroundColor: COLORS.background },
    modernHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
        width: 80, 
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
    
      // --- CONTENT STYLES ---
      scrollContent: { padding: 24 },
    
      metaContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
      metaChip: { 
        flexDirection: 'row', alignItems: 'center', gap: 6, 
        backgroundColor: COLORS.surface, 
        paddingVertical: 6, paddingHorizontal: 12, 
        borderRadius: 20, 
        borderWidth: 1, borderColor: COLORS.border 
      },
      metaText: { fontSize: 12, color: COLORS.subText, fontWeight: '600' },
    
      title: { 
        fontSize: 28, 
        fontWeight: '900', 
        color: COLORS.textDark, 
        marginBottom: 20, 
        lineHeight: 36,
        letterSpacing: -0.5 
      },
    
      divider: { 
        height: 1, 
        backgroundColor: COLORS.border, 
        marginBottom: 25, 
        width: '100%' 
      },
    
      markdownWrapper: { paddingBottom: 20 },
    
      articleFooter: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 40, opacity: 0.3 },
      footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    
      // --- MODAL STYLES ---
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
        backgroundColor: COLORS.primaryLight + '50',
        borderRadius: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 0,
      },
      langOptionText: { fontSize: 16, color: COLORS.textMedium }
});

const markdownStyles = StyleSheet.create({
    body: { 
        fontSize: 17, 
        lineHeight: 28, 
        color: COLORS.textMedium, 
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto'
      },
      heading1: { 
        fontSize: 24, fontWeight: '800', color: COLORS.textDark, 
        marginTop: 30, marginBottom: 15, lineHeight: 32 
      },
      heading2: { 
        fontSize: 20, fontWeight: '700', color: COLORS.textDark, 
        marginTop: 25, marginBottom: 10 
      },
      heading3: { 
        fontSize: 18, fontWeight: '600', color: COLORS.textDark, 
        marginTop: 20, marginBottom: 8 
      },
      paragraph: { marginBottom: 20 },
      link: { color: COLORS.primary, fontWeight: '600', textDecorationLine: 'underline' },
      list_item: { marginBottom: 8, flexDirection: 'row' },
      bullet_list_icon: { 
        color: COLORS.primary, 
        fontSize: 20, 
        marginRight: 10,
        marginTop: -2 
      },
      code_inline: { 
        backgroundColor: COLORS.codeBg, 
        color: COLORS.primary, 
        borderRadius: 6, 
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        paddingHorizontal: 4,
        fontSize: 15
      },
      fence: { 
        backgroundColor: '#1e293b', 
        color: '#e2e8f0', 
        padding: 15, 
        borderRadius: 12, 
        marginBottom: 20, 
        borderWidth: 1, 
        borderColor: COLORS.border,
        fontSize: 14
      },
      blockquote: { 
        backgroundColor: COLORS.quoteBg, 
        borderLeftWidth: 4, 
        borderLeftColor: COLORS.quoteBorder, 
        paddingHorizontal: 15, 
        paddingVertical: 12, 
        marginBottom: 25, 
        borderRadius: 8
      },
      image: { borderRadius: 12, marginTop: 15, marginBottom: 15, width: '100%' }
    // ... markdown stilleriniz
});