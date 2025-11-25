import * as Notifications from 'expo-notifications';
import {
  AlarmClock,
  Bell,
  Calendar,
  Check,
  ChevronLeft, ChevronRight,
  Smartphone as GoogleIcon,
  LayoutDashboard,
  List,
  Lock,
  LogOut, Mail,
  Moon,
  MoreHorizontal,
  Plus,
  Settings,
  Sun, Trophy,
  User,
  X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView, StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput, TouchableOpacity,
  UIManager,
  View
} from 'react-native';

// FIREBASE IMPORTS (DÜZELTİLDİ: Dosya yoluna ../../ eklendi)
// Eğer bu hala hata verirse, firebaseConfig.js dosyasını app/(tabs) klasörüne taşıyıp tekrar ./ yapabilirsiniz.
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc, doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '/Users/enesberkaybayram/Desktop/Ommio/scripts/firebaseConfig.js';
// SOSYAL MEDYA GİRİŞ IMPORTS
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Widget (Sadece Android)
import { requestWidgetUpdate } from 'react-native-android-widget';
import { widgetTaskHandler } from './widget-task-handler'; // Widget dosyasını da kök dizinden çekiyoruz

WebBrowser.maybeCompleteAuthSession();

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- MODERN RENK PALETİ ---
const COLORS = {
  primary: '#6366f1', secondary: '#a5b4fc', background: '#F1F5F9', surface: '#ffffff',
  textDark: '#1e293b', textLight: '#64748b', textMuted: '#94a3b8',
  success: '#10b981', danger: '#ef4444', darkBg: '#0f172a', darkSurface: '#1e293b',
};

const CATEGORY_COLORS = [
  { id: 'blue', hex: '#3b82f6', bg: '#eff6ff' },
  { id: 'orange', hex: '#f97316', bg: '#fff7ed' },
  { id: 'green', hex: '#10b981', bg: '#f0fdf4' },
  { id: 'purple', hex: '#a855f7', bg: '#faf5ff' },
  { id: 'pink', hex: '#ec4899', bg: '#fdf2f8' },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

interface Task { id: string; text: string; completed: boolean; date: string; categoryId: string; notificationTime?: string | null; notificationId?: string | null; alarmTime?: string | null; alarmId?: string | null; }
interface Category { id: string; name: string; color: string; }

const getISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "Tünaydın";
  return "İyi Akşamlar";
};

