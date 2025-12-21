import { Link } from 'expo-router';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2, // Kapatma ikonu
  ChevronDown,
  ListTodo,
  Play,
  Smartphone,
  Star,
  UserPlus,
  Users,
  X,
  Zap
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

// LANGUAGES listesini ve Çevirileri buradan çekiyoruz
import { LANGUAGES, TRANSLATIONS } from '../constants/translations/index';

const COLORS = {
  primary: '#6366f1',
  secondary: '#a5b4fc',
  background: '#F8FAFC',
  surface: '#ffffff',
  textDark: '#1e293b',
  textLight: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  darkBg: '#0f172a',
  darkSurface: '#1e293b',
};

interface LandingPageProps {
  onGetStarted: (mode: 'login' | 'signup') => void;
  lang: string;
  isDark: boolean;
  onLanguageChange: (newLang: string) => void;
}

const LandingPage = ({ onGetStarted, lang, isDark, onLanguageChange }: LandingPageProps) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [modalVisible, setModalVisible] = useState(false);

  // Seçili dili bul (Bulamazsa İngilizceye düş)
  const currentLangObj = LANGUAGES.find(l => l.code === lang) || LANGUAGES.find(l => l.code === 'en');

  const t = (key: string) => {
    // @ts-ignore
    // Seçili dilde yoksa İngilizceye bak, o da yoksa key'i göster
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  // --- STORE BUTTONS ---
  const StoreButtons = () => (
    <View style={{ flexDirection: 'row', gap: 15, marginTop: 30, flexWrap: 'wrap' }}>
      <TouchableOpacity
        onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.ommio.app')}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
      >
        <Play size={24} color="#fff" fill="#fff" />
        <View>
          <Text style={{ color: '#ccc', fontSize: 9, textTransform: 'uppercase', fontWeight: '600' }}>{t('store_get_google')}</Text>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{t('store_google_play')}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={true}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <Smartphone size={24} color="#e2e8f0" />
        <View>
          <Text style={{ color: '#ccc', fontSize: 9, fontWeight: '600' }}>{t('store_download_apple')}</Text>
          <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 'bold' }}>{t('store_app_store')}</Text>
        </View>
        <View style={{ position: 'absolute', top: -8, right: -5, backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>{t('coming_soon_badge')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // --- PHONE MOCKUP ---
  const PhoneScreenMockup = () => (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 30, overflow: 'hidden', padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
            <Image source={require('../assets/Logo/Icon.png')} style={{ width: 40, height: 40, borderRadius: 20 }} />
          </View>
          <View>
            <Text style={{ fontSize: 12, color: '#64748b' }}>{t('greeting')}</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>{t('user1')}</Text>
          </View>
        </View>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Bell size={20} color="#6366f1" />
          <View style={{ position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
        </View>
      </View>

      <View style={{ backgroundColor: '#6366f1', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: "#6366f1", shadowOpacity: 0.3, shadowRadius: 10 }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 5 }}>{t('daily_progress')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>%75</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>6/8</Text>
        </View>
        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3 }}>
          <View style={{ width: '75%', height: '100%', backgroundColor: '#fff', borderRadius: 3 }} />
        </View>
      </View>

      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10 }}>{t('todays_plan')}</Text>
      
      <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={14} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#94a3b8', textDecorationLine: 'line-through', fontWeight: '500' }}>{t('task_sport')}</Text>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#ecfdf5', borderRadius: 8 }}>
          <Text style={{ fontSize: 10, color: '#10b981', fontWeight: 'bold' }}>{t('task_health')}</Text>
        </View>
      </View>

      <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4, borderLeftColor: '#f59e0b' }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#1e293b', fontWeight: '600' }}>{t('task_meeting')}</Text>
          <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>⏰ 14:00</Text>
        </View>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={14} color="#3b82f6" />
        </View>
      </View>

      <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#1e293b', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ec4899', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>👩🏼</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}> {t('user2')}</Text>
          <Text style={{ color: '#94a3b8', fontSize: 11 }}>{t('notif_title')}</Text>
        </View>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowRight size={16} color="#fff" />
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ flexGrow: 1 }}>

        {/* 1. NAVBAR */}
        <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, maxWidth: 1200, alignSelf: 'center', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={require('../assets/Logo/Logo.png')} style={{ width: 140, height: 40, resizeMode: 'contain' }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              
              {/* --- YENİ DİL SEÇİM BUTONU --- */}
              <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 24,
                  marginRight: 10
                }}
              >
                <Text style={{ fontSize: 18 }}>{currentLangObj?.flag}</Text>
                <Text style={{ color: '#334155', fontWeight: '700', fontSize: 13 }}>
                  {currentLangObj?.code.toUpperCase()}
                </Text>
                <ChevronDown size={14} color="#64748b" />
              </TouchableOpacity>
              {/* --------------------------- */}

              <TouchableOpacity onPress={() => onGetStarted('login')} style={{ paddingVertical: 10, paddingHorizontal: 15 }}>
                <Text style={{ color: '#475569', fontWeight: '600' }}>{t('login')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => onGetStarted('signup')} style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#0f172a', borderRadius: 30 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. HERO SECTION */}
        <View style={{ backgroundColor: '#fff', paddingBottom: 60, overflow: 'hidden' }}>
          <View style={{ flexDirection: isDesktop ? 'row' : 'column-reverse', alignItems: 'center', justifyContent: 'space-between', padding: isDesktop ? 60 : 20, maxWidth: 1200, alignSelf: 'center' }}>

            <View style={{ flex: 1, paddingRight: isDesktop ? 60 : 0, alignItems: isDesktop ? 'flex-start' : 'center', marginTop: isDesktop ? 0 : 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#e0e7ff' }}>
                <Zap size={14} color={COLORS.primary} fill={COLORS.primary} />
                <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 12 }}>{t('hero_badge')}</Text>
              </View>

              <Text style={{ fontSize: isDesktop ? 64 : 42, fontWeight: '900', color: '#0f172a', lineHeight: isDesktop ? 72 : 48, textAlign: isDesktop ? 'left' : 'center', marginBottom: 20, letterSpacing: -1.5 }}>
                {t('hero_title_1')} {"\n"}
                <Text style={{ color: COLORS.primary, textDecorationLine: 'underline', textDecorationColor: '#cbd5e1' }}>{t('hero_title_2')}</Text>
              </Text>

              <Text style={{ fontSize: 18, color: '#64748b', marginBottom: 30, textAlign: isDesktop ? 'left' : 'center', lineHeight: 28, maxWidth: 500 }}>
                {t('hero_desc')}
              </Text>

              <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 15, width: '100%' }}>
                <TouchableOpacity onPress={() => onGetStarted('signup')} style={{ backgroundColor: COLORS.primary, paddingVertical: 20, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{t('cta_start')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ backgroundColor: '#fff', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <Text style={{ color: '#1e293b', fontSize: 18, fontWeight: 'bold' }}>{t('cta_explore')}</Text>
                </TouchableOpacity>
              </View>

              <StoreButtons />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 40 }}>
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4].map(i => <View key={i} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `#cbd5e1`, marginLeft: -10, borderWidth: 3, borderColor: '#fff' }} />)}
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} color="#fbbf24" fill="#fbbf24" />)}
                  </View>
                  <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600' }}>{t('user_count')}</Text>
                </View>
              </View>
            </View>

            <View style={{ position: 'relative' }}>
              <View style={{ position: 'absolute', top: '10%', right: '-20%', width: 500, height: 500, backgroundColor: '#c7d2fe', borderRadius: 250, opacity: 0.4, filter: 'blur(80px)' }} />
              <View style={{
                width: 300, height: 600, backgroundColor: '#0f172a', borderRadius: 45, padding: 12,
                shadowColor: "#0f172a", shadowOffset: { width: 0, height: 30 }, shadowOpacity: 0.4, shadowRadius: 40, elevation: 30,
                borderWidth: 6, borderColor: '#334155'
              }}>
                <View style={{ position: 'absolute', top: 20, alignSelf: 'center', width: 80, height: 20, backgroundColor: '#0f172a', borderRadius: 10, zIndex: 10 }} />
                <PhoneScreenMockup />
              </View>
            </View>
          </View>
        </View>

        {/* 3. İSTATİSTİKLER */}
        <View style={{ backgroundColor: '#f8fafc', paddingVertical: 40, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
          <View style={{ maxWidth: 1000, alignSelf: 'center', flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-around', width: '100%', gap: 30 }}>
            {[
              { label: t('stat_users'), val: "15K+" },
              { label: t('stat_tasks'), val: "1.2M+" },
              { label: t('stat_rating'), val: "4.9" },
            ].map((stat, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 36, fontWeight: '900', color: '#1e293b' }}>{stat.val}</Text>
                <Text style={{ color: '#64748b', fontWeight: '600' }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. ADIMLAR */}
        <View style={{ padding: isDesktop ? 80 : 40, backgroundColor: '#fff' }}>
          <View style={{ maxWidth: 1200, alignSelf: 'center' }}>
            <Text style={{ textAlign: 'center', color: COLORS.primary, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 }}>{t('how_title_small')}</Text>
            <Text style={{ textAlign: 'center', fontSize: 36, fontWeight: '900', color: '#0f172a', marginBottom: 60 }}>
              {t('how_title_big')}
            </Text>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 40 }}>
              {[
                { title: t('step1_title'), desc: t('step1_desc'), icon: <UserPlus size={32} color="#fff" />, bg: '#3b82f6' },
                { title: t('step2_title'), desc: t('step2_desc'), icon: <CalendarDays size={32} color="#fff" />, bg: '#f59e0b' },
                { title: t('step3_title'), desc: t('step3_desc'), icon: <Users size={32} color="#fff" />, bg: '#10b981' }
              ].map((step, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: '#f8fafc', padding: 30, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: step.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: step.bg, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 5 } }}>
                    {step.icon}
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 }}>{step.title}</Text>
                  <Text style={{ color: '#64748b', lineHeight: 24 }}>{step.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 5. ÖZELLİKLER */}
        <View style={{ padding: isDesktop ? 80 : 20, backgroundColor: '#0f172a' }}>
          <View style={{ maxWidth: 1200, alignSelf: 'center' }}>
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: 'center', gap: 60, marginBottom: 80 }}>
              <View style={{ flex: 1, height: 300, backgroundColor: '#1e293b', borderRadius: 24, padding: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}>
                <ListTodo size={120} color={COLORS.primary} opacity={0.8} />
                <View style={{ position: 'absolute', bottom: -20, right: -20, backgroundColor: '#fff', padding: 15, borderRadius: 12 }}>
                  <CheckCircle2 size={32} color={COLORS.success} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.primary, fontWeight: 'bold', marginBottom: 10 }}>{t('feat_task_title')}</Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 20 }}>{t('feat_task_head')}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 18, lineHeight: 28, marginBottom: 30 }}>
                  {t('feat_task_desc')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Check size={20} color={COLORS.success} />
                  <Text style={{ color: '#cbd5e1' }}>{t('feat_task_check1')}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 }}>
                  <Check size={20} color={COLORS.success} />
                  <Text style={{ color: '#cbd5e1' }}>{t('feat_task_check2')}</Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: isDesktop ? 'row-reverse' : 'column', alignItems: 'center', gap: 60 }}>
              <View style={{ flex: 1, height: 300, backgroundColor: '#1e293b', borderRadius: 24, padding: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}>
                <Users size={120} color="#f43f5e" opacity={0.8} />
                <View style={{ position: 'absolute', top: 40, left: -20, backgroundColor: '#fff', padding: 10, borderRadius: 12, borderBottomLeftRadius: 0 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{t('feat_chat_bubble')}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f43f5e', fontWeight: 'bold', marginBottom: 10 }}>{t('feat_social_title')}</Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 20 }}>{t('feat_social_head')}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 18, lineHeight: 28, marginBottom: 30 }}>
                  {t('feat_social_desc')}
                </Text>
                <TouchableOpacity onPress={() => onGetStarted('signup')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: '#f43f5e', fontWeight: 'bold', fontSize: 16 }}>{t('feat_social_link')}</Text>
                  <ArrowRight size={20} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 6. FOOTER */}
        <View style={{ padding: isDesktop ? 100 : 40, alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: isDesktop ? 48 : 36, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 20 }}>
            {t('bottom_cta_title')}
          </Text>
          <Text style={{ fontSize: 18, color: '#64748b', textAlign: 'center', marginBottom: 40, maxWidth: 600 }}>
            {t('bottom_cta_desc')}
          </Text>
          <TouchableOpacity onPress={() => onGetStarted('signup')} style={{ backgroundColor: '#0f172a', paddingVertical: 20, paddingHorizontal: 50, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{t('bottom_cta_btn')}</Text>
          </TouchableOpacity>
          <StoreButtons />
        </View>

        <View style={{ padding: 40, borderTopWidth: 1, borderColor: '#e2e8f0', flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={require('../assets/Logo/Icon.png')} style={{ width: 30, height: 30, borderRadius: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Ommio</Text>
          </View>
          <Text style={{ color: '#94a3b8' }}>{t('footer_rights')}</Text>

          <View style={{ flexDirection: 'row', gap: 20 }}>
            <Link href={`/${lang}/privacy`} asChild>
              <TouchableOpacity><Text style={{ color: '#64748b' }}>{t('privacy')}</Text></TouchableOpacity>
            </Link>
            <TouchableOpacity onPress={() => Linking.openURL('https://ommio.app/terms')}>
              <Text style={{ color: '#64748b' }}>{t('terms')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:bilgi@limerayayinlari.com')}>
              <Text style={{ color: '#64748b' }}>{t('contact')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- DİL SEÇİM MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable 
            onPress={() => {}} 
            style={{ 
              width: '100%', 
              maxWidth: 400, 
              maxHeight: '80%',
              backgroundColor: '#fff', 
              borderRadius: 24, 
              paddingVertical: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>Select Language</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 5 }}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: '#f1f5f9', width: '100%', marginBottom: 10 }} />

            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onLanguageChange(item.code);
                    setModalVisible(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 15,
                    borderRadius: 12,
                    backgroundColor: lang === item.code ? '#eef2ff' : 'transparent',
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 28, marginRight: 15 }}>{item.flag}</Text>
                  <Text style={{ fontSize: 16, color: lang === item.code ? COLORS.primary : '#334155', fontWeight: lang === item.code ? '700' : '500', flex: 1 }}>
                    {item.label}
                  </Text>
                  {lang === item.code && <Check size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default LandingPage;