export default function OmmioApp() {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [notifInput, setNotifInput] = useState<string>("");
  const [isNotifOn, setIsNotifOn] = useState<boolean>(false);
  const [alarmInput, setAlarmInput] = useState<string>("");
  const [isAlarmOn, setIsAlarmOn] = useState<boolean>(false);
  const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const [categories, setCategories] = useState<Category[]>([
      { id: 'work', name: 'İş', color: 'blue' }, 
      { id: 'home', name: 'Ev', color: 'orange' },
      { id: 'personal', name: 'Kişisel', color: 'green' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0].id);

  // --- GOOGLE AUTH ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- VERİ SENKRONİZASYONU ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "tasks"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudTasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      cloudTasks.sort((a, b) => b.id.localeCompare(a.id));
      setTasks(cloudTasks);
    });
    return () => unsubscribe();
  }, [user]);

  // --- WIDGET ---
  useEffect(() => {
    if (Platform.OS === 'android') {
        const todayISO = getISODate(new Date());
        const todaysTasks = tasks.filter(t => t.date === todayISO);
        const comp = todaysTasks.filter(t => t.completed).length;
        try { requestWidgetUpdate({ widgetName: 'OmmioWidget', renderWidget: () => widgetTaskHandler({ completedCount: comp, totalCount: todaysTasks.length, topTasks: todaysTasks.slice(0, 3).map(t => ({ text: t.text, completed: t.completed })) }), widgetNotFound: () => { } }); } catch (e) {}
    }
  }, [tasks]);

  const handleAuth = async () => {
    if (!email || !password) { Alert.alert("Hata", "Lütfen alanları doldurun."); return; }
    try {
      if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) { Alert.alert("Hata", error.message); }
  };

  const handleGuestLogin = async () => {
    try { await signInAnonymously(auth); } catch (error: any) { Alert.alert("Hata", "Misafir girişi yapılamadı."); }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      const { identityToken } = credential;
      if (identityToken) {
        const provider = new OAuthProvider('apple.com');
        const oAuthCredential = provider.credential({ idToken: identityToken });
        await signInWithCredential(auth, oAuthCredential);
      }
    } catch (e: any) { if (e.code !== 'ERR_CANCELED') Alert.alert('Hata', 'Apple girişi başarısız.'); }
  };

  const handleLogout = async () => { await signOut(auth); setTasks([]); };

  // --- DÜZELTME BURADA: title parametresi eklendi ---
  const scheduleLocalNotification = async (title: string, body: string, timeString: string, type: 'notification' | 'alarm') => {
      if (Platform.OS === 'web') return null;
      try {
        const [hours, minutes] = timeString.split(':').map(Number);
        const triggerDate = new Date(selectedDate); triggerDate.setHours(hours, minutes, 0, 0);
        const id = await Notifications.scheduleNotificationAsync({ 
            content: { 
                title: title, // Başlık artık parametreden geliyor
                body: body, 
                sound: true, 
                priority: Notifications.AndroidNotificationPriority.HIGH, 
                data: { type: type } 
            }, 
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate }, 
        });
        return id;
      } catch (e) { return null; }
  };

  const cancelNotif = async (id?: string | null) => { if(id && Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync(id); };

  const addTask = async () => {
    if (!inputValue.trim()) return;
    let notifId = null, alarmId = null;
    // Artık 4 argüman gönderiyoruz ve fonksiyon 4 argüman bekliyor (Sorun çözüldü)
    if (isNotifOn && notifInput.length === 5) notifId = await scheduleLocalNotification("Hatırlatma", inputValue, notifInput, 'notification');
    if (isAlarmOn && alarmInput.length === 5) alarmId = await scheduleLocalNotification("ALARM!", inputValue, alarmInput, 'alarm');
    
    if (user) {
      await addDoc(collection(db, "users", user.uid, "tasks"), { text: inputValue, completed: false, date: getISODate(selectedDate), categoryId: selectedCategory?.id || categories[0].id, notificationTime: (isNotifOn && notifInput.length === 5) ? notifInput : null, notificationId: notifId, alarmTime: (isAlarmOn && alarmInput.length === 5) ? alarmInput : null, alarmId: alarmId, createdAt: serverTimestamp() });
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInputValue(""); setNotifInput(""); setAlarmInput(""); setIsNotifOn(false); setIsAlarmOn(false); setIsInputExpanded(false);
  };

  const toggleTask = async (task: Task) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    const newStatus = !task.completed;
    if (newStatus) { cancelNotif(task.notificationId); cancelNotif(task.alarmId); }
    if (user) { const taskRef = doc(db, "users", user.uid, "tasks", task.id); await updateDoc(taskRef, { completed: newStatus }); }
  };

  const deleteTask = async (task: Task) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    cancelNotif(task.notificationId); cancelNotif(task.alarmId);
    if (user) { await deleteDoc(doc(db, "users", user.uid, "tasks", task.id)); }
  };
  
  const saveNewCategory = () => { if (!newCatName.trim()) return; const newCat: Category = { id: Date.now().toString(), name: newCatName, color: newCatColor }; setCategories([...categories, newCat]); setSelectedCategory(newCat); setNewCatName(""); setIsCatModalOpen(false); };
  const changeDate = (days: number) => { const newDate = new Date(selectedDate); newDate.setDate(selectedDate.getDate() + days); setSelectedDate(newDate); };

  const isDark = theme === 'dark';
  const currentColors = isDark ? { bg: COLORS.darkBg, surface: COLORS.darkSurface, text: '#fff', subText: '#94a3b8' } : { bg: COLORS.background, surface: COLORS.surface, text: COLORS.textDark, subText: COLORS.textLight };
  const currentDayTasks = tasks.filter(t => t.date === getISODate(selectedDate));
  const getCategoryColor = (catColorId: string) => CATEGORY_COLORS.find(c => c.id === catColorId) || CATEGORY_COLORS[0];

  if (isAuthLoading) return <View style={[styles.container, { justifyContent:'center', alignItems:'center', backgroundColor: currentColors.bg }]}><ActivityIndicator size="large" color={COLORS.primary}/></View>;

  if (!user) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { backgroundColor: currentColors.bg, justifyContent:'center', padding: 20 }]}>
        <View style={{alignItems:'center', marginBottom: 40}}>
          <View style={{width:80, height:80, backgroundColor: COLORS.primary, borderRadius: 20, alignItems:'center', justifyContent:'center', marginBottom:20}}><Trophy size={40} color="#fff" /></View>
          <Text style={{fontSize:32, fontWeight:'900', color: currentColors.text}}>Ommio</Text>
          <Text style={{color: currentColors.subText}}>Hayatını düzenle, hedeflerine ulaş.</Text>
        </View>
        <View style={[styles.card, { backgroundColor: currentColors.surface, padding: 20 }]}>
           <View style={{flexDirection:'row', marginBottom: 20, borderBottomWidth:1, borderColor: isDark ? '#334155' : '#e2e8f0'}}>
              <TouchableOpacity onPress={()=>setAuthMode('login')} style={{flex:1, paddingBottom:10, borderBottomWidth: authMode==='login'?2:0, borderColor:COLORS.primary}}><Text style={{textAlign:'center', fontWeight:'bold', color: authMode==='login'?COLORS.primary:currentColors.subText}}>Giriş Yap</Text></TouchableOpacity>
              <TouchableOpacity onPress={()=>setAuthMode('signup')} style={{flex:1, paddingBottom:10, borderBottomWidth: authMode==='signup'?2:0, borderColor:COLORS.primary}}><Text style={{textAlign:'center', fontWeight:'bold', color: authMode==='signup'?COLORS.primary:currentColors.subText}}>Kayıt Ol</Text></TouchableOpacity>
           </View>
           <View style={styles.authInputRow}><Mail size={20} color={currentColors.subText} /><TextInput value={email} onChangeText={setEmail} placeholder="E-posta" placeholderTextColor={currentColors.subText} style={[styles.authInput, {color: currentColors.text}]} autoCapitalize='none' /></View>
           <View style={styles.authInputRow}><Lock size={20} color={currentColors.subText} /><TextInput value={password} onChangeText={setPassword} placeholder="Şifre" placeholderTextColor={currentColors.subText} style={[styles.authInput, {color: currentColors.text}]} secureTextEntry /></View>
           <TouchableOpacity onPress={handleAuth} style={[styles.createBtn, {marginTop: 10}]}><Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</Text></TouchableOpacity>
        </View>
        <View style={{marginTop: 20, gap: 10}}>
           <TouchableOpacity disabled={!request} onPress={() => promptAsync()} style={[styles.socialBtn, {backgroundColor: currentColors.surface, flexDirection:'row', gap:10}]}>
              <GoogleIcon size={20} color={currentColors.text} /> 
              <Text style={{color: currentColors.text, fontWeight:'600'}}>Google ile Devam Et</Text>
           </TouchableOpacity>
           {Platform.OS === 'ios' && (
             <AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN} buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK} cornerRadius={12} style={{ width: '100%', height: 50 }} onPress={handleAppleLogin} />
           )}
           <TouchableOpacity onPress={handleGuestLogin} style={{marginTop:10}}><Text style={{textAlign:'center', color: currentColors.subText, textDecorationLine:'underline'}}>Üye olmadan devam et (Misafir)</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <View><Text style={[styles.greeting, { color: currentColors.subText }]}>{getGreeting()},</Text><Text style={[styles.appTitle, { color: currentColors.text }]}>{user.isAnonymous ? 'Misafir' : (user.email?.split('@')[0] || 'Kullanıcı')}</Text></View>
        <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsSettingsOpen(!isSettingsOpen); }} style={[styles.iconBtn, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}><Settings size={20} color={currentColors.text} /></TouchableOpacity>
      </View>

      {!isSettingsOpen && activeTab === 'list' && (
          <View style={styles.dateNavContainer}>
             <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}><ChevronLeft size={20} color={currentColors.subText} /></TouchableOpacity>
             <View style={styles.dateDisplay}><Calendar size={14} color={COLORS.primary} style={{marginRight: 6}} /><Text style={[styles.dateText, { color: currentColors.text }]}>{selectedDate.getDate()}/{selectedDate.getMonth()+1} {selectedDate.getFullYear()}</Text>{getISODate(selectedDate) === getISODate(new Date()) && <View style={styles.todayBadge}><Text style={styles.todayText}>Bugün</Text></View>}</View>
             <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}><ChevronRight size={20} color={currentColors.subText} /></TouchableOpacity>
          </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {isSettingsOpen ? (
          <View style={{ gap: 15 }}>
            <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
               <View style={{flexDirection:'row', alignItems:'center', gap:10, marginBottom:15}}><User size={20} color={COLORS.primary} /><Text style={[styles.cardTitle, {color: currentColors.text, marginBottom:0}]}>Hesap</Text></View>
               <Text style={{color: currentColors.text, marginBottom:10}}>{user.email || (user.isAnonymous ? "Misafir Hesap" : "Giriş Yapıldı")}</Text>
               <TouchableOpacity onPress={handleLogout} style={{flexDirection:'row', alignItems:'center', gap:5, padding:10, backgroundColor:'#fee2e2', borderRadius:8, alignSelf:'flex-start'}}><LogOut size={16} color={COLORS.danger} /><Text style={{color: COLORS.danger, fontWeight:'bold'}}>Çıkış Yap</Text></TouchableOpacity>
            </View>
            <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
               <Text style={[styles.cardTitle, {color: currentColors.text}]}>Görünüm</Text>
               <View style={{flexDirection:'row', gap:10}}>
                   <TouchableOpacity onPress={() => setTheme('light')} style={[styles.settingBtn, theme === 'light' && styles.settingBtnActive]}><Sun size={16} color={theme === 'light' ? COLORS.primary : currentColors.subText} /><Text style={{color: theme === 'light' ? COLORS.primary : currentColors.subText}}>Aydınlık</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => setTheme('dark')} style={[styles.settingBtn, theme === 'dark' && styles.settingBtnActive]}><Moon size={16} color={theme === 'dark' ? COLORS.primary : currentColors.subText} /><Text style={{color: theme === 'dark' ? COLORS.primary : currentColors.subText}}>Karanlık</Text></TouchableOpacity>
               </View>
            </View>
          </View>
        ) : (
          activeTab === 'list' ? (
            <View style={{gap: 12}}>
              {currentDayTasks.length === 0 && (<View style={styles.emptyState}><View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1e293b' : '#e0e7ff' }]}><Check size={32} color={COLORS.primary} /></View><Text style={[styles.emptyTitle, { color: currentColors.text }]}>Her şey yolunda!</Text><Text style={styles.emptyDesc}>Bugün için plan ekle.</Text></View>)}
              {currentDayTasks.map(task => {
                const catInfo = categories.find(c => c.id === task.categoryId) || categories[0];
                const catColor = CATEGORY_COLORS.find(c => c.id === catInfo.color) || CATEGORY_COLORS[0];
                return (
                <View key={task.id} style={[styles.taskCard, { backgroundColor: currentColors.surface, opacity: task.completed ? 0.7 : 1 }]}>
                  <TouchableOpacity onPress={() => toggleTask(task)} style={[styles.checkBox, task.completed ? { backgroundColor: COLORS.success, borderColor: COLORS.success } : { borderColor: '#cbd5e1' }]}><Check size={14} color={task.completed ? "#fff" : "transparent"} /></TouchableOpacity>
                  <View style={{flex:1}}><Text style={[styles.taskText, { color: currentColors.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>{task.text}</Text>
                    <View style={styles.taskMeta}><View style={[styles.miniBadge, { backgroundColor: isDark ? '#334155' : catColor.bg }]}><View style={{width:6, height:6, borderRadius:3, backgroundColor: catColor.hex}} /><Text style={{fontSize:10, color: isDark ? '#fff' : catColor.hex, fontWeight:'bold'}}>{catInfo.name}</Text></View>
                        {task.notificationTime && (<View style={styles.metaItem}><Bell size={10} color={COLORS.primary} /><Text style={{fontSize:10, color: COLORS.primary}}>{task.notificationTime}</Text></View>)}
                        {task.alarmTime && (<View style={styles.metaItem}><AlarmClock size={10} color={COLORS.danger} /><Text style={{fontSize:10, color: COLORS.danger}}>{task.alarmTime}</Text></View>)}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteTask(task)} style={{padding:5}}><X size={16} color={currentColors.subText} /></TouchableOpacity>
                </View>
              )})}
            </View>
          ) : (
            <View style={{padding:20, alignItems:'center'}}><Trophy size={48} color="#facc15" /><Text style={{fontSize:40, fontWeight:'bold', color: currentColors.text}}>{tasks.filter(t => t.completed).length}</Text><Text style={{color: currentColors.subText}}>Toplam Başarı</Text></View>
          )
        )}
      </ScrollView>

      {!isSettingsOpen && activeTab === 'list' && (
      <View style={[styles.floatingInputWrapper, { backgroundColor: currentColors.surface, shadowColor: "#000" }]}>
          {isInputExpanded && (
              <View style={styles.expandedOptions}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingVertical:10}}>{categories.map(cat => { const cc = CATEGORY_COLORS.find(c=>c.id===cat.color)||CATEGORY_COLORS[0]; return (<TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat)} style={[styles.pill, selectedCategory.id === cat.id ? {backgroundColor: cc.bg, borderColor: cc.hex} : {borderColor: isDark ? '#334155' : '#e2e8f0'}]}><View style={{width:8, height:8, borderRadius:4, backgroundColor: cc.hex}} /><Text style={{fontSize:12, color: currentColors.text, fontWeight:'600'}}>{cat.name}</Text></TouchableOpacity>)})}</ScrollView>
                  <View style={{flexDirection:'row', justifyContent:'space-between', paddingTop:10, borderTopWidth:1, borderColor:isDark?'#334155':'#f1f5f9'}}>
                      <View style={[styles.timeToggle, isNotifOn && {backgroundColor: '#eff6ff', borderColor:'#3b82f6'}]}><Bell size={14} color={isNotifOn ? '#3b82f6' : currentColors.subText} /><Switch value={isNotifOn} onValueChange={setIsNotifOn} trackColor={{false:"#cbd5e1", true:"#93c5fd"}} thumbColor={isNotifOn ? "#3b82f6" : "#fff"} style={{transform:[{scale:0.7}]}} />{isNotifOn && <TextInput value={notifInput} onChangeText={setNotifInput} placeholder="09:00" placeholderTextColor="#94a3b8" style={{fontSize:12, fontWeight:'bold', width:40}} maxLength={5} />}</View>
                      <View style={[styles.timeToggle, isAlarmOn && {backgroundColor: '#fef2f2', borderColor:'#ef4444'}]}><AlarmClock size={14} color={isAlarmOn ? '#ef4444' : currentColors.subText} /><Switch value={isAlarmOn} onValueChange={setIsAlarmOn} trackColor={{false:"#cbd5e1", true:"#fca5a5"}} thumbColor={isAlarmOn ? "#ef4444" : "#fff"} style={{transform:[{scale:0.7}]}} />{isAlarmOn && <TextInput value={alarmInput} onChangeText={setAlarmInput} placeholder="07:00" placeholderTextColor="#94a3b8" style={{fontSize:12, fontWeight:'bold', width:40}} maxLength={5} />}</View>
                  </View>
              </View>
          )}
          <View style={styles.inputMainRow}><TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsInputExpanded(!isInputExpanded); }} style={styles.expandBtn}>{isInputExpanded ? <X size={20} color={currentColors.subText} /> : <MoreHorizontal size={20} color={currentColors.subText} />}</TouchableOpacity><TextInput value={inputValue} onChangeText={setInputValue} placeholder="Yeni bir görev ekle..." placeholderTextColor={currentColors.subText} style={[styles.mainInput, { color: currentColors.text }]} onFocus={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsInputExpanded(true); }} /><TouchableOpacity onPress={addTask} style={[styles.sendBtn, { backgroundColor: inputValue.trim() ? COLORS.primary : (isDark ? '#334155' : '#e2e8f0') }]}><Plus size={24} color={inputValue.trim() ? '#fff' : '#94a3b8'} /></TouchableOpacity></View>
      </View>
      )}

      <View style={[styles.bottomTabs, { backgroundColor: currentColors.surface, borderTopColor: isDark ? '#334155' : '#f1f5f9' }]}>
         <TouchableOpacity onPress={() => setActiveTab('list')} style={{alignItems:'center', opacity: activeTab === 'list' ? 1 : 0.5}}><List size={24} color={activeTab === 'list' ? COLORS.primary : currentColors.text} />{activeTab === 'list' && <View style={styles.activeDot} />}</TouchableOpacity>
         <TouchableOpacity onPress={() => setActiveTab('stats')} style={{alignItems:'center', opacity: activeTab === 'stats' ? 1 : 0.5}}><LayoutDashboard size={24} color={activeTab === 'stats' ? COLORS.primary : currentColors.text} />{activeTab === 'stats' && <View style={styles.activeDot} />}</TouchableOpacity>
      </View>

      <Modal visible={!!activeAlarmTask} transparent animationType="slide"><View style={styles.alarmOverlay}><View style={[styles.alarmCard, { backgroundColor: currentColors.surface }]}><Text style={[styles.alarmTitle, {color: currentColors.text}]}>ALARM!</Text><Text style={{color: currentColors.text}}>{activeAlarmTask?.text}</Text><TouchableOpacity onPress={() => setActiveAlarmTask(null)} style={styles.alarmCloseBtn}><Text style={{color:'#fff'}}>Kapat</Text></TouchableOpacity></View></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  appTitle: { fontSize: 28, fontWeight: '900' },
  iconBtn: { padding: 10, borderRadius: 14 },
  dateNavContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  dateText: { fontWeight: '700', fontSize: 14 },
  todayBadge: { marginLeft: 8, backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  todayText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  dateArrow: { padding: 5 },
  content: { flex: 1, paddingHorizontal: 24 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emptyDesc: { textAlign: 'center', color: '#94a3b8', lineHeight: 20 },
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  checkBox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  taskText: { fontSize: 16, fontWeight: '600' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  floatingInputWrapper: { position: 'absolute', bottom: 90, left: 20, right: 20, borderRadius: 24, padding: 10, shadowColor: "#000", shadowOffset: {width:0, height:5}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  inputMainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mainInput: { flex: 1, fontSize: 16, height: 40, fontWeight: '500' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  expandBtn: { padding: 8 },
  expandedOptions: { paddingBottom: 10, marginBottom: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  timeToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  statsHero: { padding: 30, borderRadius: 32, marginBottom: 20 },
  bottomTabs: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, borderTopWidth: 1 },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 4 },
  card: { padding: 20, borderRadius: 24, marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  settingBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  settingBtnActive: { borderColor: COLORS.primary, backgroundColor: '#e0e7ff' },
  authInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 50 },
  authInput: { flex: 1, marginLeft: 10, height: '100%' },
  createBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  socialBtn: { padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  alarmOverlay: { flex: 1, backgroundColor: 'rgba(99, 102, 241, 0.95)', justifyContent: 'center', alignItems: 'center' },
  alarmCard: { width: '80%', padding: 30, borderRadius: 30, alignItems: 'center' },
  alarmTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  alarmCloseBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 16, marginTop: 20 },
});