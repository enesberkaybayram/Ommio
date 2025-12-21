import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as AuthSession from 'expo-auth-session';
import { Prompt } from 'expo-auth-session';
import { BlurView } from 'expo-blur';
import * as Contacts from 'expo-contacts';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as SMS from 'expo-sms';
import { useCallback } from 'react';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import WidgetCenter from 'react-native-widget-center';
import { WidgetTaskHandler } from '../../widget-task-handler.android'; // Dosya yolunuza göre düzeltin
import { useUser } from '../_layout'; // Layout'tan oluşturduğumuz hook'u çekiyoruz
// getAuth'u da eklemeyi unutma
import * as Localization from 'expo-localization';
import {
    AlarmClock,
    AlertCircle,
    AlertTriangle,
    AlignLeft,
    Award,
    BarChart3,
    Bell,
    CalendarClock,
    CalendarDays,
    CalendarIcon,
    Check,
    CheckCheck,
    CheckCircle2,
    ChevronDown,
    ChevronLeft, ChevronRight,
    ChevronUp,
    Download,
    Edit2,
    FileText,
    Flag,
    Flame,
    Globe,
    Layers,
    ListTodo,
    Lock,
    LogOut, Mail,
    MessageCircle,
    Monitor,
    Moon,
    MoreVertical,
    Paperclip,
    Plus,
    Repeat,
    Send,
    Sliders,
    Sun,
    Trash2,
    TrendingUp,
    Trophy,
    User,
    UserMinus,
    UserPlus,
    Users,
    X,
    XCircle
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    FlatList, Image,
    Keyboard,
    KeyboardAvoidingView,
    LayoutAnimation,
    Modal,
    NativeModules,
    PanResponder,
    Platform,
    ScrollView, StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput, TouchableOpacity,
    TouchableWithoutFeedback,
    UIManager,
    useColorScheme,
    View
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedSplash from '../../components/AnimatedSplash'; // Yolunu kendine göre ayarla
import OmmioAdBanner from '../../components/OmmioAdBanner';
import PagerView from "../../components/OmmioPager";
import { setupCalendarLocales } from '../../constants/calendarConfig';
import { auth, db, storage } from '../../firebaseConfig';
import { decryptMessage, encryptMessage, generateAndStoreKeys } from '../../utils/crypto';
// --- FIREBASE ---
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    GoogleAuthProvider,
    linkWithCredential,
    OAuthProvider,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInAnonymously,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    collectionGroup,
    deleteDoc, doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where, writeBatch
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import LandingPage from '../../components/LandingPage';
import { TRANSLATIONS } from '../../constants/translations/index'; // YENİ IMPORT
// Auth tipini güvenli hale getiriyoruz

import * as WebBrowser from 'expo-web-browser';

// Widget (Android)
// @ts-ignore
import { requestWidgetUpdate } from 'react-native-android-widget';
// @ts-ignore
WebBrowser.maybeCompleteAuthSession();
// --- IMPORTLARIN EN ÜSTÜNE EKLEYİN ---
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// --- YARDIMCI FONKSİYON: Push Token Alma ---
// --- YARDIMCI FONKSİYON: Push Token Alma (SESSİZ VERSİYON) ---
async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
        // Alarm kanalı...
        await Notifications.setNotificationChannelAsync('alarm', {
            name: 'Alarm',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 500, 500, 500],
            enableLights: true,
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // İzin yoksa bir kere sor (Pop-up çıkar)
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        // --- DEĞİŞİKLİK BURADA: ---
        // Eğer hala izin yoksa, SESSİZCE fonksiyondan çık. Uyarı verme.
        if (finalStatus !== 'granted') {
            console.log('Bildirim izni verilmedi (Kullanıcı işlem yapana kadar sessiz kalınıyor).');
            return;
        }

        // Proje ID ve Token alma kısmı...
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        try {
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } catch (e) { console.log(e); }
    }
    return token;
}

// --- YARDIMCI FONKSİYON: Push Token ile Bildirim Gönderme (WEB CORS DÜZELTİLMİŞ) ---
async function sendPushNotification(expoPushToken: any, title: any, body: any, data = {}) {
    // Web ortamında Push Bildirimi doğrudan gönderilemez (CORS Hatası verir).
    // Bu yüzden Web'de isek fonksiyonu sessizce durduruyoruz.
    if (Platform.OS === 'web') {
        console.log("Web ortamında Push Notification gönderimi atlandı (CORS Kısıtlaması).");
        return;
    }

    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'default',
        badge: 1,
    };

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
    } catch (error) {
        console.log("Bildirim gönderme hatası:", error);
    }
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
const COLORS = {
    primary: '#6366f1', secondary: '#a5b4fc', background: '#F8FAFC', surface: '#ffffff',
    textDark: '#1e293b', textLight: '#64748b', textMuted: '#94a3b8',
    success: '#10b981', danger: '#ef4444', warning: '#f59e0b', darkBg: '#0f172a', darkSurface: '#1e293b',
};
const DEFAULT_HABITS = [
    { titleKey: 'habit_gym', colorId: 'blue' },
    { titleKey: 'habit_water', colorId: 'blue' },
    { titleKey: 'habit_walk', colorId: 'green' },
    { titleKey: 'habit_read', colorId: 'purple' },
    { titleKey: 'habit_meditate', colorId: 'purple' },
    { titleKey: 'habit_fresh_air', colorId: 'blue' },
    { titleKey: 'habit_vitamins', colorId: 'blue' },
    { titleKey: 'habit_edu_video', colorId: 'green' },
    { titleKey: 'habit_skill', colorId: 'purple' },
];

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
const APP_GROUP_ID = 'group.com.seninadin.ommio.widget'; // Kendi ID'niz
const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
const LANGUAGES = [{ code: 'en', label: 'English', flag: '🇬🇧' }, { code: 'tr', label: 'Türkçe', flag: '🇹🇷' }, { code: 'nl', label: 'Dutch', flag: '🇳🇱' }, { code: 'de', label: 'German', flag: '🇩🇪' }, { code: 'es', label: 'Spanish', flag: '🇪🇸' }, { code: 'fr', label: 'French', flag: '🇫🇷' }, { code: 'ar', label: 'Arabic', flag: '🇸🇦' }, { code: 'id', label: 'Indonesian', flag: '🇮🇩' }, { code: 'pt', label: 'Portuguese', flag: '🇵🇹' }, { code: 'hi', label: 'Hindi', flag: '🇮🇳' }, { code: 'ko', label: 'Korean', flag: '🇰🇷' }, { code: 'ja', label: 'Japanese', flag: '🇯🇵' }, { code: 'ru', label: 'Russian', flag: '🇷🇺' }, { code: 'it', label: 'Italian', flag: '🇮🇹' }, { code: 'pl', label: 'Polish', flag: '🇵🇱' }, { code: 'uk', label: 'Ukrainian', flag: '🇺🇦' }];

// --- TİP TANIMLAMALARI ---
type ThemeMode = 'light' | 'dark' | 'system';
type LangCode = 'en' | 'tr' | 'nl' | 'de' | 'es' | 'fr' | 'ar' | 'id' | 'pt' | 'hi' | 'ko' | 'ja' | 'ru' | 'it' | 'pl' | 'uk';

interface Task {
    id: string; text: string; description?: string; completed: boolean; date: string; dueDate?: string; showEveryDayUntilDue?: boolean; categoryId: string; notificationTime?: string | null; alarmTime?: string | null; assignedBy?: string; assignedByName?: string; assignedTo?: string; priority?: 'low' | 'medium' | 'high'; attachments?: { name: string; url: string; type?: string }[];
}

interface Habit {
    id: string; title: string; frequency: 'daily' | 'weekly'; selectedDays: number[]; endDate?: string | null; notificationTime?: string | null; notificationIds?: string[]; completedDates: string[]; categoryId: string; createdAt: any;
}

interface Category { id: string; name: string; color: string; }
interface Contact { uid: string; username: string; email: string; phoneNumber?: string; canAssignToMe: boolean; defaultCategoryId?: string; photoURL?: string; displayName?: string; publicKey?: string; }
interface FriendRequest { id: string; fromUid: string; fromUsername: string; fromEmail: string; status: 'pending'; }
interface DeviceContact { id: string; name: string; phoneNumber: string; isAppUser?: boolean; uid?: string; }
interface ChatMessage { id: string; text: string; senderId: string; timestamp: any; read?: boolean; }

// Grup Alışkanlığı Tipi
interface GroupHabit {
    id: string;
    title: string;
    createdBy: string; // Grubu kuran kişinin UID'si
    members: string[]; // Üye UID listesi
    memberDetails?: any[]; // UI için dolduracağımız detaylar (isim, foto vb.)
    completions: { [date: string]: string[] }; // Örn: "2023-12-14": ["uid1", "uid2"]
    createdAt: any;
}

const getISODate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const parseDueDate = (dateStr?: string) => {
    if (!dateStr) return Infinity;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return Infinity;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
};

const convertDDMMYYYYtoISO = (dateStr: string) => {
    if (!dateStr) return ""; // Boş kontrolü
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    // DÜZELTME: padStart(2, '0') ile tek haneli sayıların başına 0 ekliyoruz.
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];

    return `${year}-${month}-${day}`;
};

const maskDateInput = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '-' + cleaned.slice(4);
    return formatted.slice(0, 10);
};

const maskTimeInput = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
    return formatted.slice(0, 5);
};

const GREETINGS = {
    en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
    tr: { morning: "Günaydın", afternoon: "Tünaydın", evening: "İyi akşamlar" },
    nl: { morning: "Goedemorgen", afternoon: "Goedemiddag", evening: "Goedenavond" },
    de: { morning: "Guten Morgen", afternoon: "Guten Nachmittag", evening: "Guten Abend" },
    es: { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches" },
    fr: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir" },
    ar: { morning: "صباح الخير", afternoon: "مساء الخير", evening: "مساء الخير" },
    id: { morning: "Selamat pagi", afternoon: "Selamat siang", evening: "Selamat malam" },
    pt: { morning: "Bom dia", afternoon: "Boa tarde", evening: "Boa noite" },
    hi: { morning: "सुप्रभात", afternoon: "नमस्कार", evening: "शुभ संध्या" },
    ko: { morning: "좋은 아침", afternoon: "좋은 오후", evening: "좋은 저녁" },
    ja: { morning: "おはようございます", afternoon: "こんにちは", evening: "こんばんは" },
    ru: { morning: "Доброе утро", afternoon: "Добрый день", evening: "Добрый вечер" },
    it: { morning: "Buongiorno", afternoon: "Buon pomeriggio", evening: "Buonasera" },
    pl: { morning: "Dzień dobry", afternoon: "Dzień dobry", evening: "Dobry wieczór" },
    uk: { morning: "Доброго ранку", afternoon: "Добрий день", evening: "Добрий вечір" }
};
const getGreeting = (lang: LangCode) => { const hour = new Date().getHours(); const g = GREETINGS[lang] || GREETINGS.en; return hour < 12 ? g.morning : hour < 18 ? g.afternoon : g.evening; };


const DAYS_OF_WEEK_MAP = {
    en: [{ id: 1, label: "Mon" }, { id: 2, label: "Tue" }, { id: 3, label: "Wed" }, { id: 4, label: "Thu" }, { id: 5, label: "Fri" }, { id: 6, label: "Sat" }, { id: 0, label: "Sun" }],
    tr: [{ id: 1, label: "Pzt" }, { id: 2, label: "Sal" }, { id: 3, label: "Çar" }, { id: 4, label: "Per" }, { id: 5, label: "Cum" }, { id: 6, label: "Cmt" }, { id: 0, label: "Paz" }],
    nl: [{ id: 1, label: "Ma" }, { id: 2, label: "Di" }, { id: 3, label: "Wo" }, { id: 4, label: "Do" }, { id: 5, label: "Vr" }, { id: 6, label: "Za" }, { id: 0, label: "Zo" }],
    de: [{ id: 1, label: "Mo" }, { id: 2, label: "Di" }, { id: 3, label: "Mi" }, { id: 4, label: "Do" }, { id: 5, label: "Fr" }, { id: 6, label: "Sa" }, { id: 0, label: "So" }],
    es: [{ id: 1, label: "Lun" }, { id: 2, label: "Mar" }, { id: 3, label: "Mié" }, { id: 4, label: "Jue" }, { id: 5, label: "Vie" }, { id: 6, label: "Sáb" }, { id: 0, label: "Dom" }],
    fr: [{ id: 1, label: "Lun" }, { id: 2, label: "Mar" }, { id: 3, label: "Mer" }, { id: 4, label: "Jeu" }, { id: 5, label: "Ven" }, { id: 6, label: "Sam" }, { id: 0, label: "Dim" }],
    ar: [{ id: 1, label: "الاثنين" }, { id: 2, label: "الثلاثاء" }, { id: 3, label: "الأربعاء" }, { id: 4, label: "الخميس" }, { id: 5, label: "الجمعة" }, { id: 6, label: "السبت" }, { id: 0, label: "الأحد" }],
    id: [{ id: 1, label: "Sen" }, { id: 2, label: "Sel" }, { id: 3, label: "Rab" }, { id: 4, label: "Kam" }, { id: 5, label: "Jum" }, { id: 6, label: "Sab" }, { id: 0, label: "Min" }],
    pt: [{ id: 1, label: "Seg" }, { id: 2, label: "Ter" }, { id: 3, label: "Qua" }, { id: 4, label: "Qui" }, { id: 5, label: "Sex" }, { id: 6, label: "Sáb" }, { id: 0, label: "Dom" }],
    hi: [{ id: 1, label: "सोम" }, { id: 2, label: "मंगल" }, { id: 3, label: "बुध" }, { id: 4, label: "गुरु" }, { id: 5, label: "शुक्र" }, { id: 6, label: "शनि" }, { id: 0, label: "रवि" }],
    ko: [{ id: 1, label: "월" }, { id: 2, label: "화" }, { id: 3, label: "수" }, { id: 4, label: "목" }, { id: 5, label: "금" }, { id: 6, label: "토" }, { id: 0, label: "일" }],
    ja: [{ id: 1, label: "月" }, { id: 2, label: "火" }, { id: 3, label: "水" }, { id: 4, label: "木" }, { id: 5, label: "金" }, { id: 6, label: "土" }, { id: 0, label: "日" }],
    ru: [{ id: 1, label: "Пн" }, { id: 2, label: "Вт" }, { id: 3, label: "Ср" }, { id: 4, label: "Чт" }, { id: 5, label: "Пт" }, { id: 6, label: "Сб" }, { id: 0, label: "Вс" }],
    it: [{ id: 1, label: "Lun" }, { id: 2, label: "Mar" }, { id: 3, label: "Mer" }, { id: 4, label: "Gio" }, { id: 5, label: "Ven" }, { id: 6, label: "Sab" }, { id: 0, label: "Dom" }],
    pl: [{ id: 1, label: "Pon" }, { id: 2, label: "Wto" }, { id: 3, label: "Śro" }, { id: 4, label: "Czw" }, { id: 5, label: "Pią" }, { id: 6, label: "Sob" }, { id: 0, label: "Nie" }],
    uk: [{ id: 1, label: "Пн" }, { id: 2, label: "Вт" }, { id: 3, label: "Ср" }, { id: 4, label: "Чт" }, { id: 5, label: "Пт" }, { id: 6, label: "Сб" }, { id: 0, label: "Нд" }]
};

const getDaysOfWeek = (lang: LangCode) => DAYS_OF_WEEK_MAP[lang] || DAYS_OF_WEEK_MAP.en;

setupCalendarLocales();
// lang prop'unu ekledik
export default function OmmioApp() {
    const [theme, setTheme] = useState<ThemeMode>("system");
    const [rememberMe, setRememberMe] = useState(true);
    const systemScheme = useColorScheme();
    const [user, setUser] = useState<any>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('blue'); // Varsayılan renk
    const CATEGORY_PALETTE = ['blue', 'orange', 'green', 'purple', 'pink']; // Seçenekler
    const [tasks, setTasks] = useState<Task[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

    const [isHabitStatsModalOpen, setIsHabitStatsModalOpen] = useState(false);

    // Mevcut editUsernameInput'un hemen altına ekleyin:
    const [editDisplayNameInput, setEditDisplayNameInput] = useState("");

    // --- YENİ STATE'LER ---
    // 1. Çoklu Atama: Artık tek kişi değil, liste tutuyoruz
    const [assignTargets, setAssignTargets] = useState<Contact[]>([]);

    // 2. Öncelik: 'low' | 'medium' | 'high'
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

    // 3. Dosyalar: Seçilen dosyaları tutar
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [taskComments, setTaskComments] = useState<any[]>([]); // Yorumları tutar
    const [taskCommentInput, setTaskCommentInput] = useState(""); // Yorum yazma kutusu
    const [taskModalTab, setTaskModalTab] = useState<'details' | 'chat'>('details'); // Modal içindeki sekme

    // Profil Düzenleme State'leri
    const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
    const [editUsernameInput, setEditUsernameInput] = useState("");

    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false); // Takvim açık/kapalı kontrolü

    // OmmioApp fonksiyonunun içine, diğer state'lerin yanına ekle
    const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);

    const passwordRef = useRef<TextInput>(null);

    // --- REKLAM VE SAYAÇ STATE'LERİ ---
    // Hangi eylemden kaç tane yapıldı?  
    // --- REKLAM & PREMIUM MANTIĞI ---
    const [adCounters, setAdCounters] = useState({ tasks: 0, habits: 0, assigned: 0, time: 0 });
    const [isAdVisible, setIsAdVisible] = useState(false);
    const [isUpsellVisible, setIsUpsellVisible] = useState(false);

    const [searchTasks, setSearchTasks] = useState(''); // Görev Arama Çubuğu için
    const [searchFriends, setSearchFriends] = useState(''); // Arkadaş Arama Çubuğu için
    const [searchHistory, setSearchHistory] = useState(''); // Geçmiş Arama Çubuğu için

    // YENİ: Reklam geri sayımı (Başlangıç 5 saniye)
    const [adCountdown, setAdCountdown] = useState(5);

    const AD_THRESHOLDS = { tasks: 4, habits: 4, assigned: 3, time: 300 };

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPasswordInput, setNewPasswordInput] = useState("");

    // Landing Page mi gösterilsin yoksa Auth ekranı mı?
    // Web değilse (Android/iOS) direkt true başlasın.
    const [showAuth, setShowAuth] = useState(Platform.OS !== 'web');
    

    // Grup Alışkanlıkları State'leri
    const [groupHabits, setGroupHabits] = useState<GroupHabit[]>([]);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupTitle, setNewGroupTitle] = useState("");
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]); // Seçilen arkadaşların UID'leri
    const [expandedGroupAnalysisId, setExpandedGroupAnalysisId] = useState<string | null>(null);

    const handlePageScroll = (e: any) => {
        const index = e.nativeEvent.position;
        // Eğer TAB_ORDER tanımlı değilse hata almamak için kontrol edelim
        if (TAB_ORDER && TAB_ORDER[index]) {
            // @ts-ignore
            setActiveTab(TAB_ORDER[index]);
        }
    };

    const { isPremium, setIsPremium } = useUser(); // Fonksiyonu da buradan çekiyoruz // Artık isPremium verisi globalden geliyor!

    // PagerView kontrolü için referans
    const pagerRef = useRef<PagerView>(null);

    // Tabların sırası (ÖNEMLİ: Bu sıra BottomBar'daki sırayla aynı olmalı)
    const TAB_ORDER = ['list', 'habits', 'messages', 'social', 'profile'];

    // Tab değiştirme fonksiyonu (Hem tıklama hem kaydırma için)
    const handleTabChange = (index: number) => {
        const tabName = TAB_ORDER[index];
        // State'i güncelle (ikonun rengi değişsin diye)
        // @ts-ignore
        setActiveTab(tabName);
    };
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Alt bara tıklandığında çalışacak fonksiyon
    const onBottomTabPress = (tabName: string) => {
        setActiveTab(tabName as any);
        const index = TAB_ORDER.indexOf(tabName);
        // Sayfayı o indexe kaydır
        pagerRef.current?.setPage(index);
    };


    // --- YENİ STATE TANIMLARI ---

    // 1. Gelişmiş Toast (Bildirim) State'i
    const [customToast, setCustomToast] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });

    // 2. Özel Onay Kutusu (Confirm Modal) State'i
    const [confirmModal, setConfirmModal] = useState({
        visible: false, title: '', message: '', onConfirm: () => { }, // Onaylanınca çalışacak fonksiyon
        isDestructive: false // Silme işlemiyse kırmızı buton olsun mu?
    });

    const [friendTasksModal, setFriendTasksModal] = useState<{
        visible: boolean; tasks: any[]; // veya Task[] yazabilirsin ama any[] şimdilik hataları çözer
        friendName: string;
    }>({ visible: false, tasks: [], friendName: '' });

    // Toast Bildirim State'i
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' }); // type: 'success' | 'error' | 'info'

    // Her arkadaşın son mesajını ve okunmamış sayısını tutar: { [uid]: { text, time, unread } }

    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [chatPreviews, setChatPreviews] = useState<any>({});

    // Sosyal sekmesinde hangi kişinin detaylarının açık olduğunu tutar
    const [expandedContactId, setExpandedContactId] = useState<string | null>(null);


    const hasUnreadInSelectedTask = taskComments.some(c => !c.read && c.senderId !== user.uid);

    // NAVIGATION STATE
    const [activeTab, setActiveTab] = useState<'list' | 'habits' | 'messages' | 'social' | 'profile' | 'chat_room'>('list');
    const [chatTarget, setChatTarget] = useState<Contact | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");

    const [isTyping, setIsTyping] = useState(false); // Karşı taraf yazıyor mu?
    const [lastVisibleMsg, setLastVisibleMsg] = useState<any>(null); // Pagination için
    const [loadingMoreMsg, setLoadingMoreMsg] = useState(false);

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0);

    const [msgLimit, setMsgLimit] = useState(125); // Başlangıçta 125 mesaj göster



    const getDeviceLang = () => {
        const loc = Localization.getLocales()[0]; // Cihazın birincil dili
        const code = loc ? loc.languageCode : 'en';
        // LANGUAGES dizisinde bu kod var mı kontrol et, yoksa 'en' döndür
        return LANGUAGES.some(l => l.code === code) ? code : 'en';
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // State tanımlarken varsayılan değeri buna eşitle
    const [lang, setLang] = useState<LangCode>(getDeviceLang() as LangCode);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isLangModalOpen, setIsLangModalOpen] = useState(false);
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
    const [isOverdueExpanded, setIsOverdueExpanded] = useState(true);
    const [taskViewMode, setTaskViewMode] = useState<'list' | 'category'>('list');

    const [isAllTasksModalOpen, setIsAllTasksModalOpen] = useState(false);

    // Mevcut filterContacts yerine/yanına bunu ekle
    const filteredSocialContacts = useMemo(() => {
        if (!searchFriends) return contacts;
        const lowerCaseSearch = searchFriends.toLowerCase();
        // Hem kullanıcı adını hem de görünen ismi ara
        return contacts.filter(contact =>
            contact.username.toLowerCase().includes(lowerCaseSearch) ||
            (contact.displayName && contact.displayName.toLowerCase().includes(lowerCaseSearch))
        );
    }, [contacts, searchFriends]);

    // ADD MODAL STATE (Eksik olanlar eklendi)

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addMode, setAddMode] = useState<'task' | 'habit'>('task');

    const router = useRouter();

    const [inputValue, setInputValue] = useState("");
    const [inputDesc, setInputDesc] = useState("");
    const [inputDueDate, setInputDueDate] = useState("");
    const [inputStartDate, setInputStartDate] = useState("");
    const [notifInput, setNotifInput] = useState("");
    const [alarmInput, setAlarmInput] = useState("");
    const [isNotifOn, setIsNotifOn] = useState(false);
    const [isAlarmOn, setIsAlarmOn] = useState(false);
    const [isEveryDayOn, setIsEveryDayOn] = useState(false);
    const [assignTarget, setAssignTarget] = useState<Contact | null>(null);

    const [newHabitTitle, setNewHabitTitle] = useState("");
    const [newHabitFreq, setNewHabitFreq] = useState<'daily' | 'weekly'>('daily');
    const [newHabitDays, setNewHabitDays] = useState<number[]>([]);
    const [newHabitEndDate, setNewHabitEndDate] = useState("");
    const [habitNotifInput, setHabitNotifInput] = useState("");
    const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
    // ... diğer state tanımları
    const [newCategoryName, setNewCategoryName] = useState("");

    const [categories, setCategories] = useState<Category[]>([
        { id: 'work', name: 'İş', color: 'blue' },
        { id: 'home', name: 'Ev', color: 'orange' },
        { id: 'personal', name: 'Kişisel', color: 'green' }
    ]);
    const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]);

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);
    const [detailText, setDetailText] = useState("");
    const [detailDesc, setDetailDesc] = useState("");
    const [detailDueDate, setDetailDueDate] = useState("");

    // DATE PICKERS
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDetailDatePicker, setShowDetailDatePicker] = useState(false);
    const [showHabitDatePicker, setShowHabitDatePicker] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'due' | 'habitEnd' | 'detail'>('start');

    const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
    const [assignSearchText, setAssignSearchText] = useState("");
    const [searchUsername, setSearchUsername] = useState("");
    const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
    const [networkTab, setNetworkTab] = useState<'ommio' | 'contacts'>('ommio');
    const [isInputExpanded, setIsInputExpanded] = useState(false);



    // Google Auth Kısmını Böyle Güncelle:
    // Bu kısmı Google.useIdTokenAuthRequest'in hemen üzerine yazın
    const currentRedirectUri = React.useMemo(() => {
        return AuthSession.makeRedirectUri({
            scheme: 'ommioapp',
        });
    }, []);

    // Tüm arkadaşlardan gelen toplam okunmamış mesaj sayısı
    const totalSocialUnread = useMemo(() => {
        return Object.values(chatPreviews).reduce((acc: number, curr: any) => acc + (curr.unread || 0), 0);
    }, [chatPreviews]);

    // Mevcut hook'unuzu bu yeni değişkeni kullanacak şekilde güncelleyin:
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '677937409612-ijhg8dbhknb24hs53t9r8gvse397pvrh.apps.googleusercontent.com',
        iosClientId: '677937409612-sats3t36t7mko7i2lds7m45sc52aofq2.apps.googleusercontent.com',
        androidClientId: '677937409612-prdicaptu9fn46vmbp4o1c05nrhg2asb.apps.googleusercontent.com',
        redirectUri: currentRedirectUri, // BURAYI GÜNCELLEDİK
        prompt: Prompt.SelectAccount,
        extraParams: { access_type: 'offline' },
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);

            // Loading başlat
            setIsAuthLoading(true);

            signInWithCredential(auth, credential)
                .then(async (userCredential) => {
                    // Google girişi başarılı oldu.
                    // Şimdi bu kullanıcıyı veritabanına da kaydedelim (Eğer yoksa)
                    const user = userCredential.user;
                    const userRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(userRef);

                    if (!docSnap.exists()) {
                    // 1. Kullanıcı Adı Oluşturma
                    const randomSuffix = Math.floor(Math.random() * 10000);
                    const baseName = (user.displayName || "user").toLowerCase()
                        .replace(/\s+/g, '')
                        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

                    const autoUsername = `${baseName}_${randomSuffix}`;

                    // 2. Batch İşlemini Başlat
                    const batch = writeBatch(db);

                    // A) Ana Kullanıcı Dokümanını Batch'e Ekle
                    // userRef zaten yukarıda tanımlı varsayıyorum: const userRef = doc(db, "users", user.uid);
                    batch.set(userRef, {
                        uid: user.uid,
                        email: user.email,
                        username: autoUsername,
                        displayName: user.displayName || "Google User",
                        createdAt: serverTimestamp(),
                        photoURL: user.photoURL,
                        categories: [
                            // DÜZELTME: ID'ler sabit ('work'), İsimler çevrili (t('work'))
                            { id: 'work', name: t('work'), color: 'blue' },
                            { id: 'home', name: t('home'), color: 'orange' },
                            { id: 'personal', name: t('personal'), color: 'green' }
                        ]
                    });

                    // B) Public Profil Dokümanını Batch'e Ekle
                    const publicUserRef = doc(db, "public_users", user.uid);
                    batch.set(publicUserRef, {
                        uid: user.uid,
                        username: autoUsername,
                        email: user.email,
                        photoURL: user.photoURL
                    });

                    // C) Varsayılan Alışkanlıkları Batch'e Ekle
                    // Not: DEFAULT_HABITS dizisinin tanımlı olduğundan emin olun
                    if (typeof DEFAULT_HABITS !== 'undefined') {
                        DEFAULT_HABITS.forEach((habit) => {
                            // Yeni bir ID ile referans oluştur
                            const newHabitRef = doc(collection(db, "users", user.uid, "habits"));
                            
                            batch.set(newHabitRef, {
                                title: habit.titleKey, 
                                frequency: 'daily',
                                selectedDays: [],
                                endDate: null,
                                completedDates: [],
                                notificationTime: null,
                                notificationIds: [],
                                categoryId: 'personal',
                                createdAt: serverTimestamp()
                            });
                        });
                    }

                    // 3. TÜM İŞLEMLERİ TEK SEFERDE GÖNDER (Atomik İşlem)
                    await batch.commit();
                }
                        
                })
                .catch((error) => {
                    console.log("Google Sign-In Error:", error);
                    showToast(t('login_error'), t('google_login_failed') + error.message, 'error');
                })
                .finally(() => {
                    setIsAuthLoading(false);
                });
        } else if (response?.type === 'error') {
            showToast(t('warning_title'), t('google_connection_error'), 'error');
        }
    }, [response]);

   // --- EXPO ROUTER İLE WIDGET YÖNLENDİRMESİ ---
    const params = useLocalSearchParams();

    useEffect(() => {
        if (params.tab === 'habits') {
            // Biraz bekletiyoruz ki sayfa tam yüklensin
            setTimeout(() => onBottomTabPress('habits'), 100);
        } 
        else if (params.tab === 'list') {
            setTimeout(() => onBottomTabPress('list'), 100);
        }
    }, [params.tab]);
    
    
    // --- EKSİK OLAN PARÇA: SEÇİLİ SOHBETİN MESAJLARINI DİNLEME ---
    useEffect(() => {
        // Eğer bir sohbet seçilmediyse veya kullanıcı yoksa işlem yapma
        if (!chatTarget || !user) return;

        // Chat ID oluştur (Alfabetik sıraya göre, böylece her iki tarafta da aynı ID olur)
        const chatId = [user.uid, chatTarget.uid].sort().join('_');

        // Sorguyu hazırla: Mesajları tarihe göre tersten sırala (en yeni en altta)
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "desc")
        );

        // Dinlemeyi başlat
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatMessage[];

            setChatMessages(msgs);

            // Okundu bilgisini güncelle (Karşı tarafın attığı mesajları okundu yap)
            snapshot.docs.forEach(async (docSnap) => {
                const msgData = docSnap.data();
                if (msgData.senderId !== user.uid && !msgData.read) {
                    await updateDoc(doc(db, "chats", chatId, "messages", docSnap.id), { read: true });
                }
            });
        });

        // Sohbetten çıkınca dinlemeyi durdur
        return () => unsubscribe();
    }, [chatTarget, user]); // chatTarget değiştiğinde (başka sohbete girince) tekrar çalışır

    // --- GÖREV İÇİ YORUMLARI DİNLEME (DÜZELTİLMİŞ & GÜVENLİ VERSİYON) ---
    // --- GÖREV İÇİ YORUMLARI DİNLEME (DÜZELTİLMİŞ) ---
    useEffect(() => {
        if (!selectedTask || !user) return;

        // 1. Veritabanı sahibini belirle
        let targetDbId = user.uid;

        if (selectedTask.assignedTo) {
            targetDbId = selectedTask.assignedTo;
        } else if (selectedTask.assignedBy && selectedTask.assignedBy !== user.uid) {
            targetDbId = user.uid;
        }

        // Konsoldan yolu kontrol et (Hata ayıklamak için)
        console.log(`💬 Sohbet Bağlanıyor: users/${targetDbId}/tasks/${selectedTask.id}/comments`);

        const q = query(
            collection(db, "users", targetDbId, "tasks", selectedTask.id, "comments")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // TypeScript HATASI ÇÖZÜMÜ: 'as any[]' ekledik
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as any[];

            // Telefon içinde sıralama (Hata riskini azaltır)
            msgs.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeA - timeB;
            });

            setTaskComments(msgs);
        }, (error) => {
            console.log("Sohbet Yükleme Hatası:", error);
        });

        return () => unsubscribe();
    }, [selectedTask, user]);
    // --- SOHBET AÇILDIĞINDA MESAJLARI OKUNDU YAP (DÜZELTİLMİŞ) ---
    useEffect(() => {
        // Sohbet sekmesi açık değilse veya görev seçili değilse işlem yapma
        if (taskModalTab !== 'chat' || !selectedTask || !user) return;

        const markAsRead = async () => {
            let targetDbId = user.uid;
            if (selectedTask.assignedTo) {
                targetDbId = selectedTask.assignedTo;
            }

            // Sadece 'read == false' olanları çek (Sender kontrolünü aşağıda yapacağız)
            // Bu sayede Index hatasından kurtuluruz.
            const q = query(
                collection(db, "users", targetDbId, "tasks", selectedTask.id, "comments"),
                where("read", "==", false)
            );

            try {
                const snapshot = await getDocs(q);

                // Hepsini tek tek kontrol et ve güncelle
                snapshot.docs.forEach(async (docSnap) => {
                    const data = docSnap.data();

                    // Eğer mesajı gönderen BEN DEĞİLSEM, okundu yap.
                    if (data.senderId !== user.uid) {
                        await updateDoc(docSnap.ref, {
                            read: true
                        });
                    }
                });
            } catch (error) {
                console.log("Okundu işaretleme hatası:", error);
            }
        };

        markAsRead();
    }, [taskModalTab, selectedTask, user, taskComments]); // <--- taskComments EKLENDİ

    // --- SOHBET AÇILDIĞINDA MESAJLARI OKUNDU YAP ---
    useEffect(() => {
        // Sohbet sekmesi açık değilse veya görev seçili değilse işlem yapma
        if (taskModalTab !== 'chat' || !selectedTask || !user) return;

        const markAsRead = async () => {
            let targetDbId = user.uid;
            if (selectedTask.assignedTo) {
                targetDbId = selectedTask.assignedTo;
            }

            // Okunmamış ve göndereni ben OLMAYAN mesajları bul
            const q = query(
                collection(db, "users", targetDbId, "tasks", selectedTask.id, "comments"),
                where("read", "==", false),
                where("senderId", "!=", user.uid)
            );

            const snapshot = await getDocs(q);

            // Hepsini tek tek "read: true" olarak güncelle
            snapshot.forEach(async (docSnap) => {
                await updateDoc(doc(db, "users", targetDbId, "tasks", selectedTask.id, "comments", docSnap.id), {
                    read: true
                });
            });
        };

        markAsRead();
    }, [taskModalTab, selectedTask, user]); // Sekme değiştiğinde çalışır

    // --- GÖREV YORUMU GÖNDERME (GÜNCELLENDİ) ---
    // --- GÖREV YORUMU VE BİLDİRİM GÖNDERME ---
    const sendTaskComment = async () => {
        if (!taskCommentInput.trim() || !selectedTask || !user) return;

        // 1. Görevin durduğu yeri bul (Yukarıdaki mantığın aynısı)
        let taskOwnerId = user.uid;
        if (selectedTask.assignedTo) {
            taskOwnerId = selectedTask.assignedTo;
        }

        try {
            // 2. Yorumu Kaydet
            await addDoc(collection(db, "users", taskOwnerId, "tasks", selectedTask.id, "comments"), {
                text: taskCommentInput.trim(),
                senderId: user.uid,
                senderName: user.displayName || user.username,
                photoURL: user.photoURL || null,
                createdAt: serverTimestamp(),
                read: false
            });

            // 3. BİLDİRİM MANTIĞI
            // Senaryo A: Görevi ben oluşturdum (assignedBy benim), arkadaşıma yazdım -> Arkadaşa (assignedTo) bildirim gitmeli.
            // Senaryo B: Arkadaş bana atadı, ben yazdım -> Arkadaşa (assignedBy) bildirim gitmeli.

            let notificationTargetId = null;

            if (user.uid === selectedTask.assignedBy) {
                // Ben patronum, çalışana (assignedTo) bildirim gönder (Eğer kendim değilsem)
                if (selectedTask.assignedTo !== user.uid) {
                    notificationTargetId = selectedTask.assignedTo;
                }
            } else if (user.uid === selectedTask.assignedTo) {
                // Ben çalışanım, patrona (assignedBy) bildirim gönder
                notificationTargetId = selectedTask.assignedBy;
            }

            // Eğer bildirim gidecek bir hedef varsa
            if (notificationTargetId) {
                const targetUserDoc = await getDoc(doc(db, "public_users", notificationTargetId));
                if (targetUserDoc.exists()) {
                    const token = targetUserDoc.data().pushToken;
                    if (token) {
                        await sendPushNotification(
                            token,
                            `💬 ${user.displayName || user.username}`, // Başlık: Gönderen ismi
                            `${t('new_comment_task') || "Görev yorumu"}: ${taskCommentInput.trim()}`, // İçerik
                            { type: 'task_comment', taskId: selectedTask.id } // Data
                        );
                    }
                }
            }

            setTaskCommentInput("");
        } catch (e: any) {
            console.error("Yorum Gönderme Hatası:", e);
            showToast(t('warning_title'), t('cant_snd') + e.message, 'error');
        }
    };
    // --- GRUP ALIŞKANLIKLARINI DİNLEME ---
    useEffect(() => {
        if (!user) return;

        // 'members' dizisinde benim ID'm geçen grupları getir
        const q = query(
            collection(db, "habit_groups"),
            where("members", "array-contains", user.uid)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedGroups = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();

                // Üye detaylarını (Fotoğraf, İsim) çekelim ki UI'da gösterebilelim
                // (Bunu her render'da yapmak yerine cache mantığı kurulabilir ama şimdilik böyle yapalım)
                const memberDetails = await Promise.all(data.members.map(async (memberUid: string) => {
                    // Önce kendi listemizdeki contact'lara bakalım
                    const contact = contacts.find(c => c.uid === memberUid);
                    if (contact) return { uid: memberUid, displayName: contact.displayName, photoURL: contact.photoURL };

                    // Ben isem
                    if (memberUid === user.uid) return { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL };

                    // Listemizde yoksa (başka biri eklediyse) Public'ten çek
                    try {
                        const pubDoc = await getDoc(doc(db, "public_users", memberUid));
                        if (pubDoc.exists()) return pubDoc.data();
                    } catch (e) { }
                    return { uid: memberUid, displayName: "Üye", photoURL: null };
                }));

                return {
                    id: docSnap.id,
                    ...data,
                    memberDetails
                } as GroupHabit;
            }));

            setGroupHabits(fetchedGroups);
        });

        return () => unsubscribe();
    }, [user, contacts]); // Contacts değişirse isimler güncellensin diye ekledik

    useEffect(() => {
        const checkFirstLaunch = async () => {
            const hasLaunched = await AsyncStorage.getItem("hasLaunched");
            if (hasLaunched === null) {
                setShowOnboarding(true);
                await AsyncStorage.setItem("hasLaunched", "true");
            }
        };
        checkFirstLaunch();
    }, []);
    // --- APPLE LOGIN (GÜNCELLENMİŞ) ---
    const handleAppleLogin = async () => {
        try {
            // 1. İşlem başladığını kullanıcıya hissettir
            setIsAuthLoading(true);

            // 2. Apple Native Penceresini Aç
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            console.log("Apple Credential Alındı:", credential); // Konsoldan takip et

            const { identityToken } = credential;

            if (identityToken) {
                // 3. Firebase ile Bağlantı Kur
                const provider = new OAuthProvider('apple.com');
                const oAuthCredential = provider.credential({ idToken: identityToken });

                // Bu işlem başarılı olursa, useEffect'teki onAuthStateChanged tetiklenir ve sayfayı yönlendirir.
                await signInWithCredential(auth, oAuthCredential);
                console.log("Firebase Apple Girişi Başarılı!");
            } else {
                throw new Error("Apple Identity Token alınamadı.");
            }

        } catch (e: any) {
            setIsAuthLoading(false); // Hata olursa loading'i kapat
            console.error("Apple Login Hatası:", e);

            // Kullanıcı vazgeçtiyse hata gösterme
            if (e.code === 'ERR_CANCELED') {
                console.log("Kullanıcı girişi iptal etti.");
            } else {
                // Gerçek hatayı ekrana bas
                showToast(t('warning_title'), t('apple_login_failed') + e.message, 'error');
            }
        }
    };
    // --- MİSAFİR UYARISI ---
    const checkGuest = (actionName: string) => {
        if (user && user.isAnonymous) {
            askConfirmation(
                t('auth_guest_title') || t('auth_guest_title'),
                tFormat('feature_login_required', { actionName: 'Mesaj Gönderme' }),
                handleLogout // Onayla'ya basınca çıkış yapar (Kayıt ekranına döner)
            );
            return true; // İşlemi durdurur
        }
        return false;
    };

    // --- MİSAFİR GİRİŞİ ---
    // --- MİSAFİR GİRİŞİ ---
    const handleGuestLogin = async () => {
        // 1. Loading başlat
        setIsAuthLoading(true);
        console.log("Misafir girişi başlatılıyor...");

        try {
            // 2. Firebase Anonim Giriş İsteği
            const userCredential = await signInAnonymously(auth);
            const guestUser = userCredential.user;

            console.log("Misafir girişi başarılı, ID:", guestUser.uid);

            // 3. Veritabanına kayıt (Hata alsa bile giriş başarılı sayılsın diye try-catch içinde)
            try {
                await setDoc(doc(db, "users", guestUser.uid), {
                    uid: guestUser.uid,
                    username: "misafir_" + Math.floor(Math.random() * 100000),
                    displayName: "Misafir Kullanıcı",
                    createdAt: serverTimestamp(),
                    categories: [
                        { id: 'work', name: 'İş', color: 'blue' },
                        { id: 'home', name: 'Ev', color: 'orange' },
                        { id: 'personal', name: 'Kişisel', color: 'green' }
                    ],
                    isGuest: true
                });
            } catch (dbError) {
                console.log("Veritabanı oluşturma hatası (Önemli değil, giriş yapıldı):", dbError);
            }

            // Başarılı olduğunda useEffect'teki onAuthStateChanged tetiklenecek ve sayfayı açacaktır.

        } catch (error: any) {
            console.error("Misafir Giriş Hatası:", error);

            let errorMsg = error.message;
            if (error.code === 'auth/operation-not-allowed') {
                errorMsg = "Firebase konsolundan 'Anonymous' girişi açılmamış.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMsg = "İnternet bağlantınızı kontrol edin.";
            }

            showToast(t('login_error'), errorMsg, 'error');
        } finally {
            // 4. İşlem bitti, loading'i kapat
            setIsAuthLoading(false);
        }
    };
    // --- MEVCUT useEffect'LERİN ALTINA EKLE ---

    // Dil değiştiğinde Takvim dilini de otomatik güncelle
    useEffect(() => {
        // Eğer seçilen dil (örn: 'ja', 'uk') config dosyasında tanımlıysa onu yap
        if (LocaleConfig.locales[lang]) {
            LocaleConfig.defaultLocale = lang;
        } else {
            // Tanımlı değilse (garanti olsun diye) İngilizce yap
            LocaleConfig.defaultLocale = 'en';
        }
    }, [lang]); // 'lang' değiştiğinde bu kod çalışır

    // -------------------------------------------
    // --- EFFECT: AUTH & DATA ---
    // --- GÜNCELLENMİŞ AUTH & VERİ ÇEKME KODU ---
    // --- AUTH & USER DATA LISTENER (DÜZELTİLMİŞ HALİ) ---
    useEffect(() => {
        const checkPersistence = async () => {
            // Kullanıcı daha önce "Beni Hatırla"yı kapattıysa, açılışta çıkış yap
            const shouldRemember = await AsyncStorage.getItem("ommio_remember_me");
            if (shouldRemember === "false") {
                await signOut(auth);
            }
        };
        checkPersistence();
        const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // 1. Auth objesini başlangıç olarak ayarla
                // Not: user.delete() gibi fonksiyonların çalışması için currentUser'ı yayıyoruz.
                setUser(currentUser);
                setIsAuthLoading(false);
                registerForPushNotificationsAsync().then(async (token) => {
                    if (token) {
                        // Token'ı kullanıcının dokümanına kaydet
                        await setDoc(doc(db, "users", currentUser.uid), { pushToken: token }, { merge: true });

                        // Public Users'a da kaydet (Başkaları bize mesaj atabilsin diye)
                        // NOT: Public Users koleksiyonunda olup olmadığınızı kontrol edin, yoksa oluşturun.
                        try {
                            await setDoc(doc(db, "public_users", currentUser.uid), { pushToken: token }, { merge: true });
                        } catch (e) { }
                    }
                    generateAndStoreKeys(currentUser.uid);
                });

                try {
                    const userDocRef = doc(db, "users", currentUser.uid);

                    // 2. Veritabanını Canlı Dinle (onSnapshot)
                    const unsubDb = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const userData = docSnap.data();

                            // BURASI ÖNEMLİ: Veritabanından gelen TÜM verileri (username, photoURL, categories vb.)
                            // mevcut user state'inin üzerine yazıyoruz.
                            setUser((prev: any) => ({
                                ...prev,       // Auth'dan gelen temel bilgiler ve metotlar korunsun
                                ...userData    // Firestore'dan gelen güncel username, photoURL, vb. üzerine yazılsın
                            }));
                            if (userData.hasSeenOnboarding === false || userData.hasSeenOnboarding === undefined) {
                                setShowOnboarding(true);
                            } else {
                                setShowOnboarding(false);
                            }

                            // Premium bilgisini ayrıca state'e at
                            setIsPremium(userData.isPremium || false);
                        }
                    });

                    // Cleanup (Component kapanırsa dinlemeyi durdur) için array'e atılabilir 
                    // ama şimdilik basit tutuyoruz.

                } catch (e) {
                    console.log("Veri çekme hatası", e);
                }
            } else {
                setUser(null);
                setIsAuthLoading(false);
            }
        });

        return () => unsubAuth();
    }, []);

    useEffect(() => { setInputStartDate(formatDateDDMMYYYY(selectedDate)); }, [selectedDate]);
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedLang = await AsyncStorage.getItem("ommio_lang");
                const savedTheme = await AsyncStorage.getItem("ommio_theme");
                if (savedLang) setLang(savedLang as LangCode);
                if (savedTheme) setTheme(savedTheme as ThemeMode);
            } catch (e) { }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            try {
                await AsyncStorage.setItem("ommio_lang", lang);
                await AsyncStorage.setItem("ommio_theme", theme);
            } catch (e) { }
        };
        saveSettings();
    }, [lang, theme]);

    // --- REKLAM TETİKLEYİCİ FONKSİYON ---
    // --- REKLAM TETİKLEYİCİ ---
    const checkAdTrigger = (type: 'tasks' | 'habits' | 'assigned') => {
        if (isPremium) return; // Premium ise hiç uğraşma

        setAdCounters(prev => {
            const newVal = prev[type] + 1;
            if (newVal >= AD_THRESHOLDS[type]) {
                // Reklamı açmadan önce sayacı 5'e sıfırla
                setAdCountdown(5);
                setIsAdVisible(true);
                return { ...prev, [type]: 0 };
            }
            return { ...prev, [type]: newVal };
        });
    };

    // --- REKLAM GERİ SAYIM MANTIĞI ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAdVisible && adCountdown > 0) {
            interval = setInterval(() => {
                setAdCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isAdVisible, adCountdown]);

    // --- ARKA PLAN ZAMANLAYICI (10 Dk) ---
    useEffect(() => {
        if (!user || isPremium || isAdVisible) return;
        const timer = setInterval(() => {
            setAdCounters(prev => {
                const newTime = prev.time + 1;
                if (newTime >= AD_THRESHOLDS.time) {
                    setAdCountdown(5); // Süreyi resetle
                    setIsAdVisible(true);
                    return { ...prev, time: 0 };
                }
                return { ...prev, time: newTime };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [user, isPremium, isAdVisible]);

    // --- EKSİK OLAN PARÇA: GELEN ARKADAŞLIK İSTEKLERİNİ DİNLEME ---
    useEffect(() => {
        if (!user) return;

        // Kullanıcının "friend_requests" koleksiyonunu dinle
        const q = query(
            collection(db, "users", user.uid, "friend_requests"),
            orderBy("createdAt", "desc") // En yeni istek en üstte görünsün
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as FriendRequest[];

            console.log("Gelen İstekler:", requests); // Konsoldan kontrol etmek için
            setFriendRequests(requests);
        });

        return () => unsubscribe();
    }, [user]);

    // 1. GÖREVLERİ DİNLEME (Tasks Listener) // --- CONTACTS GÜNCELLEME MANTIĞI (FOTOĞRAFLARI CANLI TUTAR) ---
    // --- EKSİK OLAN KISIM BAŞLANGICI ---
    useEffect(() => {
        if (!user) return;

        // Kullanıcının "tasks" koleksiyonunu oluşturulma tarihine göre dinle
        const q = query(
            collection(db, "users", user.uid, "tasks"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Task[];
            setTasks(fetchedTasks);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. ALIŞKANLIKLARI DİNLEME (Habits Listener)
    useEffect(() => {
        if (!user) return;

        // Kullanıcının "habits" koleksiyonunu dinle
        const q = query(
            collection(db, "users", user.uid, "habits"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedHabits = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Habit[];
            setHabits(fetchedHabits);
        });

        return () => unsubscribe();
    }, [user]);

    // --- CONTACTS GÜNCELLEME MANTIĞI (İSİM, GÖRÜNEN İSİM VE FOTOĞRAF SENKRONİZASYONU) ---
    // --- CONTACTS GÜNCELLEME MANTIĞI (FOTOĞRAF, İSİM VE PUBLIC KEY SENKRONİZASYONU) ---
    useEffect(() => {
        if (!user) return;

        const qContacts = query(collection(db, "users", user.uid, "contacts"));

        const unsubC = onSnapshot(qContacts, async (snap) => {
            const localContacts = snap.docs.map(d => d.data() as Contact);

            // Her arkadaşın GÜNCEL bilgilerini Public tablodan çekiyoruz
            const syncedContacts = await Promise.all(localContacts.map(async (contact) => {
                try {
                    const publicDoc = await getDoc(doc(db, "public_users", contact.uid));

                    if (publicDoc.exists()) {
                        const pData = publicDoc.data();
                        return {
                            ...contact,
                            // Eğer arkadaşın displayName'i varsa onu al, yoksa username'i kullan
                            displayName: pData.displayName || pData.username,
                            username: pData.username || contact.username,
                            photoURL: pData.photoURL || null,

                            // 👇👇👇 EKSİK OLAN SATIR BUYDU 👇👇👇
                            // Şifre çözmek için karşı tarafın anahtarını mutlaka almalıyız
                            publicKey: pData.publicKey || null
                        };
                    }
                    // Public veri yoksa mevcut veriyi kullan
                    return { ...contact, displayName: contact.displayName || contact.username };
                } catch (e) {
                    return contact;
                }
            }));

            setContacts(syncedContacts);
        });

        return () => unsubC();
    }, [user]);
    // --- CHAT ÖNİZLEMELERİNİ DİNLEME (TYPESCRIPT DÜZELTMELİ) ---
    // --- CHAT ÖNİZLEMELERİNİ DİNLEME (TYPESCRIPT DÜZELTİLMİŞ) ---
    useEffect(() => {
        if (!user || contacts.length === 0) return;

        // HATA ÇÖZÜMÜ 1: Dizinin tipini belirtiyoruz
        const unsubscribers: (() => void)[] = [];

        contacts.forEach(contact => {
            const chatId = [user.uid, contact.uid].sort().join('_');

            // Sıralama yapmadan çekiyoruz (Index hatası almamak için)
            const q = query(collection(db, "chats", chatId, "messages"));

            const unsub = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const docs = snapshot.docs.map(doc => doc.data());

                    // Client-side sıralama
                    docs.sort((a, b) => {
                        const timeA = a.timestamp?.seconds || 0;
                        const timeB = b.timestamp?.seconds || 0;
                        return timeB - timeA;
                    });

                    const lastMsg = docs[0];

                    // Okunmamış mesaj sayısı hesaplama
                    const unreadCount = docs.filter(d =>
                        d.senderId !== user.uid &&
                        (d.read === false || d.read === undefined)
                    ).length;

                    // HATA ÇÖZÜMÜ 2: prev parametresine 'any' tipi veriyoruz
                    setChatPreviews((prev: any) => ({
                        ...prev,
                        [contact.uid]: {
                            text: lastMsg.text,
                            timestamp: lastMsg.timestamp,
                            unread: unreadCount // Bu değer UI'da kırmızı balonu yakar
                        }
                    }));
                } else {
                    // HATA ÇÖZÜMÜ 3: prev parametresine 'any' tipi veriyoruz
                    setChatPreviews((prev: any) => ({
                        ...prev,
                        [contact.uid]: { text: t('no_message'), timestamp: null, unread: 0 }
                    }));
                }
            });
            unsubscribers.push(unsub);
        });

        return () => {
            unsubscribers.forEach(u => u());
        };
    }, [contacts, user]);

    // --- EFFECT: CHAT ---


    useEffect(() => {
        // Sadece Android'de çalışsın, Web veya iOS'ta hata vermesin
        if (Platform.OS === 'android') {

            // Verileri hazırla
            const todayISO = getISODate(new Date());

            // 1. Bugüne ait görevleri filtrele
            const todaysTasks = tasks.filter(t => {
                if (t.date === todayISO) return true;
                // Her gün tekrar edenler vs.
                if (t.showEveryDayUntilDue && t.dueDate) return todayISO >= t.date && todayISO <= convertDDMMYYYYtoISO(t.dueDate);
                return false;
            }).map(t => ({ text: t.text, completed: t.completed })); // Sadece gerekli veriyi al

            // 2. Bugüne ait alışkanlıkları filtrele
            const todaysHabitsData = habits.filter(h => {
                // Basit filtreleme (Detaylı mantığınızı buraya koyabilirsiniz)
                if (h.frequency === 'daily') return true;
                if (h.frequency === 'weekly') return h.selectedDays.includes(new Date().getDay());
                return false;
            }).map(h => ({
                title: h.title,
                completed: h.completedDates.includes(todayISO)
            }));

            try {
                // @ts-ignore
                requestWidgetUpdate({
                    widgetName: 'OmmioWidget',
                    renderWidget: () => (
                        <WidgetTaskHandler
                            tasks={todaysTasks}
                            habits={todaysHabitsData}
                            isPremium={isPremium}
                        />
                    ),
                    widgetNotFound: () => {
                        console.log("Widget ana ekrana eklenmemiş.");
                    }
                });
            } catch (e) {
                console.log("Widget güncelleme hatası:", e);
            }
        }
    }, [tasks, habits]); // Tasks VEYA Habits değiştiğinde çalışır

    const t = (key: string) => {
        // @ts-ignore
        return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
    };
    const tFormat = (key: string, params: Record<string, string | number>) => {
        let text = t(key);
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{{${k}}}`, String(v));
        });
        return text;
    };
    // --- FONKSİYONLAR ---
    // --- ARKADAŞ SİLME ---
    const handleRemoveFriend = async (targetUid: string, targetName: string) => {
        // Önce kullanıcıdan onay alalım
        askConfirmation(
            t('remove_friend'),
            tFormat('friend_remove_confirm', { targetName }),
            async () => {
                try {
                    // Promise.all ile İKİ TARAFTAN DA aynı anda siliyoruz
                    await Promise.all([
                        // 1. Benim listemden sil
                        deleteDoc(doc(db, "users", user.uid, "contacts", targetUid)),

                        // 2. Karşı tarafın listesinden beni sil
                        deleteDoc(doc(db, "users", targetUid, "contacts", user.uid))
                    ]);

                    showToast(t('success'), tFormat('friend_removed', { targetName }), 'success');

                    // State'i (Ekranı) güncellememiz lazım ki hemen kaybolsun
                    // (Firestore listener'ı bazen gecikebilir, bu satır anlık tepki verir)
                    setContacts(prev => prev.filter(c => c.uid !== targetUid));

                } catch (e: any) {
                    console.log(e);
                    showToast(t('warning_title'), t('delete_incomplete') + e.message, 'error');
                }
            },
            true // Kırmızı buton (Tehlikeli işlem)
        );
    };
    // --- MİSAFİR HESABINI KALICI HESABA ÇEVİRME ---
    const handleConvertGuest = async () => {
        // 1. Validasyonlar
        if (!username.trim()) {
            showToast(t('missing_info'), t('auth_username_required'), 'warning');
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            showToast(t('missing_info'), t('enter_valid_email'), 'warning');
            return;
        }
        if (password.length < 6) {
            showToast(t('missing_info'), t('password_min_length'), 'warning');
            return;
        }

        if (!auth.currentUser) {
            showToast(t('warning_title'), t('session_not_found'), 'error');
            return;
        }

        setIsAuthLoading(true);

        try {
            // 2. Kullanıcı Adı Kontrolü
            const cleanUsername = username.trim().toLowerCase()
                .replace(/\s+/g, '')
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

            const q = query(collection(db, "public_users"), where("username", "==", cleanUsername));
            const checkUser = await getDocs(q);

            if (!checkUser.empty) {
                setIsAuthLoading(false);
                showToast(t('warning_title'), t('profile_username_taken'), 'warning');
                return;
            }

            // 3. HESAP BAĞLAMA İŞLEMİ
            const credential = EmailAuthProvider.credential(email, password);
            const userCredential = await linkWithCredential(auth.currentUser, credential);
            const linkedUser = userCredential.user;

            // --- YENİ EKLENEN KISIM: E-POSTA DOĞRULAMA GÖNDER ---
            await sendEmailVerification(linkedUser);
            // -----------------------------------------------------

            // 4. Firestore Verilerini Güncelleme
            const updates = {
                username: cleanUsername,
                displayName: username,
                email: email,
                isGuest: false, // Artık misafir değil
                categories: categories
            };

            await setDoc(doc(db, "users", linkedUser.uid), updates, { merge: true });

            await setDoc(doc(db, "public_users", linkedUser.uid), {
                uid: linkedUser.uid,
                username: cleanUsername,
                displayName: username,
                photoURL: null
            });

            await setDoc(doc(db, "usernames", cleanUsername), {
                email: email
            });

            // 5. Başarılı
            setIsAuthLoading(false);
            setIsGuestModalOpen(false); // Modalı kapat

            // Kullanıcıya bilgi ver
            showToast(t('success'), t('crct_maill'), 'success');

            // Not: Kullanıcı artık "isGuest: false" olduğu için ve "emailVerified: false" olduğu için,
            // return bloğundaki "E-posta Doğrulama Ekranı" otomatik olarak devreye girecektir.

        } catch (error: any) {
            setIsAuthLoading(false);
            console.error("Link Error:", error);

            let msg = t('process_failed');
            if (error.code === 'auth/email-already-in-use') {
                msg = t('email_in_use');
            } else if (error.code === 'auth/credential-already-linked') {
                msg = t('account_already_linked');
            } else if (error.code === 'auth/invalid-email') {
                msg = t('invalid_email_again');
            } else if (error.code === 'auth/weak-password') {
                msg = t('weak_password');
            }

            showToast(t('error_title'), msg, 'error');
        }
    };
    // --- ENGELLEME (Basitçe siliyoruz ama farklı mesaj veriyoruz, istersen 'blocked' koleksiyonu yapabilirsin) ---
    const handleBlockFriend = async (targetUid: string, targetName: string) => {
        askConfirmation(
            t('friend_block_title'),
            `${targetName} {t('block_user_confirm')}`,
            async () => {
                try {
                    // 1. Arkadaşlıktan çıkar (Her iki taraftan)
                    await deleteDoc(doc(db, "users", user.uid, "contacts", targetUid));
                    await deleteDoc(doc(db, "users", targetUid, "contacts", user.uid));

                    // 2. Engellenenler listesine ekle (arrayUnion kullanıyoruz)
                    await updateDoc(doc(db, "users", user.uid), {
                        blockedUsers: arrayUnion(targetUid)
                    });

                    showToast(t('friend_block_title'), `${targetName} ${t('friend_blocked_success')}`, 'success');
                } catch (e) {
                    // Eğer blockedUsers alanı henüz yoksa hata verebilir, setDoc ile merge yapalım
                    try {
                        await setDoc(doc(db, "users", user.uid), { blockedUsers: [targetUid] }, { merge: true });
                        // Tekrar silmeyi dene
                        await deleteDoc(doc(db, "users", user.uid, "contacts", targetUid));
                        await deleteDoc(doc(db, "users", targetUid, "contacts", user.uid));
                        showToast(t('friend_block_title'), `${targetName} ${t('friend_blocked_success')}`, 'success');
                    } catch (err) {
                        showToast(t('error_title'), t('process_failed'), 'error');
                    }
                }
            },
            true // Kırmızı buton
        );
    };
    const formatChatTime = (timestamp: any) => {
        if (!timestamp) return "";
        const date = new Date(timestamp.seconds * 1000);
        const now = new Date();

        // Bugün ise sadece saat
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // Dün veya daha eski ise tarih
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    };
    const sendMessage = async () => {
        // 1. Validasyonlar
        if (!chatInput.trim() || !chatTarget || !user) return;

        const chatId = [user.uid, chatTarget.uid].sort().join('_');
        const plainText = chatInput;
        setChatInput(""); // Inputu hemen temizle

        // ---------------------------------------------------------
        // ADIM A: ANAHTARLARI BUL (Hem onun hem senin)
        // ---------------------------------------------------------

        // 1. Karşı Tarafın Public Key'i
        let targetPublicKey = chatTarget.publicKey;
        if (!targetPublicKey) {
            // Eğer sohbet listesinden gelmiyorsa veritabanından çek
            const userDoc = await getDoc(doc(db, "public_users", chatTarget.uid));
            if (userDoc.exists()) {
                targetPublicKey = userDoc.data().publicKey;
            }
        }

        // 2. Benim Public Key'im (Kendi kopyamı şifrelemek için)
        let myPublicKey = user.publicKey;
        if (!myPublicKey) {
            // Eğer user state'inde yoksa veritabanından çek
            const myDoc = await getDoc(doc(db, "public_users", user.uid));
            if (myDoc.exists()) {
                myPublicKey = myDoc.data().publicKey;
            }
        }

        // ---------------------------------------------------------
        // ADIM B: ÇİFT ŞİFRELEME YAP (Sender Copy Metodu)
        // ---------------------------------------------------------

        // Varsayılan olarak düz metin (Eğer anahtar yoksa güvenlik açığı olmasın diye şifresiz gider)
        let messageForReceiver = plainText;
        let messageForMe = plainText;

        // 1. Alıcı için şifrele (text alanına gidecek)
        if (targetPublicKey) {
            const encrypted = await encryptMessage(plainText, targetPublicKey);
            if (encrypted) messageForReceiver = encrypted;
        }

        // 2. Kendim için şifrele (senderCopy alanına gidecek)
        if (myPublicKey) {
            const encrypted = await encryptMessage(plainText, myPublicKey);
            if (encrypted) messageForMe = encrypted;
        }

        // ---------------------------------------------------------
        // ADIM C: VERİTABANINA KAYDET
        // ---------------------------------------------------------
        await addDoc(collection(db, "chats", chatId, "messages"), {
            text: messageForReceiver,       // Alıcının çözeceği şifre
            senderCopy: messageForMe,       // Sizin çözeceğiniz şifre
            senderId: user.uid,
            timestamp: serverTimestamp(),
            read: false
        });

        // ---------------------------------------------------------
        // ADIM D: BİLDİRİM GÖNDER (Opsiyonel)
        // ---------------------------------------------------------
        const targetPublicDoc = await getDoc(doc(db, "public_users", chatTarget.uid));
        if (targetPublicDoc.exists()) {
            const targetData = targetPublicDoc.data();
            if (targetData.pushToken) {
                // DİKKAT: Bildirime şifreli metin göndermek yerine "Yeni Mesaj" yazmak
                // veya düz metni (plainText) göndermek tercih meselesidir. 
                // Güvenlik için "Yeni bir mesajın var" yazdırıyoruz.
                await sendPushNotification(
                    targetData.pushToken,
                    `💬 ${user.displayName || user.username}`,
                    "🔒 Yeni şifreli mesaj",
                    { type: 'message', senderId: user.uid }
                );
            }
        }
    };
    const handleDeleteChat = async () => {
        askConfirmation(
            t('delete_chat'),
            t('delete_chat_confirm'),
            async () => {
                if (!user || !chatTarget) return;
                const chatId = [user.uid, chatTarget.uid].sort().join('_');
                try {
                    // Mesajları tek tek sil (Firestore'da koleksiyonu tek seferde silemezsin)
                    const q = query(collection(db, "chats", chatId, "messages"));
                    const snapshot = await getDocs(q);
                    const batchPromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
                    await Promise.all(batchPromises);

                    setActiveTab('messages'); // Mesajlar sekmesine dön
                    setChatTarget(null);
                    showToast(t('success'), t('chat_deleted'), 'success');
                } catch (e) {
                    showToast(t('warning_title'), t('chat_delete_failed'), 'error');
                }
            },
            true // Kırmızı buton (isDestructive)
        );
    };


    // --- ŞİFRE DEĞİŞTİRME FONKSİYONU ---
    // --- ŞİFRE DEĞİŞTİRME / OLUŞTURMA FONKSİYONU ---
    // --- ŞİFRE SIFIRLAMA E-POSTASI GÖNDERME ---
    const handlePasswordChange = async () => {
        if (!user || !user.email) {
            showToast(t('error_title'), t('mail_cnt_f'), 'error');
            return;
        }

        setIsAuthLoading(true);

        try {
            // Firebase'in şifre sıfırlama mailini gönder
            await sendPasswordResetEmail(auth, user.email);

            showToast(t('success'), tFormat('password_reset_link_sent', { email: user.email }), 'success');
            setIsPasswordModalOpen(false); // Modalı kapat

        } catch (error: any) {
            console.log(error);

            let errorMsg = error.message;
            if (error.code === 'auth/too-many-requests') {
                errorMsg = "Çok sık istek gönderdiniz, lütfen biraz bekleyin.";
            }

            showToast(t('error_title'), t('faill') + errorMsg, 'error');
        } finally {
            setIsAuthLoading(false);
        }
    };
    // Bu fonksiyonu mevcut handleAuth yerine yapıştırın
    const handleAuth = async () => {
        // 1. Girdileri Temizle
        const inputVal = email.trim(); // Hem e-posta hem kullanıcı adı olabilir
        const cleanPassword = password.trim();

        // --- LOGIN İŞLEMİ ---
        if (authMode === 'login') {
            if (!inputVal || !cleanPassword) {
                showToast(t('warning_title'), t('fill_all_fields'), 'warning');
                return;
            }

            setIsAuthLoading(true);

            try {
                let emailToLogin = inputVal;

                // EĞER GİRİLEN DEĞER BİR E-POSTA DEĞİLSE (İçinde @ yoksa), KULLANICI ADIDIR
                if (!inputVal.includes('@')) {
                    // Kullanıcı adını temizle (küçük harf, boşluksuz)
                    const cleanUsername = inputVal.toLowerCase()
                        .replace(/\s+/g, '')
                        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

                    // --- GÜVENLİ YÖNTEM ---
                    // Query yerine doğrudan GET yapıyoruz.
                    // 'usernames' koleksiyonunda ID'si bu kullanıcı adı olan belgeyi çek
                    const usernameRef = doc(db, "usernames", cleanUsername);
                    const docSnap = await getDoc(usernameRef);

                    if (!docSnap.exists()) {
                        throw new Error("USER_NOT_FOUND"); // Böyle bir kullanıcı adı yok
                    }

                    // E-postasını al
                    emailToLogin = docSnap.data().email;
                }

                // Beni Hatırla Kontrolü
                if (rememberMe) {
                    await AsyncStorage.setItem("ommio_remember_me", "true");
                } else {
                    await AsyncStorage.setItem("ommio_remember_me", "false");
                }

                // Bulunan veya girilen E-posta ile giriş yap
                await signInWithEmailAndPassword(auth, emailToLogin, cleanPassword);

                // Başarılı olursa useEffect'teki auth listener otomatik yönlendirir, loading kapatmaya gerek yok.

            } catch (e: any) {
                setIsAuthLoading(false);
                console.error("Login Error:", e);

                let errorMsg = "Giriş başarısız.";
                if (e.message === "USER_NOT_FOUND") errorMsg = t('username_not_found');
                else if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') errorMsg = "Şifre veya kullanıcı bilgisi hatalı.";
                else if (e.code === 'auth/user-not-found') errorMsg = "Kullanıcı bulunamadı.";
                else if (e.code === 'auth/too-many-requests') errorMsg = "Çok fazla deneme yaptınız, lütfen bekleyin.";

                showToast(t('error_title'), errorMsg, 'error');
            }
        }
        // --- KAYIT OLMA (SIGNUP) İŞLEMİ ---
        // --- MEVCUT handleAuth İÇİNDEKİ else (SIGNUP) KISMINI BUNUNLA DEĞİŞTİR ---
        else {
            // 1. Kullanıcı Adı Kontrolü
            if (!username.trim()) {
                showToast(t('missing_info'), t('auth_username_required'), 'warning');
                return;
            }

            // 2. SIKI E-POSTA FORMAT KONTROLÜ (Regex)
            if (!isValidEmail(inputVal)) {
                showToast(t('error_title'), t('valid_mail_aub'), 'warning');
                return;
            }

            if (!cleanPassword) {
                showToast(t('missing_info'), t('enter_password'), 'warning');
                return;
            }

            setIsAuthLoading(true);

            try {
                const cleanUsername = username.trim().toLowerCase()
                    .replace(/\s+/g, '')
                    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

                // Kullanıcı adı daha önce alınmış mı kontrol et
                const q = query(collection(db, "public_users"), where("username", "==", cleanUsername));
                const checkUser = await getDocs(q);
                if (!checkUser.empty) {
                    setIsAuthLoading(false);
                    showToast(t('error_title'), t('profile_username_taken'), 'warning');
                    return;
                }

                // Kayıt İşlemi
                const cred = await createUserWithEmailAndPassword(auth, inputVal, cleanPassword);

                // --- YENİ EKLENEN KISIM: DOĞRULAMA MAİLİ GÖNDERME ---
                await sendEmailVerification(cred.user);
                // -----------------------------------------------------

                await updateProfile(cred.user, { displayName: username });

                const userData = {
                    uid: cred.user.uid,
                    username: cleanUsername,
                    displayName: username,
                    email: inputVal,
                    createdAt: serverTimestamp(),
                    hasSeenOnboarding: false,
                    categories: [
                        { id: 'work', name: 'İş', color: 'blue' },
                        { id: 'home', name: 'Ev', color: 'orange' },
                        { id: 'personal', name: 'Kişisel', color: 'green' }
                    ]
                };

                await setDoc(doc(db, "users", cred.user.uid), userData);

                await setDoc(doc(db, "public_users", cred.user.uid), {
                    uid: cred.user.uid,
                    username: cleanUsername,
                    originalUsername: username,
                    photoURL: null
                });

                await setDoc(doc(db, "usernames", cleanUsername), {
                    email: inputVal
                });


                const batch = writeBatch(db); // Toplu yazma işlemi başlat (Performans için)

                DEFAULT_HABITS.forEach((habit) => {
                    // Yeni bir döküman referansı oluştur
                    const newHabitRef = doc(collection(db, "users", cred.user.uid, "habits"));
                    
                    batch.set(newHabitRef, {
                        title: habit.titleKey, // DİKKAT: Buraya çeviri anahtarını ('habit_gym') kaydediyoruz. Gösterirken t() fonksiyonuna sokacağız.
                        frequency: 'daily',
                        selectedDays: [], // Daily olduğu için boş
                        endDate: null,
                        completedDates: [],
                        notificationTime: null,
                        notificationIds: [],
                        categoryId: 'personal', // Varsayılan kategori (ID'sinin 'personal' olduğundan emin olun)
                        createdAt: serverTimestamp()
                    });
                });

                await batch.commit(); // Hepsini tek seferde veritabanına gönder

                setIsAuthLoading(false);

                // Kullanıcıya bilgi ver
                showToast(t('success'),t('scs_verify'), 'success');


            } catch (e: any) {
                setIsAuthLoading(false);
                console.error("Signup Error:", e);
                let errorMsg = t('login_failed');

                if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                    errorMsg = t('wrong_password_msg') ;
                } else if (e.message === "USER_NOT_FOUND" || e.code === 'auth/user-not-found') {
                    errorMsg = t('username_not_found');
                } else if (e.code === 'auth/too-many-requests') {
                    errorMsg = t('too_many_requests') ;
                } else if (e.code === 'auth/invalid-email') {
                    errorMsg = t('invalid_email') ;
                }

                showToast(t('error_title'), errorMsg, 'error');
            }
        }
    }

    const handleLogout = async () => {
    try {
        // 1. ÖNCE WIDGET'I TEMİZLE (Boş veri gönder)
        // Görevler: [], Alışkanlıklar: [], Premium: false
        await updateWidgetData([], [], false); 
        console.log("Widget temizlendi.");

        // 2. SONRA ÇIKIŞ YAP
        await signOut(auth);
        setTasks([]);
        setHabits([]);
        
        // Web için auth ekranı kontrolü
        if (Platform.OS === 'web') {
            setShowAuth(false);
        }
        
        showToast(t('success'), t('logout_success'), 'success');

    } catch (e) {
        console.error("Çıkış hatası:", e);
    }
};

    const pickImage = async () => {
        try {
            console.log("Resim seçme işlemi başladı...");

            // 1. İzin İste
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                showToast(t('permission_required'), t('profile_gallery_perm'), 'warning');
                return;
            }

            // 2. Resmi Seç
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1, // Buradaki kalite önemli değil, aşağıda manipulator ile ayarlayacağız
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                console.log("Resim seçildi, yeniden boyutlandırılıyor...");

                // --- 3. RESMİ KÜÇÜLTME (RESIZE) İŞLEMİ ---
                // Genişliği 500px yapıyoruz, yükseklik otomatik ayarlanıyor.
                // Bu işlem boyutu 50KB - 150KB arasına düşürür.
                const manipResult = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 500 } }], // Genişliği 500px'e sabitle
                    {
                        compress: 0.7, // Kalite %70 (Gayet yeterli)
                        format: ImageManipulator.SaveFormat.JPEG,
                        base64: true // Base64 verisini istiyoruz
                    }
                );

                const finalBase64 = `data:image/jpeg;base64,${manipResult.base64}`;

                // Boyut Kontrolü (Artık buraya takılması imkansıza yakın)
                if (finalBase64.length > 1048487) {
                    showToast(t('file_too_large'), t('image_size_limit'), 'error');
                    return;
                }

                // 4. Kaydetme İşlemleri


                await setDoc(doc(db, "users", user.uid), { photoURL: finalBase64 }, { merge: true });

                try {
                    await setDoc(doc(db, "public_users", user.uid), { photoURL: finalBase64 }, { merge: true });
                } catch (e) { }

                setUser({ ...user, photoURL: finalBase64 });

                showToast(t('premium_congrats'), t('profile_photo_updated'), 'success');
            }
        } catch (e: any) {
            showToast(t('error'), "t('image_upload_failed')" + e.message, 'error');
        }
    };
    // --- PROFİL GÜNCELLEME FONKSİYONU ---
    const handleUpdateProfile = async () => {
        // 1. Girdileri Temizle
        const cleanDisplayName = editDisplayNameInput.trim();

        // Username değiştiyse temizle, değişmediyse eskisini tut
        const cleanUsername = editUsernameInput.trim().toLowerCase()
            .replace(/\s+/g, '')
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

        // 2. Validasyon (Kontrol)
        if (!cleanDisplayName) {
            showToast(t('warning_title'), t('display_name_required'), 'warning');
            return;
        }

        if (cleanUsername.length < 3) {
            showToast(t('warning_title'), t('profile_username_short'), 'warning');
            return;
        }

        // Değişiklik var mı kontrolü? (Gereksiz yere veritabanını yormayalım)
        const isNameChanged = cleanDisplayName !== user.displayName;
        const isUsernameChanged = cleanUsername !== user.username;

        if (!isNameChanged && !isUsernameChanged) {
            setIsEditProfileVisible(false); // Değişiklik yoksa kapat
            return;
        }

        try {
            // --- SENARYO A: Sadece Görünen İsim Değişiyor (En kolayı) ---
            if (isNameChanged && !isUsernameChanged) {
                // 1. Firebase Auth Profilini Güncelle
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { displayName: cleanDisplayName });
                }

                // 2. Veritabanlarını Güncelle
                await updateDoc(doc(db, "users", user.uid), { displayName: cleanDisplayName });
                await updateDoc(doc(db, "public_users", user.uid), { displayName: cleanDisplayName });

                // 3. State'i Güncelle (Anlık değişim için)
                setUser((prev: any) => ({ ...prev, displayName: cleanDisplayName }));
                showToast(t('success_label'), t('updt_naam'), 'success');
            }

            // --- SENARYO B: Kullanıcı Adı Değişiyor (Zor olan) ---
            else if (isUsernameChanged) {
                // Başkası almış mı kontrol et
                const q = query(collection(db, "public_users"), where("username", "==", cleanUsername));
                const check = await getDocs(q);

                if (!check.empty) {
                    showToast(t('error_title'), t('profile_username_taken'), 'error');
                    return;
                }

                // Müsaitse güncelle (Hem isim hem username)
                const updates = { username: cleanUsername, displayName: cleanDisplayName };

                if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: cleanDisplayName });

                await updateDoc(doc(db, "users", user.uid), updates);
                // Public tablosunda eski username ile olan kaydı silip yenisini yaratmak daha güvenlidir ama update de çalışır
                // Biz burada merge ile update yapıyoruz
                await setDoc(doc(db, "public_users", user.uid), updates, { merge: true });

                // State Güncelle
                setUser((prev: any) => ({ ...prev, ...updates }));
                showToast(t('success_label'), t('prof_comp'), 'success');
            }

            setIsEditProfileVisible(false); // Modalı kapat

        } catch (e: any) {
            console.error(e);
            showToast(t('error_title'), t('update_failed_generic'), 'error');
        }
    };

    const scheduleLocalNotification = async (title: string, body: string, timeString: string, type: 'notification' | 'alarm') => {
        if (Platform.OS === 'web') return null;
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            // İzin yoksa, kullanıcı o an talep ettiği için Toast göster
            showToast(t('permission_required'), t('notification_permission_required') || "Bildirimleri alabilmek için ayarlardan izin vermelisiniz.", 'warning');
            return null; // Bildirim kurmadan çık
        }

        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            const triggerDate = new Date(selectedDate);
            triggerDate.setHours(hours, minutes, 0, 0);

            // Tarih geçmişteyse yarına kur (Örn: Saat 14:00, kullanıcı 09:00'a alarm kurdu -> Yarın 09:00)
            if (triggerDate <= new Date()) {
                triggerDate.setDate(triggerDate.getDate() + 1);
            }

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: title,
                    body: body,
                    sound: true, // iOS için standart ses
                    // Android için özel kanal (Yüksek öncelikli)
                    color: type === 'alarm' ? COLORS.danger : COLORS.primary,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    data: { type: type },
                    // Eğer alarm ise Android'de özel kanal kullan
                    ...(Platform.OS === 'android' && type === 'alarm' ? { channelId: 'alarm' } : {}),
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE, // Bu satır EKLENDİ
                    date: triggerDate
                },
            });
            return id;
        } catch (e) {
            console.log("Bildirim hatası:", e);
            return null;
        }
    };

    // --- DOSYA SEÇME ---
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Tüm dosya türleri
                copyToCacheDirectory: true,
                multiple: true // Birden fazla seçime izin ver
            });

            if (!result.canceled && result.assets) {
                // Mevcut listeye ekle
                setAttachments(prev => [...prev, ...result.assets]);
            }
        } catch (err) {
            console.log("Dosya seçimi iptal veya hata:", err);
        }
    };

    // --- DOSYA YÜKLEME (Firebase Storage) ---
    const uploadFiles = async (taskId: string) => {
        if (attachments.length === 0) return [];

        const uploadedUrls = [];

        for (const file of attachments) {
            try {
                const response = await fetch(file.uri);
                const blob = await response.blob();

                // Dosya yolu: task_attachments/taskId/dosyaAdi
                const storageRef = ref(storage, `task_attachments/${taskId}/${file.name}`);

                await uploadBytes(storageRef, blob);
                const downloadUrl = await getDownloadURL(storageRef);

                uploadedUrls.push({
                    name: file.name,
                    url: downloadUrl,
                    type: file.mimeType
                });
            } catch (e) {
                console.error("Yükleme hatası:", e);
                showToast(t('error'), tFormat('file_upload_failed', { filename: file.name }), 'error');
            }
        }
        return uploadedUrls;
    };
    // --- BURAYI EKLE: iOS Widget Güncelleme Yardımcısı ---
    // --- WIDGET GÜNCELLEME FONKSİYONU (iOS & Android) ---
  // --- WIDGET GÜNCELLEME FONKSİYONU (iOS & Android Uyumlu) ---
  // --- WIDGET GÜNCELLEME FONKSİYONU (GÖREVLER + ALIŞKANLIKLAR) ---
  const updateWidgetData = async (currentTasks: Task[], currentHabits: Habit[], isPremiumUser: boolean) => {
    try {
      const todayISO = getISODate(new Date());

      // 1. GÖREVLERİ HAZIRLA
      const filteredTasks = currentTasks
        .filter(t => {
          if (t.date === todayISO) return true;
          if (t.showEveryDayUntilDue && t.dueDate) {
            return todayISO >= t.date && todayISO <= convertDDMMYYYYtoISO(t.dueDate);
          }
          return false;
        })
        .filter(t => !t.completed) // Yapılmamışlar öncelikli
        .sort((a, b) => {
           const priorityMap: Record<string, number> = { high: 1, medium: 2, low: 3 };
           return (priorityMap[a.priority || 'medium'] || 2) - (priorityMap[b.priority || 'medium'] || 2);
        })
        .slice(0, 4); // Max 4 görev

      // 2. ALIŞKANLIKLARI HAZIRLA
      const filteredHabits = currentHabits
        .filter(h => {
          if (h.endDate && h.endDate < todayISO) return false;
          if (h.frequency === 'daily') return true;
          if (h.frequency === 'weekly') return h.selectedDays.includes(new Date().getDay());
          return false;
        })
        .map(h => ({
            title: h.title,
            isCompleted: h.completedDates.includes(todayISO)
        }))
        .slice(0, 4); // Max 4 alışkanlık

      // --- iOS GÜNCELLEME ---
     if (Platform.OS === 'ios') {
        const combinedData = {
            tasks: filteredTasks.map(t => ({ title: t.text, isCompleted: t.completed })),
            habits: filteredHabits,
            isPremium: isPremiumUser // 👈 YENİ: Premium bilgisini ekledik
        };

        await SharedGroupPreferences.setItem('widgetData', JSON.stringify(combinedData), APP_GROUP_ID);
        WidgetCenter.reloadAllTimelines();
        console.log("📲 iOS Widget Güncellendi. Premium:", isPremiumUser);
      }

      // --- ANDROID GÜNCELLEME (Değişmedi) ---
      if (Platform.OS === 'android') {
        // Verileri Android formatına çevir
        const androidTasks = filteredTasks.map(t => ({ text: t.text, completed: t.completed }));
        const androidHabits = filteredHabits.map(h => ({ title: h.title, completed: h.isCompleted }));

        requestWidgetUpdate({
          widgetName: 'OmmioWidget',
          renderWidget: () => (
            // 👇 BURADA 'isPremium' prop'unu geçiyoruz ve TypeScript artık bunu tanıyor
            <WidgetTaskHandler 
                tasks={androidTasks} 
                habits={androidHabits} 
                isPremium={isPremiumUser} 
            />
          ),
          widgetNotFound: () => console.log("Android widget bulunamadı")
        });
      }

    } catch (error) {
      console.error("Widget Update Error:", error);
    }
  };
    const updateIOSWidget = (taskData: any) => {
        if (Platform.OS !== 'ios') return;

        try {
            const { SharedStorage } = NativeModules;
            if (SharedStorage) {
                const widgetPayload = {
                    text: taskData.text,
                    completed: taskData.completed,
                    date: taskData.date || "Bugün",
                    priority: taskData.priority || "normal"
                };
                
                // Swift tarafındaki anahtarla (TaskWidgetSmall_data) aynı olmalı
                const jsonValue = JSON.stringify(widgetPayload);
                SharedStorage.set("TaskWidgetSmall_data", jsonValue);
                console.log("📲 iOS Widget güncellendi:", widgetPayload);
            }
        } catch (e) {
            console.error("Widget güncelleme hatası:", e);
        }
    };
    // -----------------------------------------------------
    const addTask = async () => {
        // 1. Validasyon
        if (!inputValue.trim()) {
            showToast(t('warning_title'), t('missing_info'), 'warning');
            return;
        }
        if (!user) return;

        setIsAuthLoading(true);
        // Eğer dosya varsa loading yazısını güncellemek istersen state kullanabilirsin
        if (attachments.length > 0) setIsUploading(true);

        try {
            let finalStartDate = inputStartDate;
            if (!finalStartDate || finalStartDate.length < 10) {
                finalStartDate = formatDateDDMMYYYY(selectedDate);
            }
            const formattedStart = convertDDMMYYYYtoISO(finalStartDate);

            // --- GEÇİCİ TASK ID OLUŞTURMA (Dosyalar için klasör adı olacak) ---
            // Not: Firestore'a eklerken ID'yi manuel vereceğiz veya doc.id kullanacağız.
            // Burada basitçe random bir ID üretiyoruz ki dosyaları yükleyebilelim.
            const tempTaskId = Math.random().toString(36).substring(2, 15);

            // 2. ÖNCE DOSYALARI YÜKLE
            let uploadedFiles: { name: string; url: string; type?: string }[] = [];
            if (attachments.length > 0) {
                uploadedFiles = await uploadFiles(tempTaskId);
            }

            // 3. ATAMA LİSTESİNİ HAZIRLA
            // Eğer kimse seçilmediyse, kendime ata.
            // Eğer seçildiyse, seçilenleri listeye al.
            let targetList = assignTargets.length > 0 ? assignTargets : [{ uid: user.uid, username: user.username, canAssignToMe: true } as Contact];

            // 4. DÖNGÜ: Her bir kişi için görevi oluştur
            // Promise.all ile paralel yapıyoruz ki hızlı olsun
            await Promise.all(targetList.map(async (target) => {

                // Misafir / İzin Kontrolü (Başkasıysa)
                if (target.uid !== user.uid) {
                    // Burada detaylı izin kontrolü yapılabilir
                }

                // Kategori belirle (Kendi varsayılanı veya seçili olan)
                let finalCategoryId = selectedCategory.id;
                if (target.uid !== user.uid && target.defaultCategoryId) {
                    finalCategoryId = target.defaultCategoryId;
                }

                // Bildirim/Alarm Sadece KENDİME atıyorsam veya atanan kişi ben isem kurulur
                // (Başkasına alarm kuramazsın, sadece push notification gider)
                let notifId = null, alarmId = null;
                if (target.uid === user.uid) {
                    if (isNotifOn && notifInput.length === 5) {
                        notifId = await scheduleLocalNotification(t('notification'), inputValue, notifInput, 'notification');
                    }
                    if (isAlarmOn && alarmInput.length === 5) {
                        alarmId = await scheduleLocalNotification(t('alarm'), inputValue, alarmInput, t('alarm'));
                    }
                }

                // Görev Objesi
                const newTaskData = {
                    text: inputValue,
                    description: inputDesc,
                    completed: false,
                    date: formattedStart,
                    dueDate: inputDueDate.length >= 10 ? inputDueDate : null,
                    showEveryDayUntilDue: isEveryDayOn,
                    categoryId: finalCategoryId,
                    priority: priority, // YENİ: Öncelik
                    attachments: uploadedFiles, // YENİ: Dosyalar
                    assignedBy: user.uid,
                    assignedByName: user.displayName || user.username,
                    assignedTo: target.uid, // Bu kopya kime ait?
                    assignedToName: target.username || target.displayName,
                    isMultiAssigned: targetList.length > 1, // Çoklu atama mı?
                    createdAt: serverTimestamp(),
                    notificationId: notifId,
                    alarmId: alarmId,
                };

                // Kaydet
                await addDoc(collection(db, "users", target.uid, "tasks"), newTaskData);

                // Bildirim Gönder (Eğer başkasına atadıysam)
                if (target.uid !== user.uid) {
                    try {
                        const targetDoc = await getDoc(doc(db, "public_users", target.uid));
                        if (targetDoc.exists() && targetDoc.data().pushToken) {
                            await sendPushNotification(
                                targetDoc.data().pushToken,
                                t('new_task_assigned'),
                                `${user.displayName} sana bir görev atadı: ${inputValue} (${t('priority_' + priority)})`,
                                { type: 'task' }
                            );
                        }
                    } catch (e) { }
                    checkAdTrigger('assigned');
                }
            }));    
            const latestTaskForWidget = {
                text: inputValue,
                completed: false,
                date: formattedStart,
                priority: priority // State'den gelen öncelik
            };
            updateIOSWidget(latestTaskForWidget);

            // --- TEMİZLİK ---
            setIsAddModalOpen(false);
            setInputValue("");
            setInputDesc("");
            setNotifInput("");
            setAlarmInput("");
            setAttachments([]); // Dosyaları temizle
            setAssignTargets([]); // Seçili kişileri temizle
            setPriority('medium'); // Önceliği sıfırla
            setIsInputExpanded(false);
            Keyboard.dismiss();
            showToast(t('success'), targetList.length > 1 ? t('task_assigned_to_all') : t('task_added'), 'success');

        } catch (error: any) {
            console.error(error);
            showToast(t('error_title'), error.message, 'error');
        } finally {
            setIsAuthLoading(false);
            setIsUploading(false);
        }
    };
    const addHabit = async () => {
        // 1. GİRİŞ KONTROLÜ
        if (!user) {
            showToast(t('error_title'), t('session_not_open'), 'error');
            return;
        }

        // 2. BOŞ KONTROLÜ
        if (!newHabitTitle.trim()) {
            showToast(t('warning_title'), t('missing_info'), 'warning');
            return;
        }

        try {
            const endDateISO = newHabitEndDate ? convertDDMMYYYYtoISO(newHabitEndDate) : null;
            let notificationIds: string[] = [];

            // Bildirim Kurma
            if (habitNotifInput.length === 5 && Platform.OS !== 'web') {
                const { status } = await Notifications.getPermissionsAsync();
                if (status !== 'granted') {
                    showToast(t('permission_required'), t('prm_reqir'), 'warning');
                    // İzin yoksa bildirim kurmadan devam etsin mi yoksa dursun mu? 
                    // Genelde kullanıcıyı durdurmak iyidir ama kayıt edip bildirim kurmamayı da seçebilirsin.
                    // Aşağıdaki 'return' eklenirse işlem durur, kaldırılırsa bildirim kurmadan kaydeder.
                    return;
                }
                const [hours, minutes] = habitNotifInput.split(':').map(Number);
                try {
                    if (newHabitFreq === 'daily') {
                        // @ts-ignore
                        const id = await Notifications.scheduleNotificationAsync({
                            content: { title: t('habits'), body: newHabitTitle, sound: true },
                            trigger: { hour: hours, minute: minutes, repeats: true, type: Notifications.SchedulableTriggerInputTypes.CALENDAR }
                        });
                        notificationIds.push(id);
                    } else if (newHabitFreq === 'weekly') {
                        for (const dayIndex of newHabitDays) {
                            const expoWeekday = dayIndex + 1;
                            // @ts-ignore
                            const id = await Notifications.scheduleNotificationAsync({
                                content: { title: t('habits'), body: newHabitTitle, sound: true },
                                trigger: { weekday: expoWeekday, hour: hours, minute: minutes, repeats: true, type: Notifications.SchedulableTriggerInputTypes.CALENDAR }
                            });
                            notificationIds.push(id);
                        }
                    }
                } catch (e) { console.log("Bildirim hatası:", e); }
            }

            // 3. KAYIT
            await addDoc(collection(db, "users", user.uid, "habits"), {
                title: newHabitTitle,
                frequency: newHabitFreq,
                selectedDays: newHabitDays,
                endDate: endDateISO,
                completedDates: [],
                notificationTime: habitNotifInput,
                notificationIds: notificationIds,
                categoryId: selectedCategory.id,
                createdAt: serverTimestamp()
            });

            // 4. TEMİZLİK
            showToast(t('success'), t('all_good'), 'success');
            setIsAddModalOpen(false);
            setNewHabitTitle("");
            setNewHabitFreq('daily');
            setNewHabitDays([]);
            setNewHabitEndDate("");
            setHabitNotifInput("");

        } catch (error: any) {
            console.error("ADD HABIT ERROR:", error);
            showToast(t('error_title'), error.message, 'error');
        }
    };

    // --- GRUP OLUŞTURMA ---
    const handleCreateGroup = async () => {
        if (!newGroupTitle.trim()) {
            showToast(t('warning_title'), t('grup_naam_als'), 'warning');
            return;
        }
        if (selectedGroupMembers.length === 0) {
            showToast(t('warning_title'), t('least_1'), 'warning');
            return;
        }

        setIsAuthLoading(true);
        try {
            // Kendimi de üyelere ekle
            const finalMembers = [user.uid, ...selectedGroupMembers];

            await addDoc(collection(db, "habit_groups"), {
                title: newGroupTitle,
                createdBy: user.uid,
                members: finalMembers,
                completions: {}, // { "2023-10-20": ["uid1", "uid2"] } şeklinde tutacağız
                createdAt: serverTimestamp()
            });

            // Bildirim Gönderme (Seçilen arkadaşlara)
            // ... (Burada sendPushNotification fonksiyonunu döngüyle çağırabilirsin)

            showToast(t('success'), t('ghbt_scs'), 'success');
            setIsGroupModalOpen(false);
            setNewGroupTitle("");
            setSelectedGroupMembers([]);

        } catch (e: any) {
            showToast(t('error_title'), e.message, 'error');
        } finally {
            setIsAuthLoading(false);
        }
    };

    // --- GRUP GÖREVİNİ İŞARETLEME ---
    const toggleGroupHabit = async (groupId: string, currentCompletions: any) => {
        const today = getISODate(new Date());
        const todaysList = currentCompletions[today] || [];

        let newList;
        if (todaysList.includes(user.uid)) {
            // Zaten yapmışım, geri al (Sil)
            newList = todaysList.filter((uid: string) => uid !== user.uid);
        } else {
            // Yapmamışım, ekle
            newList = [...todaysList, user.uid];
            // Motivasyon efekti (Konfeti vb. eklenebilir)
            showToast(t('premium_congrats'), t('grp_cong'), 'success');
        }

        // Firestore Update (Map içinde array güncelleme)
        const groupRef = doc(db, "habit_groups", groupId);
        await updateDoc(groupRef, {
            [`completions.${today}`]: newList
        });
    };

    const toggleTask = async (task: Task) => {
        if (user) {
            // Eğer görev tamamlanıyorsa (false -> true oluyorsa) sayacı artır
            if (!task.completed) {
                checkAdTrigger('tasks');
            }
            await updateDoc(doc(db, "users", user.uid, "tasks", task.id), { completed: !task.completed });
        }
    };

    const deleteTask = async (task: Task) => { if (user) { await deleteDoc(doc(db, "users", user.uid, "tasks", task.id)); } };

    const toggleHabitCompletion = async (habit: Habit, date: string) => {
        const ref = doc(db, "users", user.uid, "habits", habit.id);

        // Eğer bu tarih daha önce işaretlenmemişse (yani yeni tamamlanıyorsa)
        if (!habit.completedDates.includes(date)) {
            checkAdTrigger('habits');
        }

        if (habit.completedDates.includes(date)) await updateDoc(ref, { completedDates: arrayRemove(date) });
        else await updateDoc(ref, { completedDates: arrayUnion(date) });
    };

    const deleteHabit = async (habit: Habit) => {
        if (habit.notificationIds) {
            for (const id of habit.notificationIds) { if (Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync(id); }
        }
        if (user) await deleteDoc(doc(db, "users", user.uid, "habits", habit.id));
    };

    // OmmioApp fonksiyonunun en başına, diğer useState'lerin yanına ekle:
    const [taskUnreadCounts, setTaskUnreadCounts] = useState<any>({});

    // Hemen altına bu useEffect'i yapıştır:
    useEffect(() => {
        if (!user) return;

        // Veritabanındaki TÜM görev yorumlarını tarar (TaskChatButton mantığının aynısı ama hepsi için)
        const q = query(
            collectionGroup(db, 'comments'),
            where('read', '==', false) // Sadece okunmamışları al
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const counts: any = {};

            snapshot.docs.forEach((doc) => {
                // TypeScript hatası olmaması için 'as any' kullanıyoruz
                const data = doc.data() as any;

                // Kendi yorumlarımızı sayma
                if (data.senderId === user.uid) return;

                // Yorumu atan kişinin ID'sine göre sayacı artır
                counts[data.senderId] = (counts[data.senderId] || 0) + 1;
            });

            setTaskUnreadCounts(counts);
        });

        return () => unsubscribe();
    }, [user]);

    const toggleExpand = (taskId: string) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedTaskId(expandedTaskId === taskId ? null : taskId); };
    const openEditModal = (task: Task) => { if (task.assignedBy !== user.uid && task.assignedTo !== user.uid) { showToast(t('error_title'), t('task_unauth_edit'), 'error'); return; } setSelectedTask(task); setDetailText(task.text); setDetailDesc(task.description || ""); setDetailDueDate(task.dueDate || ""); };
    const saveTaskDetail = async () => { if (!selectedTask) return; try { const targetUid = selectedTask.assignedTo || user.uid; const taskRef = doc(db, "users", targetUid, "tasks", selectedTask.id); await updateDoc(taskRef, { text: detailText, description: detailDesc, dueDate: detailDueDate }); setSelectedTask(null); showToast(t('success'), t('task_updated'), 'success'); } catch (e) { showToast(t('error_title'), t('update_failed_generic'), 'error'); } };

    const onDateChange = (event: any, selected: Date | undefined) => {
        // Sadece Android'de seçim yapınca otomatik kapat (Web ve iOS'ta butonla kapatacağız)
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selected) {
            setSelectedDate(selected);
            const formatted = formatDateDDMMYYYY(selected);
            // Hangi input için açıldıysa onu güncelle
            if (datePickerTarget === 'start') setInputStartDate(formatted);
            if (datePickerTarget === 'due') setInputDueDate(formatted);
            if (datePickerTarget === 'habitEnd') setNewHabitEndDate(formatted);
            if (datePickerTarget === 'detail') setDetailDueDate(formatted);
        }
    };

    const onDetailDateChange = (event: any, selected: Date | undefined) => {
        setShowDetailDatePicker(false);
        if (selected) setDetailDueDate(formatDateDDMMYYYY(selected));
    };
    const onHabitDateChange = (event: any, selected: Date | undefined) => {
        setShowHabitDatePicker(false);
        if (selected) setNewHabitEndDate(formatDateDDMMYYYY(selected));
    };

    const openDatePicker = (target: 'start' | 'due' | 'habitEnd' | 'detail') => {
        setDatePickerTarget(target);
        setShowDatePicker(true);
    };

    const handleInputStartDateChange = (text: string) => { setInputStartDate(maskDateInput(text)); };
    const handleInputDueDateChange = (text: string) => { setInputDueDate(maskDateInput(text)); };
    const handleDetailDueDateChange = (text: string) => { setDetailDueDate(maskDateInput(text)); };
    const handleHabitEndDateChange = (text: string) => setNewHabitEndDate(maskDateInput(text));
    const handleNotifInputChange = (text: string) => { setNotifInput(maskTimeInput(text)); };
    const handleAlarmInputChange = (text: string) => { setAlarmInput(maskTimeInput(text)); };
    const handleHabitNotifInputChange = (text: string) => { setHabitNotifInput(maskTimeInput(text)); };
    const changeDate = (days: number) => { const newDate = new Date(selectedDate); newDate.setDate(selectedDate.getDate() + days); setSelectedDate(newDate); };
    const toggleHabitDay = (dayId: number) => { if (newHabitDays.includes(dayId)) setNewHabitDays(newHabitDays.filter(d => d !== dayId)); else setNewHabitDays([...newHabitDays, dayId]); };
    // ... mevcut fonksiyonların arasına ekleyin

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const newId = Math.random().toString(36).substr(2, 9);

        const newCategory = { id: newId, name: newCategoryName, color: newCategoryColor };
        const updatedCategories = [...categories, newCategory];

        setCategories(updatedCategories);
        setNewCategoryName("");

        // FIREBASE KAYDI (ÖNEMLİ)
        if (user) {
            try {
                // 'users' koleksiyonunda kullanıcının dökümanına 'categories' alanını güncelliyoruz
                await setDoc(doc(db, "users", user.uid), { categories: updatedCategories }, { merge: true });
            } catch (e) {
                console.log("Kategori kaydedilemedi", e);
            }
        }
    };

    // Kategori silerken de updateDoc yapmalısınız:
    const handleDeleteCategory = async (catId: string) => {
        if (categories.length <= 1) {
            showToast(t('warning_label'), t('at_least_one_category'), 'warning');
            return;
        }
        const updatedCategories = categories.filter(c => c.id !== catId);
        setCategories(updatedCategories);

        if (user) {
            await updateDoc(doc(db, "users", user.uid), { categories: updatedCategories });
        }
    };

    const sendFriendRequest = async () => {
        // 1. Boş kontrolü
        if (!searchUsername.trim()) {
            showToast(t('warning_title'), t('auth_username_required'), 'warning');
            return;
        }

        // Küçük harfe çevir ve boşlukları sil (Instagram mantığı: username her zaman küçük harftir)
        const targetUsername = searchUsername.trim().toLowerCase().replace(/\s/g, '');

        try {
            // 2. Kullanıcıyı "public_users" içinde unique username ile ara
            const q = query(collection(db, "public_users"), where("username", "==", targetUsername));
            const querySnapshot = await getDocs(q);

            // A. KULLANICI BULUNAMADI
            if (querySnapshot.empty) {
                showToast(t('error_title'), tFormat('user_not_found', { targetUsername }), 'error');
                return;
            }

            // Hedef kullanıcının verisini al
            const targetUser = querySnapshot.docs[0].data();
            const targetUid = targetUser.uid;
            // Görünen ismi al (Yoksa username kullan)
            const targetDisplayName = targetUser.displayName || targetUser.username;

            // B. KENDİNE İSTEK ATMA
            if (targetUid === user.uid) {
                showToast(t('warning_title'), t('self_add_error'), 'warning');
                return;
            }

            // C. ZATEN ARKADAŞ MI?
            const contactRef = doc(db, "users", user.uid, "contacts", targetUid);
            const contactSnap = await getDoc(contactRef);
            if (contactSnap.exists()) {
                showToast(t('info_title'), tFormat('already_friend', { targetDisplayName }), 'info');
                setSearchUsername("");
                return;
            }

            // 3. İsteği Gönder
            const requestRef = doc(db, "users", targetUid, "friend_requests", user.uid);

            await setDoc(requestRef, {
                id: user.uid,
                fromUid: user.uid,
                // Gönderen olarak BİZİM username ve display name'imizi ekliyoruz
                fromUsername: user.username,
                fromDisplayName: user.displayName || user.username, // <-- YENİ: Display name de gidiyor
                fromEmail: user.email,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            if (targetUser.pushToken) {
                await sendPushNotification(
                    targetUser.pushToken,
                    t('friend_req_title') || "Arkadaşlık İsteği",
                    `${user.displayName || user.username} ${t('sent_friend_req_msg') || t('sent_you_request')}`,
                    { type: 'friend_request' }
                );
            }

            // D. BAŞARILI (Kullanıcıya Display Name ile geri bildirim veriyoruz)
            setSearchUsername("");
            showToast(t('social_request_sent'), tFormat('request_sent', {
                targetDisplayName,
                targetUsername
            }), 'success');

        } catch (e: any) {
            console.error("İstek gönderme hatası:", e);
            showToast(t('error_title'), t('request_failed'), 'error');
        }
    };

    const acceptRequest = async (req: FriendRequest) => {
        if (!user) return;

        try {
            // 1. İsteği gönderen kişinin GÜNCEL verisini al
            const senderDoc = await getDoc(doc(db, "public_users", req.fromUid));

            // Eğer veri yoksa istekteki eski verileri kullan (Fallback)
            // req nesnesine any diyerek tip hatasını geçici çözüyoruz çünkü friendRequest interface'ini güncellemedik
            const reqData = req as any;

            const senderData = senderDoc.exists() ? senderDoc.data() : {
                username: reqData.fromUsername,
                displayName: reqData.fromDisplayName || reqData.fromUsername,
                photoURL: null
            };

            // 2. Kaydedilecek Veriler
            const senderUsername = senderData.username;
            const senderDisplayName = senderData.displayName || senderUsername; // Öncelik Display Name
            const senderPhoto = senderData.photoURL || null;

            const myUsername = user.username;
            const myDisplayName = user.displayName || user.username;
            const myPhoto = user.photoURL;

            // 3. Çift Taraflı Kayıt
            await Promise.all([
                // A. Benim listeme ekle (Display Name öncelikli kaydediyoruz)
                setDoc(doc(db, "users", user.uid, "contacts", req.fromUid), {
                    uid: req.fromUid,
                    username: senderUsername,      // Arama ve @ etiketi için
                    displayName: senderDisplayName, // Listede göstermek için
                    email: reqData.fromEmail || "",
                    photoURL: senderPhoto,
                    canAssignToMe: true,
                    createdAt: serverTimestamp()
                }),

                // B. Karşı tarafa beni ekle
                setDoc(doc(db, "users", req.fromUid, "contacts", user.uid), {
                    uid: user.uid,
                    username: myUsername,
                    displayName: myDisplayName,
                    email: user.email,
                    photoURL: myPhoto,
                    canAssignToMe: false,
                    createdAt: serverTimestamp()
                }),

                // C. İsteği sil
                deleteDoc(doc(db, "users", user.uid, "friend_requests", req.id || req.fromUid))
            ]);

            showToast(t('success_label'),
                tFormat('success_friend', { senderDisplayName }), 'success');

        } catch (e: any) {
            console.error("Kabul hatası:", e);
            showToast(t('error_title'), t('connection_failed'), 'error');
        }
    };
    const showTasksAssignedToFriend = async (friendUid: string, friendName: string) => {
        if (!user) return;
        try {
            // Arkadaşın "tasks" koleksiyonunda, "assignedBy" benim ID'm olanları çek
            const q = query(
                collection(db, "users", friendUid, "tasks"),
                where("assignedBy", "==", user.uid)
            );

            const snapshot = await getDocs(q);
            const sentTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            setFriendTasksModal({ visible: true, tasks: sentTasks, friendName });
        } catch (e) {
            showToast(t('error_title'), t('tasks_fetch_error'), 'error');
        }
    };
    const rejectRequest = async (reqId: string) => { try { await deleteDoc(doc(db, "users", user.uid, "friend_requests", reqId)); } catch (e) { } };
    const togglePermission = async (contact: Contact) => { await updateDoc(doc(db, "users", user.uid, "contacts", contact.uid), { canAssignToMe: !contact.canAssignToMe }); };
    const setContactCategory = async (contact: Contact, categoryId: string) => { await updateDoc(doc(db, "users", user.uid, "contacts", contact.uid), { defaultCategoryId: categoryId }); };
    const fetchDeviceContacts = async () => {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name] });
            if (data.length > 0) {
                const formattedContacts: DeviceContact[] = [];
                for (const contact of data) {
                    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                        let number = contact.phoneNumbers[0].number || "";
                        number = number.replace(/\s/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
                        formattedContacts.push({ id: contact.id || Math.random().toString(), name: contact.name || t('no_name'), phoneNumber: number, isAppUser: false });
                    }
                }
                setDeviceContacts(formattedContacts);
            }
        } else { showToast(t('permission_required'), t('contacts_permission'), 'warning'); }
    };

    const inviteContact = async (phoneNumber: string) => {
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) { await SMS.sendSMSAsync([phoneNumber], t('social_invite_sms')); } else { showToast(t('error_title'), t('sms_error'), 'error'); }
    };
    const handleDeleteAccount = async () => {
        // Silme Mantığı
        const performDelete = async () => {
            try {
                if (!user) return;
                await deleteDoc(doc(db, "users", user.uid));
                try { await deleteDoc(doc(db, "public_users", user.uid)); } catch (e) { }
                await user.delete();
                setTasks([]);

                // Başarılı Mesajı
                showToast(t('delete_account_success_title'), t('delete_account_success_msg'), 'success');

            } catch (error: any) {
                console.log("Silme hatası:", error);
                // Hata Mesajı
                showToast(t('error_title'), t('account_delete_error'), 'error');
            }
        };

        // Onay Kutusu
        askConfirmation(
            t('delete_account'), // "Hesabı Sil"
            t('account_delete_confirm'), // "Emin misin?..."
            performDelete,
            true // Kırmızı buton
        );
    };

    // --- UI HELPERS ---
    const isSystemDark = systemScheme === 'dark';
    // --- YENİ BİLDİRİM FONKSİYONU ---
    // type kısmına 'warning' ekledik
    const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
        setCustomToast({ visible: true, title, message, type });
        setTimeout(() => setCustomToast(prev => ({ ...prev, visible: false })), 4000);
    };

    // --- YENİ ONAY KUTUSU FONKSİYONU ---
    const askConfirmation = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
        setConfirmModal({
            visible: true,
            title,
            message,
            onConfirm,
            isDestructive
        });
    };
    // 1. Android Geri Tuşu Kontrolü
    useEffect(() => {
        const onBackPress = () => {
            // Eğer sohbet açıksa, sohbeti kapat ve listeye dön
            if (activeTab === 'chat_room' && chatTarget) {
                setChatTarget(null);
                setActiveTab('messages');
                setChatMessages([]);
                return true; // İşlemi biz hallettik, uygulama kapanmasın
            }
            return false; // Diğer durumlarda varsayılan davranış
        };

        // Değişiklik burada: Dinleyiciyi bir değişkene atıyoruz
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

        // Temizleme fonksiyonunda .remove() çağırıyoruz
        return () => backHandler.remove();
    }, [activeTab, chatTarget]);

    // 2. Kaydırma (Swipe) Algılayıcı (iOS Stili Geri Dönüş)
    const panResponder = useRef(
        PanResponder.create({
            // Dokunma başladığında devreye girsin mi?
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Sadece soldan sağa doğru belirgin bir kaydırma varsa (dx > 10)
                // Ve dikey kaydırma çok azsa (dy < 20 - yani kullanıcı mesajları aşağı yukarı kaydırmıyorsa)
                // Ayrıca hareket ekranın sol kenarına yakın başlamışsa (pageX < 100)
                return (
                    activeTab === 'chat_room' &&
                    gestureState.dx > 10 &&
                    Math.abs(gestureState.dy) < 20 &&
                    evt.nativeEvent.pageX < 100 // Sadece sol kenardan çekince çalışsın (isteğe bağlı bu satırı kaldırabilirsin)
                );
            },
            onPanResponderRelease: (evt, gestureState) => {
                // Eğer parmak 50 birimden fazla sağa kaydıysa "Geri Dön" işlemini yap
                if (gestureState.dx > 50) {
                    setChatTarget(null);
                    setActiveTab('messages');
                    setChatMessages([]);
                }
            },
        })
    ).current;
    // --- CHAT ODASI RENDER FONKSİYONU ---

    const renderChatRoom = () => {
        // Dinamik Stiller (Tema değişimi için)
        const activeChatUser = contacts.find(c => c.uid === chatTarget?.uid) || chatTarget;
        const dynamicStyles = {
            container: { backgroundColor: currentColors.bg },
            header: {
                backgroundColor: currentColors.surface,
                borderBottomColor: isDark ? '#334155' : '#e2e8f0',
            },
            text: { color: currentColors.text },
            subText: { color: currentColors.subText },
            inputContainer: {
                backgroundColor: currentColors.surface,
                borderColor: isDark ? '#334155' : '#e2e8f0',
            },
            menu: {
                backgroundColor: currentColors.surface,
                borderColor: isDark ? '#334155' : '#e2e8f0',
            },
            backBtn: {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
            }
        };

        // Mesaj Gönderme Tetikleyicisi
        const handleSend = () => {
            if (chatInput.trim()) {
                sendMessage();
            }
        };

        // Menü dışına tıklanınca kapatma mantığı
        const handleDismissMenu = () => {
            if (isMenuOpen) setIsMenuOpen(false);
            return false;
        };

        return (
            <View
                style={[styles.container, dynamicStyles.container]}
                // Pan responder ve dokunma olaylarını koruyoruz
                onStartShouldSetResponder={handleDismissMenu}
                {...panResponder.panHandlers}
            >
                {/* --- MODERN HEADER --- */}
                <View style={[styles.header, dynamicStyles.header, styles.shadow]}>
                    <View style={styles.headerLeft}>
                        {/* Geri Butonu */}
                        <TouchableOpacity
                            onPress={() => {
                                setIsMenuOpen(false);
                                setChatTarget(null);
                                setChatMessages([]);
                                setActiveTab('messages');
                            }}
                            style={getIconButtonStyle(isDark)}
                        >
                            <ChevronLeft size={24} color={currentColors.text} />
                        </TouchableOpacity>

                        {/* Profil Alanı */}
                        <View style={styles.avatarContainer}>
                            {chatTarget?.photoURL ? (
                                <Image source={{ uri: chatTarget.photoURL }} style={styles.avatarImage} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.secondary }]}>
                                    <Text style={styles.avatarText}>
                                        {chatTarget?.username?.[0]?.toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* İsim & Durum */}
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text numberOfLines={1} style={[styles.headerTitle, dynamicStyles.text]}>
                                {chatTarget?.displayName || chatTarget?.username}
                            </Text>
                            <Text numberOfLines={1} style={[styles.headerSubtitle, dynamicStyles.subText]}>
                                @{chatTarget?.username}
                            </Text>
                        </View>
                    </View>

                    {/* Sağ Taraf - Menü Butonu */}
                    <View style={{ position: 'relative', zIndex: 50 }}>
                        <TouchableOpacity
                            onPress={() => setIsMenuOpen(!isMenuOpen)}
                            style={getIconButtonStyle(isDark)}
                        >
                            <MoreVertical size={24} color={currentColors.text} />
                        </TouchableOpacity>

                        {/* --- POPUP MENÜ --- */}
                        {isMenuOpen && (
                            <View style={[styles.menuDropdown, dynamicStyles.menu, styles.shadow]}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        handleDeleteChat();
                                    }}
                                    style={[styles.menuItem, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' }]}
                                >
                                    <Trash2 size={18} color={COLORS.danger} style={{ marginRight: 10 }} />
                                    <Text style={{ color: COLORS.danger, fontWeight: '600', fontSize: 14 }}>
                                        {t('delete_chat')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* --- MESAJ LİSTESİ --- */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <FlatList
                        data={chatMessages}
                        keyExtractor={(item) => item.id}
                        inverted={true}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        onTouchStart={() => isMenuOpen && setIsMenuOpen(false)}
                        onEndReached={() => setMsgLimit((prev) => prev + 25)}
                        renderItem={({ item: msg }) => (
                            <MessageItem
                                msg={msg}
                                user={user}
                                chatTarget={activeChatUser} // <--- DÜZELTİLMİŞ HALİ (Canlı veriyi gönderiyoruz)
                                currentColors={currentColors}
                                isDark={isDark}
                            />
                        )}
                    />

                    {/* --- MODERN INPUT ALANI --- */}
                    <View style={[styles.inputWrapper, { backgroundColor: currentColors.bg }]}>
                        <View style={[styles.inputContainer, dynamicStyles.inputContainer, styles.shadow]}>
                            <TextInput
                                value={chatInput}
                                onChangeText={setChatInput}
                                placeholder={t('write_message')}
                                placeholderTextColor={currentColors.subText}
                                multiline={true}
                                blurOnSubmit={false}
                                onFocus={() => setIsMenuOpen(false)}
                                style={[styles.textInput, { color: currentColors.text }]}
                                onKeyPress={(e) => {
                                    const keyEvent = e.nativeEvent as any;
                                    if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
                                        if (Platform.OS === 'web') e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />

                            {/* Gönder Butonu - Animasyonlu hissi veren renk değişimi */}
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!chatInput.trim()}
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: chatInput.trim() ? COLORS.primary : (isDark ? '#475569' : '#cbd5e1') }
                                ]}
                            >
                                <Send size={20} color="#fff" style={{ marginLeft: 2 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        );
    }
    const renderGroupHabitCard = (group: GroupHabit) => {
        const today = getISODate(new Date());
        const doneToday = group.completions && group.completions[today] ? group.completions[today] : [];
        const isMeDone = doneToday.includes(user.uid);
        const isExpanded = expandedGroupAnalysisId === group.id;

        // --- ANALİZ HESAPLAMA ---
        // Her üyenin toplam tamamlama sayısını hesapla
        const memberStats = group.memberDetails?.map(member => {
            // Tüm tarihleri dolaş, bu üye kaç kere yapmış say
            let count = 0;
            if (group.completions) {
                Object.values(group.completions).forEach((doneList: any) => {
                    if (doneList.includes(member.uid)) count++;
                });
            }
            return { ...member, count };
        }).sort((a, b) => b.count - a.count); // En çok yapana göre sırala

        return (
            <View key={group.id} style={{
                backgroundColor: currentColors.surface,
                borderRadius: 24,
                padding: 16,
                marginBottom: 15,
                borderWidth: 1,
                borderColor: isMeDone ? COLORS.success : (isDark ? '#334155' : '#e2e8f0'),
                shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3
            }}>
                {/* Üst Kısım: Başlık ve Buton */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: currentColors.text }}>{group.title}</Text>
                        <Text style={{ fontSize: 12, color: currentColors.subText }}>
                        {tFormat('group_status_line', { members: group.memberDetails?.length || 0, done: doneToday.length })}
                        </Text>
                 </View>

                    <TouchableOpacity
                        onPress={() => toggleGroupHabit(group.id, group.completions)}
                        style={{
                            backgroundColor: isMeDone ? '#dcfce7' : COLORS.primary,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 14,
                            borderWidth: isMeDone ? 1 : 0,
                            borderColor: '#16a34a'
                        }}
                    >
                        {isMeDone ? (
                            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                <Check size={16} color="#16a34a" strokeWidth={3} />
                                <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>{t('ok_btn')}</Text>
                            </View>
                        ) : (
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('i_did')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Alt Kısım: Üyeler (Avatar Listesi) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: -10, paddingLeft: 5 }}>
                            {group.memberDetails?.map((member: any) => {
                                const isDone = doneToday.includes(member.uid);
                                return (
                                    <View key={member.uid} style={{ 
                                        width: 36, height: 36, borderRadius: 18, borderWidth: 2, 
                                        borderColor: currentColors.surface, overflow: 'hidden',
                                        opacity: isDone ? 1 : 0.5 // Yapmayanlar silik
                                    }}>
                                        <Image
                                            source={member.photoURL ? { uri: member.photoURL } : require('../../assets/Logo/Logo.png')}
                                            style={{ width: '100%', height: '100%', backgroundColor: '#cbd5e1' }}
                                        />
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                    
                    {/* Analiz Aç/Kapa Butonu */}
                    <TouchableOpacity 
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setExpandedGroupAnalysisId(isExpanded ? null : group.id);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 10 }}
                    >
                        <BarChart3 size={16} color={COLORS.primary} />
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.primary }}>
                        {isExpanded ? t('hide') : t('analysis_btn')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* --- GENİŞLEYEN ANALİZ ALANI (LEADERBOARD) --- */}
                {isExpanded && (
                    <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: currentColors.text, marginBottom: 10 }}>{t('score_tbl')}</Text>
                        {memberStats?.map((member, index) => (
                            <View key={member.uid} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: index === 0 ? '#eab308' : (index === 1 ? '#94a3b8' : (index === 2 ? '#b45309' : currentColors.subText)), width: 20 }}>
                                        #{index + 1}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: currentColors.text }}>
                                        {member.uid === user.uid ? "Sen" : member.displayName}
                                    </Text>
                                </View>
                                <View style={{ backgroundColor: index === 0 ? '#fef9c3' : (isDark ? '#334155' : '#f1f5f9'), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: index === 0 ? '#ca8a04' : currentColors.text }}>
                                        {member.count} kez
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    }
    const isDark = theme === 'system' ? isSystemDark : theme === 'dark';
    const currentColors = isDark ? { bg: COLORS.darkBg, surface: COLORS.darkSurface, text: '#fff', subText: '#94a3b8' } : { bg: COLORS.background, surface: COLORS.surface, text: COLORS.textDark, subText: COLORS.textLight };
    const getCategoryColor = (catId: string) => {
        // Kategorinin rengini bul, eğer bulamazsan varsayılan 'blue' al
        const cat = categories.find(c => c.id === catId);
        const colorKey = cat?.color || 'blue';
        // Rengin HEX kodunu ve arka planını bul
        return CATEGORY_COLORS.find(c => c.id === colorKey) || CATEGORY_COLORS[0];
    };
    const currentISODate = getISODate(selectedDate);
    const todaysTasks = tasks.filter(t => {
        if (t.date === currentISODate) return true;
        if (t.showEveryDayUntilDue && t.dueDate) return currentISODate >= t.date && currentISODate <= convertDDMMYYYYtoISO(t.dueDate);
        return false;
    });

    const activeTasks = todaysTasks.filter(t => !t.completed).sort((a, b) => parseDueDate(a.dueDate) - parseDueDate(b.dueDate));
    const completedTasks = todaysTasks.filter(t => t.completed);
    const overdueTasks = tasks.filter(t => !t.completed && !t.showEveryDayUntilDue && t.date < getISODate(new Date()));
    // --- BURAYI KOPYALA VE overdueTasks TANIMININ ALTINA YAPIŞTIR ---

    const getUpcomingTasks = () => {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const todayISO = getISODate(today);
        const nextWeekISO = getISODate(nextWeek);

        // Tarihi yarın ve sonraki 7 gün içinde olan, tamamlanmamış görevler
        return tasks.filter((t: Task) => { // 't: Task' diyerek tip hatasını da çözüyoruz
            return !t.completed && t.date > todayISO && t.date <= nextWeekISO;
        }).sort((a, b) => a.date.localeCompare(b.date));
    };

    const upcomingTasks = getUpcomingTasks();

    // ----------------------------------------------------------------

    const todaysHabits = habits.filter(h => {
        if (h.endDate && h.endDate < currentISODate) return false;
        if (h.frequency === 'daily') return true;
        if (h.frequency === 'weekly') return h.selectedDays.includes(selectedDate.getDay());
        return false;
    }).sort((a, b) => (a.notificationTime || "24:00").localeCompare(b.notificationTime || "24:00"));
    // --- PROGRESS BAR HESAPLAMASI ---
    const totalTodaysHabits = todaysHabits.length;
    const completedTodaysHabits = todaysHabits.filter(h => h.completedDates.includes(currentISODate)).length;
    const habitProgress = totalTodaysHabits > 0 ? (completedTodaysHabits / totalTodaysHabits) * 100 : 0;
    const filteredContacts = contacts.filter(c => c.username.toLowerCase().includes(assignSearchText.toLowerCase()));
    // --- GÖREVLER PROGRESS BAR HESAPLAMASI ---
    const totalTodaysTasks = todaysTasks.length;
    const completedTodaysTasks = todaysTasks.filter(t => t.completed).length;
    const taskProgress = totalTodaysTasks > 0 ? (completedTodaysTasks / totalTodaysTasks) * 100 : 0;
    // --- TAKVİM İŞARETLEME MANTIĞI (BUGÜN ve SEÇİLİ GÜN) ---
    const todayStr = getISODate(new Date());
    const selectedStr = getISODate(selectedDate || new Date());


    const calendarMarks: any = {};

    // 1. Önce Bugünü İşaretle (Varsayılan Stil)
    calendarMarks[todayStr] = {
        customStyles: {
            text: { color: COLORS.primary, fontWeight: '900' }
        }
    };

    // 2. Seçili Günü İşaretle (Eğer bugün seçiliyse, üstteki stilin üzerine yazar)
    calendarMarks[selectedStr] = {
        selected: true,
        customStyles: {
            container: {
                backgroundColor: COLORS.primary, // MOR KUTU
                borderRadius: 8,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 4,
                shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3
            },
            text: {
                color: '#ffffff', // BEYAZ YAZI
                fontWeight: 'bold'
            }
        }
    };
    // --- DATA DEĞİŞTİĞİNDE WIDGET'I GÜNCELLE ---
  useEffect(() => {
    // Sadece kullanıcı giriş yapmışsa ve veri varsa güncelle
    if (user && (tasks.length > 0 || habits.length > 0)) {
        updateWidgetData(tasks, habits,isPremium);
    }
  }, [tasks, habits, user,isPremium]); // Tasks, Habits veya User değişirse çalışır
  useFocusEffect(
    useCallback(() => {
        // Kullanıcı uygulamayı her açtığında widget'ı mevcut son durumla güncelle
        if (user) {
            updateWidgetData(tasks, habits, isPremium);
        }
    }, [tasks, habits, user, isPremium])
);
    const styles = useMemo(() => getDynamicStyles(currentColors, isDark), [currentColors, isDark]);
    // --- renderTask FONKSİYONUNU BUNUNLA DEĞİŞTİR ---
    const renderTask = (task: Task) => {
        const catInfo = categories.find(c => c.id === task.categoryId) || categories[0];
        const catColor = CATEGORY_COLORS.find(c => c.id === catInfo.color) || CATEGORY_COLORS[0];
        const isAssignedByOther = task.assignedBy && task.assignedBy !== user.uid;
        const isExpanded = expandedTaskId === task.id;
        const isMultiDay = task.showEveryDayUntilDue;
        const priorityColor = task.priority === 'high' ? '#ef4444' : (task.priority === 'low' ? '#10b981' : '#f59e0b');

        return (
            <View key={task.id} style={[styles.taskCard, { backgroundColor: currentColors.surface, opacity: task.completed ? 0.6 : 1, borderLeftWidth: isAssignedByOther ? 4 : 0, borderLeftColor: COLORS.warning }]}>
                {/* Üst Satır: Checkbox + Metin + İkonlar */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                    {/* Checkbox */}
                    <TouchableOpacity onPress={() => toggleTask(task)} style={[styles.checkBox, task.completed ? { backgroundColor: COLORS.success, borderColor: COLORS.success } : { borderColor: '#cbd5e1' }]}>
                        {task.completed && <Check size={14} color="#fff" />}
                    </TouchableOpacity>

                    {/* Görev Metni ve Meta Veriler */}
                    <TouchableOpacity onPress={() => toggleExpand(task.id)} style={{ flex: 1 }}>
                        <Text style={[styles.taskText, { color: currentColors.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>{task.text}</Text>
                        <View style={styles.taskMeta}>
                            {/* Öncelik Bayrağı */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Flag size={12} color={priorityColor} fill={priorityColor} />
                            </View>

                            {/* Dosya İkonu (Varsa) */}
                            {task.attachments && task.attachments.length > 0 && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                    <Paperclip size={10} color="#0284c7" />
                                    <Text style={{ fontSize: 10, color: '#0284c7', fontWeight: 'bold' }}>{task.attachments.length}</Text>
                                </View>
                            )}
                            <View style={[styles.miniBadge, { backgroundColor: isDark ? '#334155' : catColor.bg }]}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: catColor.hex }} />
                                <Text style={{ fontSize: 10, color: isDark ? '#fff' : catColor.hex, fontWeight: 'bold' }}>{catInfo.name}</Text>
                            </View>
                            {isAssignedByOther && <View style={[styles.miniBadge, { backgroundColor: '#fef3c7' }]}><User size={10} color={COLORS.warning} /><Text style={{ fontSize: 10, color: COLORS.warning, fontWeight: 'bold' }}>{task.assignedByName || 'Patron'}</Text></View>}
                            {task.dueDate && <View style={styles.metaItem}><CalendarClock size={10} color={COLORS.danger} /><Text style={{ fontSize: 10, color: COLORS.danger }}>{task.dueDate}</Text></View>}
                        </View>

                    </TouchableOpacity>

                    {/* --- AKILLI SOHBET BUTONU (Bildirimli) --- */}
                    <TaskChatButton
                        task={task}
                        user={user}
                        onPress={() => {
                            setSelectedTask(task);
                            setTaskModalTab('chat');
                        }}
                    />

                    {/* Expand Butonu */}
                    <TouchableOpacity onPress={() => toggleExpand(task.id)} style={{ padding: 5 }}>
                        {isExpanded ? <ChevronUp size={20} color={currentColors.subText} /> : <ChevronDown size={20} color={currentColors.subText} />}
                    </TouchableOpacity>
                </View>

                {/* Genişletilmiş Alan (Açıklama ve Butonlar) */}
                {isExpanded && (
                    <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9' }}>
                        {task.description ? (<View style={{ flexDirection: 'row', gap: 5, marginBottom: 10 }}><AlignLeft size={14} color={currentColors.subText} style={{ marginTop: 2 }} /><Text style={{ color: currentColors.text, fontSize: 14, flex: 1 }}>{task.description}</Text></View>) : (<Text style={{ color: currentColors.subText, fontSize: 12, fontStyle: 'italic', marginBottom: 10 }}>{t('task_no_desc')}</Text>)}
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 5 }}>
                            <TouchableOpacity onPress={() => { askConfirmation(t('delete_btn'), t('task_delete_confirm'), () => deleteTask(task), true); }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Trash2 size={16} color={COLORS.danger} />
                                    <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: 'bold' }}>{t('delete')}</Text>
                                </View>
                            </TouchableOpacity>
                            {(task.assignedBy === user.uid || task.assignedTo === user.uid) && (
                                <TouchableOpacity onPress={() => openEditModal(task)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5, backgroundColor: COLORS.primary + '20', borderRadius: 8, paddingHorizontal: 10 }}>
                                    <Edit2 size={16} color={COLORS.primary} />
                                    <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: 'bold' }}>{t('edit')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>
        );
    }

    // Eğer Splash animasyonu daha bitmediyse, Auth yüklense bile Splash göster.
    // --- A) SPLASH EKRANI ---
    if (!isSplashAnimationComplete && Platform.OS !== 'web') {
        return (
            <AnimatedSplash
                onAnimationFinish={() => {
                    setIsSplashAnimationComplete(true);
                    setShowAuth(true);
                }}
            />
        );
    }

    // --- B) KULLANICI YOKSA (Giriş / Kayıt Ekranı) ---
    if (!user) {
        // 1. Landing Page mi gösterilsin?
        if (!showAuth) {
            return (
                <LandingPage
                    lang={lang}
                    isDark={isDark}
                    onGetStarted={(mode) => {
                        setAuthMode(mode);
                        setShowAuth(true);
                    }}
                    onLanguageChange={(newLang) => setLang(newLang as LangCode)}
                />
            );
        }

        // 2. GİRİŞ EKRANI (DÜZELTİLMİŞ HALİ)
        return (
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Platform.OS !== 'web' ? Keyboard.dismiss : undefined}>

                    {/* 👇👇👇 DÜZELTME: HEPSİNİ KAPSAYAN TEK BİR VIEW EKLENDİ 👇👇👇 */}
                    <View style={{ flex: 1, backgroundColor: currentColors.bg }}>

                        {/* Orijinal Form İçeriği */}
                        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>

                            {/* LOGO */}
                            <View style={{ alignItems: 'center', marginBottom: 40 }}>
                                <Image source={require('../../assets/Logo/Logo.png')} style={{ width: 200, height: 60, resizeMode: 'contain' }} />
                            </View>

                            {/* INPUTLAR (Kullanıcı Adı / Şifre) */}
                            <View style={{ gap: 15 }}>
                                {authMode === 'signup' && (
                                    <View style={styles.authInputRow}>
                                        <User size={20} color={currentColors.subText} />
                                        <TextInput value={username} onChangeText={setUsername} placeholder={t('social_search_tab_username')} placeholderTextColor={currentColors.subText} style={[styles.authInput, { color: currentColors.text }]} autoCapitalize='none' />
                                    </View>
                                )}

                                <View style={styles.authInputRow}>
                                    <Mail size={20} color={currentColors.subText} />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder={authMode === 'login' ? t('auth_email_username_placeholder') : t('email')}
                                        placeholderTextColor={currentColors.subText}
                                        style={[styles.authInput, { color: currentColors.text }]}
                                        autoCapitalize='none'
                                        keyboardType={authMode === 'login' ? "default" : "email-address"}
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => passwordRef.current?.focus()}
                                    />
                                </View>

                                <View style={styles.authInputRow}>
                                    <Lock size={20} color={currentColors.subText} />
                                    <TextInput value={password} onChangeText={setPassword} placeholder={t('auth_password_placeholder')} placeholderTextColor={currentColors.subText} style={[styles.authInput, { color: currentColors.text }]} secureTextEntry ref={passwordRef} returnKeyType="done" onSubmitEditing={handleAuth} />
                                </View>

                                {/* BENİ HATIRLA */}
                                {authMode === 'login' && (
                                    <TouchableOpacity
                                        onPress={() => setRememberMe(!rememberMe)}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, marginTop: 5 }}
                                    >
                                        <View style={{
                                            width: 20, height: 20, borderRadius: 4, borderWidth: 2,
                                            borderColor: rememberMe ? COLORS.primary : currentColors.subText,
                                            alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: rememberMe ? COLORS.primary : 'transparent'
                                        }}>
                                            {rememberMe && <Check size={14} color="#fff" />}
                                        </View>
                                        <Text style={{ color: currentColors.text, fontSize: 14 }}>{t('remember_me')}</Text>
                                    </TouchableOpacity>
                                )}

                                {/* GİRİŞ BUTONU */}
                                <TouchableOpacity onPress={handleAuth} style={[styles.createBtn, { marginTop: 10 }]}>
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                                        {authMode === 'login' ? t('auth_login_tab') : t('auth_signup_tab')}
                                    </Text>
                                </TouchableOpacity>

                                {/* ŞİFREMİ UNUTTUM */}
                                {authMode === 'login' && (
                                    <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} style={{ marginTop: 15, alignSelf: 'center', padding: 5 }}>
                                        <Text style={{ color: currentColors.subText, fontSize: 14, fontWeight: '500' }}>{t('forgot_password')}</Text>
                                    </TouchableOpacity>
                                )}

                                {/* GİRİŞ / KAYIT GEÇİŞİ */}
                                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 25, alignItems: 'center' }}>
                                    <Text style={{ color: currentColors.subText, fontSize: 14 }}>
                                       {authMode === 'login' ? t('no_account') : t('already_have_account')}
                                    </Text>
                                    <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                                        <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 14 }}>
                                            {authMode === 'login' ? t('auth_signup_tab') : t('auth_login_tab')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* SOSYAL MEDYA BUTONLARI (Artık ana View içinde) */}
                            <View style={{ marginTop: 20, gap: 10 }}>
                                <TouchableOpacity disabled={!request} onPress={() => promptAsync()} style={[styles.socialBtn, { backgroundColor: currentColors.surface, flexDirection: 'row', gap: 10, justifyContent: 'center' }]}>
                                    <Globe size={20} color={currentColors.text} />
                                    <Text style={{ color: currentColors.text, fontWeight: '600' }}>{t('auth_google_continue')}</Text>
                                </TouchableOpacity>

                                {Platform.OS === 'ios' && (
                                    <AppleAuthentication.AppleAuthenticationButton
                                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                        buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                        cornerRadius={12}
                                        style={{ width: '100%', height: 50 }}
                                        onPress={handleAppleLogin}
                                    />
                                )}
                                {Platform.OS !== 'web' && (
                                    <TouchableOpacity
                                        onPress={handleGuestLogin}
                                        style={{ marginTop: 15, padding: 10, alignItems: 'center' }}
                                    >
                                        <Text style={{ color: currentColors.subText, fontSize: 14, textDecorationLine: 'underline' }}>
                                            {t('continue_guest')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* TOAST MESAJI (Artık ana View içinde) */}
                        {customToast.visible && (
                            <View style={{
                                position: 'absolute', top: 50, left: 20, right: 20, zIndex: 9999,
                                backgroundColor: customToast.type === 'error' ? '#fee2e2' : (customToast.type === 'warning' ? '#fef3c7' : '#f0fdf4'),
                                padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
                                shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
                                borderWidth: 1, borderColor: customToast.type === 'error' ? '#ef4444' : (customToast.type === 'warning' ? '#f59e0b' : '#10b981')
                            }}>
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: customToast.type === 'error' ? '#ef4444' : (customToast.type === 'warning' ? '#f59e0b' : '#10b981'), alignItems: 'center', justifyContent: 'center' }}>
                                    {customToast.type === 'success' && <Check size={18} color="#fff" />}
                                    {customToast.type === 'error' && <X size={18} color="#fff" />}
                                    {customToast.type === 'warning' && <AlertCircle size={18} color="#fff" />}
                                    {customToast.type === 'info' && <Bell size={18} color="#fff" />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#1e293b', fontWeight: 'bold', fontSize: 13 }}>{customToast.title}</Text>
                                    <Text style={{ color: '#475569', fontSize: 11 }}>{customToast.message}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setCustomToast({ ...customToast, visible: false })}><X size={16} color="#475569" /></TouchableOpacity>
                            </View>
                        )}

                    </View>
                    {/* 👆👆👆 ANA KAPLAYICI VIEW BURADA BİTİYOR 👆👆👆 */}

                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        );
    }

    // --- E-POSTA DOĞRULAMA EKRANI (Ara Katman) ---
    // Kullanıcı giriş yapmış ama e-postasını doğrulamamışsa burası çalışır.
    // Misafir kullanıcılar (isAnonymous) bu kontrole takılmaz.
    if (user && !user.isAnonymous && !user.emailVerified) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: currentColors.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ alignItems: 'center', maxWidth: 300 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                        <Mail size={40} color="#d97706" />
                    </View>

                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: currentColors.text, textAlign: 'center', marginBottom: 10 }}>
                       {t('mail_check')}
                    </Text>

                    <Text style={{ fontSize: 14, color: currentColors.subText, textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
                         {tFormat('verify_email_info', { email: user.email })}
                    </Text>

                    {/* 1. Kontrol Butonu: Logic Güçlendirildi */}
                    <TouchableOpacity
                        onPress={async () => {
                            setIsAuthLoading(true);
                            try {
                                // auth.currentUser üzerinden yenileme yapmak daha garantidir
                                await auth.currentUser?.reload(); 
                                const currentUser = auth.currentUser;

                                if (currentUser?.emailVerified) {
                                    // State'i güncelle ve içeri al
                                    setUser({ ...user, emailVerified: true });
                                    showToast(t('success'), t('acc_ok'), 'success');
                                } else {
                                    showToast(t('info'), t('nt_yt_chck'), 'warning');
                                }
                            } catch (e) {
                                console.log(e);
                                showToast(t('error_title'), t('c_err'), 'error');
                            } finally {
                                setIsAuthLoading(false);
                            }
                        }}
                        style={{ backgroundColor: COLORS.primary, width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 }}
                    >
                        {isAuthLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('check_chck')}</Text>}
                    </TouchableOpacity>

                    {/* 2. Tekrar Gönder Butonu: Hata Yakalama ve Token Yenileme Eklendi */}
                    <TouchableOpacity
                        onPress={async () => {
                            setIsAuthLoading(true); // Yükleniyor aç
                            try {
                                if (auth.currentUser) {
                                    // Önce kullanıcıyı yenile (Bayat oturum hatasını önler)
                                    await auth.currentUser.reload();
                                    // Sonra maili gönder
                                    await sendEmailVerification(auth.currentUser);
                                    showToast(t('success'), t('send_again_mail_cc'), 'success');
                                }
                            } catch (e: any) {
                                console.error("Mail Error:", e);

                                if (e.code === 'auth/too-many-requests') {
                                    showToast(t('error_title'), t('te_veel_req'), 'error');
                                } else if (e.code === 'auth/requires-recent-login') {
                                    // KRİTİK EKLEME: Oturum çok eskiyse kullanıcıyı uyar
                                    showToast(t('error_title'), t('log_again'), 'error');
                                } else {
                                    showToast(t('error_title'), t('uns_sen_mail'), 'error');
                                }
                            } finally {
                                setIsAuthLoading(false); // Yükleniyor kapat
                            }
                        }}
                        style={{ padding: 15, width: '100%', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: currentColors.subText, borderRadius: 12 }}
                    >
                        <Text style={{ color: currentColors.text, fontWeight: '600' }}>{t('send_again')}</Text>
                    </TouchableOpacity>

                    {/* 3. Çıkış Yap / Yanlış Mail */}
                    <TouchableOpacity onPress={handleLogout} style={{ alignItems: 'center' }}>
                        <Text style={{ color: COLORS.danger, fontSize: 14, textDecorationLine: 'underline', fontWeight: '600' }}>
                            {t('different_mail')} {t('logout')}
                        </Text>
                        {/* Kullanıcıya ipucu vermek için küçük bir metin ekledim, istersen kaldırabilirsin */}
                        <Text style={{ color: currentColors.subText, fontSize: 11, marginTop: 4 }}>
                            {t('out_in')}
                        </Text>
                    </TouchableOpacity>

                </View>

                {/* Toast Mesajı */}
                {customToast.visible && (
                    <View style={{
                        position: 'absolute', top: 50, left: 20, right: 20,
                        backgroundColor: customToast.type === 'error' ? '#fee2e2' : (customToast.type === 'warning' ? '#fef3c7' : '#f0fdf4'),
                        padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
                        shadowColor: "#000", shadowOpacity: 0.1, elevation: 5, borderWidth: 1,
                        borderColor: customToast.type === 'error' ? '#ef4444' : (customToast.type === 'warning' ? '#f59e0b' : '#10b981')
                    }}>
                        <Text style={{ flex: 1, color: '#1e293b', fontSize: 13 }}>{customToast.message}</Text>
                    </View>
                )}
            </SafeAreaView>
        );
    }

    {/* ================================================================================= */ }
    {/* 1. HEADER (LOGO) - Chat odası hariç her yerde görünür */ }
    {/* ================================================================================= */ }
    return (
       <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {activeTab !== 'chat_room' && (
            <View style={{
                flexDirection: 'row',       // Yan yana dizilim
                alignItems: 'center',       // Dikeyde ortala
                justifyContent: 'space-between', // Öğeler arasına boşluk bırak
                paddingHorizontal: 16,      // Sağdan soldan boşluk
                paddingVertical: 10,        // Üstten alttan boşluk
                height: 60,                 // Sabit bir yükseklik (gerekirse artırılabilir)
                backgroundColor: currentColors.bg, // Arka plan rengi
                // İsteğe bağlı: Hafif alt çizgi veya gölge eklenebilir
                // borderBottomWidth: 1,
                // borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }}>
                
                {/* --- 1. SOL TARAFTAKİ ALAN (Sabit Genişlik) --- */}
                <View style={{ width: 40, alignItems: 'flex-start' }}>
                    {activeTab === 'list' ? (
                        <TouchableOpacity
                            onPress={() => setIsHistoryModalOpen(true)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Tıklama alanını genişletir
                            style={getIconButtonStyle(isDark)}
                        >
                            <CheckCircle2 size={22} color={COLORS.success} />
                        </TouchableOpacity>
                    ) : (
                        // Eğer sol buton yoksa boşluk bırakır, böylece logo kaymaz
                        <View />
                    )}
                </View>

                {/* --- 2. ORTA ALAN (Logo) --- */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('list')}
                        activeOpacity={0.7}
                        disabled={Platform.OS !== 'web'}
                    >
                        <Image
                            source={require('../../assets/Logo/Logo.png')}
                            style={{ width: 140, height: 40, resizeMode: 'contain' }} // Boyutlar optimize edildi
                        />
                    </TouchableOpacity>
                </View>

                {/* --- 3. SAĞ TARAFTAKİ ALAN (Sabit Genişlik) --- */}
                <View style={{ width: 40, alignItems: 'flex-end' }}>
                    {activeTab === 'list' && (
                        <TouchableOpacity
                            onPress={() => setIsAllTasksModalOpen(true)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={getIconButtonStyle(isDark)}
                        >
                            <CalendarDays size={22} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}

                    {activeTab === 'habits' && (
                        <TouchableOpacity
                            onPress={() => setIsHabitStatsModalOpen(true)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={getIconButtonStyle(isDark)}
                        >
                            <BarChart3 size={22} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                </View>

            </View>
        )}

                {/* ================================================================================= */}
                {/* 2. MODERN TARİH NAVİGASYONU & TAKVİM */}
                {/* ================================================================================= */}
                {(activeTab === 'list' || activeTab === 'habits') && (
                    <View style={{ marginBottom: 10, zIndex: 20 }}>

                        {/* ÜST NAVİGASYON BARI */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            marginBottom: isCalendarExpanded ? 15 : 5
                        }}>

                            {/* SOL OK */}
                            <TouchableOpacity
                                onPress={() => changeDate(-1)}
                                style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                                    alignItems: 'center', justifyContent: 'center',
                                    borderWidth: 1, borderColor: isDark ? 'transparent' : '#f1f5f9',
                                    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
                                }}
                            >
                                <ChevronLeft size={20} color={currentColors.text} />
                            </TouchableOpacity>

                            {/* ORTA TARİH BUTONU (Pill Shape) */}
                            <TouchableOpacity
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setIsCalendarExpanded(!isCalendarExpanded);
                                }}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: isCalendarExpanded ? COLORS.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#fff'),
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 24,
                                    borderWidth: 1,
                                    borderColor: isCalendarExpanded ? COLORS.primary : (isDark ? 'transparent' : '#f1f5f9'),
                                    shadowColor: isCalendarExpanded ? COLORS.primary : "#000",
                                    shadowOpacity: isCalendarExpanded ? 0.3 : 0.05,
                                    shadowRadius: 8, elevation: isCalendarExpanded ? 4 : 2,
                                    gap: 8
                                }}
                            >
                                <CalendarIcon size={16} color={isCalendarExpanded ? '#fff' : COLORS.primary} />
                                <Text style={{
                                    fontSize: 15,
                                    fontWeight: '700',
                                    color: isCalendarExpanded ? '#fff' : currentColors.text
                                }}>
                                    {selectedDate.getDate()} {getGreeting(lang) === 'tr' ? ' ' : '/'} {selectedDate.getMonth() + 1} {selectedDate.getFullYear()}
                                </Text>
                                {isCalendarExpanded ?
                                    <ChevronUp size={16} color="#fff" /> :
                                    <ChevronDown size={16} color={currentColors.subText} />
                                }
                            </TouchableOpacity>

                            {/* SAĞ OK */}
                            <TouchableOpacity
                                onPress={() => changeDate(1)}
                                style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                                    alignItems: 'center', justifyContent: 'center',
                                    borderWidth: 1, borderColor: isDark ? 'transparent' : '#f1f5f9',
                                    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
                                }}
                            >
                                <ChevronRight size={20} color={currentColors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* AÇILIR TAKVİM (AKORDEON) */}
                        {isCalendarExpanded && (
                            <View style={{
                                backgroundColor: currentColors.surface,
                                marginHorizontal: 20,
                                borderRadius: 24,
                                padding: 15,
                                borderWidth: 1,
                                borderColor: isDark ? '#334155' : '#f1f5f9',
                                shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
                            }}>
                                <Calendar
                                    current={getISODate(selectedDate)}
                                    key={`${lang}-${theme}`}
                                    markingType={'custom'}
                                    markedDates={calendarMarks}
                                    onDayPress={(day: any) => {
                                        const newDate = new Date(day.timestamp);
                                        newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                                        setSelectedDate(newDate);
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setIsCalendarExpanded(false);
                                    }}
                                    theme={{
                                        backgroundColor: 'transparent',
                                        calendarBackground: 'transparent',
                                        textSectionTitleColor: currentColors.subText,
                                        selectedDayBackgroundColor: COLORS.primary,
                                        selectedDayTextColor: '#ffffff',
                                        todayTextColor: COLORS.primary,
                                        dayTextColor: currentColors.text,
                                        textDisabledColor: isDark ? '#475569' : '#d9e1e8',
                                        arrowColor: COLORS.primary,
                                        monthTextColor: currentColors.text,
                                        indicatorColor: COLORS.primary,
                                        textDayFontWeight: '600',
                                        textMonthFontWeight: '800',
                                        textDayHeaderFontWeight: 'bold',
                                        textDayFontSize: 14,
                                        textMonthFontSize: 16,
                                        textDayHeaderFontSize: 12
                                    }}
                                />
                            </View>
                        )}
                    </View>
                )}

                {/* ================================================================================= */}
                {/* 3. ANA İÇERİK (PAGER VIEW veya CHAT ROOM) */}
                {/* ================================================================================= */}
                {activeTab === 'chat_room' && chatTarget ? (
                    renderChatRoom()
                ) : (
                    <View style={{ flex: 1 }}>
                        <PagerView
                            ref={pagerRef}
                            style={{ flex: 1, width: '100%', height: '100%' }}
                            initialPage={TAB_ORDER.indexOf(activeTab) >= 0 ? TAB_ORDER.indexOf(activeTab) : 0}
                            onPageSelected={handlePageScroll}
                            scrollEnabled={Platform.OS !== 'web'}
                        >
                            {/* --- SAYFA 0: GÖREVLER (TASKS) --- */}
                            <View key="0" style={{ flex: 1, width: '100%' }}>
                                <ScrollView
                                    contentContainerStyle={{
                                        paddingHorizontal: 20,
                                        paddingBottom: 120,
                                        width: '100%',
                                        maxWidth: 600, // Web'de içeriğin çok genişlemesini engeller
                                        alignSelf: 'center', // Web'de içeriği ortalar
                                        paddingTop: 10
                                    }}
                                    showsVerticalScrollIndicator={false}
                                >

                                    {/* --- 1. MODERN PROGRESS BAR --- */}
                                    {totalTodaysTasks > 0 && (
                                        <View style={{
                                            backgroundColor: COLORS.primary,
                                            borderRadius: 24,
                                            padding: 20,
                                            marginBottom: 25,
                                            shadowColor: COLORS.primary,
                                            shadowOpacity: 0.4,
                                            shadowRadius: 12,
                                            shadowOffset: { width: 0, height: 8 },
                                            elevation: 8,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            {/* Arka Plan Süslemesi (Circle) */}
                                            <View style={{ position: 'absolute', top: -60, left: -60, width: 320, height: 140, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />

                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                                <View>
                                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>
                                                        {t('daily_progress').toUpperCase()}
                                                    </Text>
                                                    <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 }}>
                                                        {Math.round(taskProgress)}%
                                                    </Text>
                                                </View>
                                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                                                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                                        {completedTodaysTasks} / {totalTodaysTasks}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                                                <View style={{ width: `${taskProgress}%`, height: '100%', backgroundColor: '#fff', borderRadius: 4 }} />
                                            </View>
                                        </View>
                                    )}

                                    {/* --- 2. GECİKEN GÖREVLER (OVERDUE) - GÜNCELLENMİŞ --- */}
                                    {overdueTasks.length > 0 && (
                                        <View style={{ marginBottom: 25 }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                    setIsOverdueExpanded(!isOverdueExpanded);
                                                }}
                                                activeOpacity={0.8}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: 16,
                                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                                                    borderRadius: 18,
                                                    borderWidth: 1,
                                                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fee2e2'
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={{ backgroundColor: COLORS.danger, padding: 8, borderRadius: 10 }}>
                                                        <AlertCircle size={20} color="#fff" />
                                                    </View>
                                                    <View>
                                                        <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 15 }}>
                                                            {t('overdue')}
                                                        </Text>
                                                        <Text style={{ color: COLORS.danger, fontSize: 11, opacity: 0.8, fontWeight: '500' }}>
                                                            {overdueTasks.length} {t('tasks_waiting')}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ backgroundColor: COLORS.danger + '15', padding: 6, borderRadius: 20 }}>
                                                    {isOverdueExpanded ? <ChevronUp size={20} color={COLORS.danger} /> : <ChevronDown size={20} color={COLORS.danger} />}
                                                </View>
                                            </TouchableOpacity>

                                            {isOverdueExpanded && (
                                                <View style={{ marginTop: 12, gap: 10, paddingHorizontal: 4 }}>
                                                    {overdueTasks.map((task, index) => (
                                                        <View
                                                            key={task.id}
                                                            style={{
                                                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                                                padding: 16, backgroundColor: currentColors.surface,
                                                                borderRadius: 16, borderLeftWidth: 4, borderLeftColor: COLORS.danger,
                                                                shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
                                                            }}
                                                        >
                                                            {/* 1. TAMAMLAMA KUTUCUĞU (YENİ EKLENDİ) */}
                                                            <TouchableOpacity
                                                                onPress={() => toggleTask(task)}
                                                                style={{
                                                                    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                                                                    borderColor: COLORS.danger, marginRight: 12,
                                                                    alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                            >
                                                                {/* Boş daire, basınca tamamlandı sayılır ve listeden gider */}
                                                            </TouchableOpacity>

                                                            <View style={{ flex: 1, marginRight: 10 }}>
                                                                <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: '600', color: currentColors.text, marginBottom: 6 }}>
                                                                    {task.text}
                                                                </Text>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                    <CalendarIcon size={12} color={COLORS.danger} />
                                                                    <Text style={{ fontSize: 12, color: COLORS.danger, fontWeight: '600' }}>{task.date}</Text>
                                                                </View>
                                                            </View>

                                                            {/* AKSİYON BUTONLARI */}
                                                            <View style={{ flexDirection: 'row', gap: 8 }}>

                                                                {/* 2. DÜZENLEME BUTONU (YENİ EKLENDİ - Tarihi değiştirmek için) */}
                                                                {(task.assignedBy === user.uid || task.assignedTo === user.uid) && (
                                                                    <TouchableOpacity
                                                                        onPress={() => openEditModal(task)}
                                                                        style={{ padding: 10, backgroundColor: COLORS.primary + '15', borderRadius: 12 }}
                                                                    >
                                                                        <Edit2 size={18} color={COLORS.primary} />
                                                                    </TouchableOpacity>
                                                                )}

                                                                {/* 3. SİLME BUTONU (Zaten vardı) */}
                                                                <TouchableOpacity
                                                                    onPress={() => deleteTask(task)}
                                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                                    style={{ padding: 10, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderRadius: 12 }}
                                                                >
                                                                    <Trash2 size={18} color={COLORS.danger} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    )}
                                    {/* --- 3. AKTİF GÖREVLER LİSTESİ --- */}
                                    <View style={{ gap: 12 }}>
                                        {activeTasks.length > 0 ? (
                                            activeTasks.map((task, index) => (
                                                <React.Fragment key={task.id}>
                                                    {renderTask(task)}
                                                    {/* Reklam Alanı (Her 5 görevde bir) */}
                                                    {!isPremium && (index + 1) % 5 === 0 && (
                                                        <View style={{ marginVertical: 15, alignItems: 'center' }}>
                                                            <OmmioAdBanner isPremium={false} />
                                                        </View>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            /* BOŞ DURUM (EMPTY STATE) */
                                            completedTasks.length === 0 && overdueTasks.length === 0 && (
                                                <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 30 }}>
                                                    <View style={{
                                                        width: 100, height: 100, borderRadius: 50,
                                                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#e0e7ff',
                                                        alignItems: 'center', justifyContent: 'center', marginBottom: 20
                                                    }}>
                                                        <Check size={48} color={COLORS.primary} strokeWidth={2.5} />
                                                    </View>
                                                    <Text style={{ fontSize: 22, fontWeight: '800', color: currentColors.text, marginBottom: 8, textAlign: 'center' }}>
                                                        {t('all_good')}
                                                    </Text>
                                                    <Text style={{ fontSize: 15, color: currentColors.subText, textAlign: 'center', lineHeight: 22, maxWidth: 250 }}>
                                                        {t('no_tasks_today')}
                                                    </Text>
                                                </View>
                                            )
                                        )}
                                    </View>

                                    {/* --- 4. TAMAMLANAN GÖREVLER (AKORDEON) --- */}
                                    {completedTasks.length > 0 && (
                                        <View style={{ marginTop: 30 }}>
                                            <TouchableOpacity
                                                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsCompletedExpanded(!isCompletedExpanded); }}
                                                activeOpacity={0.7}
                                                style={{
                                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                                                    borderRadius: 14, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <View style={{ backgroundColor: COLORS.success + '20', padding: 6, borderRadius: 8 }}>
                                                        <CheckCircle2 size={18} color={COLORS.success} />
                                                    </View>
                                                    <Text style={{ color: currentColors.text, fontWeight: '700', fontSize: 14 }}>
                                                        {t('completed')} <Text style={{ color: currentColors.subText }}>({completedTasks.length})</Text>
                                                    </Text>
                                                </View>
                                                {isCompletedExpanded ? <ChevronUp size={18} color={currentColors.subText} /> : <ChevronDown size={18} color={currentColors.subText} />}
                                            </TouchableOpacity>

                                            {isCompletedExpanded && (
                                                <View style={{ opacity: 0.6, gap: 10, marginTop: 15 }}>
                                                    {completedTasks.map(task => renderTask(task))}
                                                </View>
                                            )}
                                        </View>
                                    )}

                                </ScrollView>
                            </View>

                            {/* --- SAYFA 1: ALIŞKANLIKLAR (HABITS) --- */}
                            <View key="1" style={{ flex: 1, width: '100%' }}>
                                <ScrollView
                                    contentContainerStyle={{
                                        paddingHorizontal: 20,
                                        paddingBottom: 120,
                                        width: '100%',
                                        maxWidth: 600, // Web'de içeriğin yayılmasını engeller
                                        alignSelf: 'center', // Web'de içeriği ortalar
                                        paddingTop: 10
                                    }}
                                    showsVerticalScrollIndicator={false}
                                >

                                    {/* --- 1. MODERN PROGRESS BAR --- */}
                                    <View style={{
                                        backgroundColor: COLORS.primary,
                                        borderRadius: 24,
                                        padding: 20,
                                        marginBottom: 25,
                                        shadowColor: COLORS.primary,
                                        shadowOpacity: 0.4,
                                        shadowRadius: 12,
                                        shadowOffset: { width: 0, height: 8 },
                                        elevation: 8,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Dekoratif Arka Plan */}
                                        <View style={{ position: 'absolute', top: -60, left: -60, width: 320, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)' }} />

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                            <View>
                                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>
                                                    {t('daily_progress').toUpperCase()}
                                                </Text>
                                                <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 }}>
                                                    {Math.round(habitProgress)}%
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                                    {completedTodaysHabits} / {totalTodaysHabits}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                                            <View style={{ width: `${habitProgress}%`, height: '100%', backgroundColor: '#fff', borderRadius: 4 }} />
                                        </View>
                                    </View>

                                    {/* --- 2. ALIŞKANLIK LİSTESİ --- */}
                                    <View style={{ gap: 12 }}>
                                        {todaysHabits.length > 0 ? (
                                            todaysHabits.map((habit, index) => {
                                                const isDone = habit.completedDates.includes(currentISODate);
                                                const streak = habit.completedDates.length;
                                                const cat = categories.find(c => c.id === habit.categoryId);
                                                const cc = getCategoryColor(cat?.color || 'purple');

                                                return (
                                                    <React.Fragment key={habit.id}>
                                                        <TouchableOpacity
                                                            onPress={() => toggleHabitCompletion(habit, currentISODate)}
                                                            activeOpacity={0.8}
                                                            style={{
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: 16,
                                                                backgroundColor: currentColors.surface,
                                                                borderRadius: 20,
                                                                borderWidth: 1,
                                                                borderColor: isDone ? 'transparent' : (isDark ? '#334155' : '#f1f5f9'),
                                                                opacity: isDone ? 0.7 : 1, // Tamamlanınca hafif silikleşsin
                                                                shadowColor: "#000",
                                                                shadowOffset: { width: 0, height: 4 },
                                                                shadowOpacity: isDone ? 0 : 0.05, // Tamamlanınca gölge kalksın
                                                                shadowRadius: 8,
                                                                elevation: isDone ? 0 : 3
                                                            }}
                                                        >
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>

                                                                {/* Custom Checkbox (Yuvarlak) */}
                                                                <View style={{
                                                                    width: 28, height: 28, borderRadius: 14,
                                                                    borderWidth: isDone ? 0 : 2,
                                                                    borderColor: isDone ? 'transparent' : '#cbd5e1',
                                                                    backgroundColor: isDone ? COLORS.primary : 'transparent',
                                                                    alignItems: 'center', justifyContent: 'center'
                                                                }}>
                                                                    {isDone && <Check size={16} color="#fff" strokeWidth={3} />}
                                                                </View>

                                                                <View style={{ flex: 1 }}>
                                                                    <Text style={{
                                                                        fontSize: 16,
                                                                        fontWeight: '700',
                                                                        color: currentColors.text,
                                                                        textDecorationLine: isDone ? 'line-through' : 'none',
                                                                        marginBottom: 6
                                                                    }}>
                                                                        {habit.title.startsWith('habit_') ? t(habit.title) : habit.title}
                                                                    </Text>

                                                                    {/* Rozetler (Badges) */}
                                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>

                                                                        {/* Streak (Seri) */}
                                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' }}>
                                                                            <Flame size={12} color="#f97316" fill="#f97316" />
                                                                            <Text style={{ fontSize: 11, color: '#c2410c', fontWeight: '700' }}>{streak} {t('day')}</Text>
                                                                        </View>

                                                                        {/* Kategori */}
                                                                        <View style={{ backgroundColor: cc.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                                            <Text style={{ fontSize: 11, color: cc.hex, fontWeight: '600' }}>{cat?.name}</Text>
                                                                        </View>

                                                                        {/* Saat */}
                                                                        {habit.notificationTime && (
                                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                                                <Text style={{ fontSize: 11, color: currentColors.subText }}>⏰ {habit.notificationTime}</Text>
                                                                            </View>
                                                                        )}
                                                                    </View>
                                                                </View>
                                                            </View>

                                                            {/* Silme Butonu */}
                                                            <TouchableOpacity
                                                                onPress={() => askConfirmation(t('delete'), t('delete_habit_confirm'), () => deleteHabit(habit), true)}
                                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                                style={{ padding: 8 }}
                                                            >
                                                                <Trash2 size={18} color={currentColors.subText} style={{ opacity: 0.6 }} />
                                                            </TouchableOpacity>
                                                        </TouchableOpacity>

                                                        {/* Reklam Alanı (Her 5 alışkanlıkta bir) */}
                                                        {!isPremium && (index + 1) % 5 === 0 && (
                                                            <View style={{ marginVertical: 15, alignItems: 'center' }}>
                                                                <OmmioAdBanner isPremium={false} />
                                                            </View>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        ) : (
                                            /* BOŞ DURUM (EMPTY STATE) */
                                            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 30 }}>
                                                <View style={{
                                                    width: 100, height: 100, borderRadius: 50,
                                                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#e0e7ff',
                                                    alignItems: 'center', justifyContent: 'center', marginBottom: 20
                                                }}>
                                                    <Repeat size={48} color={COLORS.primary} strokeWidth={2.5} />
                                                </View>
                                                <Text style={{ fontSize: 22, fontWeight: '800', color: currentColors.text, marginBottom: 8, textAlign: 'center' }}>
                                                    {t('new_habit')}!
                                                </Text>
                                                <Text style={{ fontSize: 15, color: currentColors.subText, textAlign: 'center', lineHeight: 22, maxWidth: 250 }}>
                                                    {t('motivational_daily')}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {/* --- 3. GRUP ALIŞKANLIKLARI (EN ALTTA) --- */}
                                    <View style={{ marginTop: 25 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                            <Text style={{ fontSize: 18, fontWeight: '800', color: currentColors.text }}>
                                                {t('groups_t')}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setIsGroupModalOpen(true)}
                                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', padding: 8, borderRadius: 12 }}
                                            >
                                                <Plus size={20} color={COLORS.primary} />
                                            </TouchableOpacity>
                                        </View>

                                        {groupHabits.length > 0 ? (
                                            <View>
                                                {groupHabits.map(group => renderGroupHabitCard(group))}
                                            </View>
                                        ) : (
                                            <TouchableOpacity onPress={() => setIsGroupModalOpen(true)} style={{ padding: 20, backgroundColor: currentColors.surface, borderRadius: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: currentColors.subText }}>
                                                <Users size={32} color={currentColors.subText} style={{ marginBottom: 10 }} />
                                                <Text style={{ color: currentColors.subText, textAlign: 'center' }}>{t('frnd_hbt')}</Text>
                                                <Text style={{ color: COLORS.primary, fontWeight: 'bold', marginTop: 5 }}>{t('crt_group')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* --- SAYFA 2: MESAJLAR (MESSAGES) --- */}
                            <View key="2" style={{ flex: 1, width: '100%' }}>
                                <ScrollView
                                    contentContainerStyle={{
                                        paddingHorizontal: 20,
                                        paddingBottom: 120,
                                        width: '100%',
                                        maxWidth: 600, // Web'de içeriği sınırlar
                                        alignSelf: 'center', // Ortalar
                                        paddingTop: 10
                                    }}
                                    showsVerticalScrollIndicator={false}
                                >

                                    {/* --- MİSAFİR KULLANICI UYARISI --- */}
                                    {user.isAnonymous ? (
                                        <View style={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginTop: 40,
                                            backgroundColor: currentColors.surface,
                                            padding: 30,
                                            borderRadius: 24,
                                            shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 5
                                        }}>
                                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                                <MessageCircle size={40} color={COLORS.primary} />
                                            </View>
                                            <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 20, color: currentColors.text, marginBottom: 10 }}>
                                                {t('profile_edit_desc')}
                                            </Text>
                                            <Text style={{ textAlign: 'center', color: currentColors.subText, marginBottom: 25, fontSize: 14, lineHeight: 20, maxWidth: 280 }}>
                                                {t('messaging_guest_desc')}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setIsGuestModalOpen(true)}
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    paddingHorizontal: 30,
                                                    paddingVertical: 14,
                                                    borderRadius: 16,
                                                    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('create_ac')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        /* --- MESAJ LİSTESİ KAPSAYICISI --- */
                                        /* gap: 12 zaten öğeler arası boşluğu yönetiyor, marginlere gerek yok */
                                        <View style={{ gap: 12 }}>

                                            {/* --- DURUM KONTROLÜ --- */}
                                            {contacts.length === 0 ? (
                                                /* HİÇ ARKADAŞ YOKSA (EMPTY STATE) */
                                                <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.8 }}>
                                                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                                        <MessageCircle size={40} color={currentColors.subText} />
                                                    </View>
                                                    <Text style={{ fontSize: 18, fontWeight: '700', color: currentColors.text, marginBottom: 8 }}>
                                                        {t('no_connections')}
                                                    </Text>
                                                    <Text style={{ color: currentColors.subText, textAlign: 'center', maxWidth: 250 }}>
                                                        {t('ad_frnd')}
                                                    </Text>
                                                </View>
                                            ) : (
                                                /* ARKADAŞ VARSA LİSTELE */
                                                (() => {
                                                    // Filtrelemeyi değişkene atıyoruz ki aşağıda kontrol edebilelim
                                                    const filteredContacts = (contacts as Contact[])
                                                        .filter((contact: Contact) => {
                                                            const lowerCaseSearch = searchFriends.toLowerCase();
                                                            return contact.username.toLowerCase().includes(lowerCaseSearch) ||
                                                                (contact.displayName && contact.displayName.toLowerCase().includes(lowerCaseSearch));
                                                        })
                                                        .sort((a: Contact, b: Contact) => {
                                                            const timeA = chatPreviews[a.uid]?.timestamp?.seconds || 0;
                                                            const timeB = chatPreviews[b.uid]?.timestamp?.seconds || 0;
                                                            return timeB - timeA;
                                                        });

                                                    // --- EĞER ARAMA SONUCU BOŞSA UYARI GÖSTER (DÜZEN KAYMASINI ÖNLER) ---
                                                    if (filteredContacts.length === 0 && searchFriends.length > 0) {
                                                        return (
                                                            <View style={{ alignItems: 'center', marginTop: 30, opacity: 0.6 }}>
                                                                <Text style={{ color: currentColors.subText }}>
                                                                      {tFormat('no_results_for', { query: searchFriends })}
                                                                </Text>
                                                            </View>
                                                        );
                                                    }

                                                    // LİSTEYİ RENDER ET
                                                    return filteredContacts.map((contact: Contact) => {
                                                        const preview = chatPreviews[contact.uid] || { text: "", timestamp: null, unread: 0 };
                                                        const hasUnread = preview.unread > 0;

                                                        return (
                                                            <TouchableOpacity
                                                                key={contact.uid}
                                                                onPress={() => { setActiveTab('chat_room'); setChatTarget(contact); }}
                                                                activeOpacity={0.7}
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    alignItems: 'center',
                                                                    backgroundColor: currentColors.surface,
                                                                    padding: 16,
                                                                    borderRadius: 20,
                                                                    borderWidth: 1,
                                                                    borderColor: isDark ? '#334155' : 'transparent',
                                                                    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
                                                                    /* BURADAKİ marginBottom: 10 SİLİNDİ (Parent gap: 12 kullanıyor) */
                                                                }}
                                                            >
                                                                {/* Avatar */}
                                                                <View style={{ position: 'relative', marginRight: 15 }}>
                                                                    <View style={{
                                                                        width: 56, height: 56, borderRadius: 28,
                                                                        backgroundColor: COLORS.secondary,
                                                                        alignItems: 'center', justifyContent: 'center',
                                                                        borderWidth: 2, borderColor: currentColors.bg
                                                                    }}>
                                                                        {contact.photoURL ? (
                                                                            <Image source={{ uri: contact.photoURL }} style={{ width: '100%', height: '100%', borderRadius: 28 }} />
                                                                        ) : (
                                                                            <Text style={{ fontWeight: '800', color: '#fff', fontSize: 20 }}>
                                                                                {contact.username[0].toUpperCase()}
                                                                            </Text>
                                                                        )}
                                                                    </View>
                                                                </View>

                                                                {/* İçerik */}
                                                                <View style={{ flex: 1 }}>
                                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                                                                        <Text
                                                                            numberOfLines={1}
                                                                            style={{ fontSize: 16, fontWeight: '700', color: currentColors.text, flex: 1, marginRight: 10 }}
                                                                        >
                                                                            {contact.displayName || contact.username}
                                                                        </Text>

                                                                        {preview.timestamp && (
                                                                            <Text style={{
                                                                                fontSize: 11,
                                                                                color: hasUnread ? COLORS.primary : currentColors.subText,
                                                                                fontWeight: hasUnread ? '700' : '500'
                                                                            }}>
                                                                                {formatChatTime(preview.timestamp)}
                                                                            </Text>
                                                                        )}
                                                                    </View>

                                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Text
                                                                            numberOfLines={1}
                                                                            style={{
                                                                                fontSize: 13,
                                                                                color: hasUnread ? currentColors.text : currentColors.subText,
                                                                                fontWeight: hasUnread ? '600' : '400',
                                                                                flex: 1,
                                                                                marginRight: 10
                                                                            }}
                                                                        >
                                                                            {preview.text || t('start_chatting')}
                                                                        </Text>

                                                                        {hasUnread && (
                                                                            <View style={{
                                                                                backgroundColor: COLORS.primary,
                                                                                paddingHorizontal: 8,
                                                                                height: 20,
                                                                                borderRadius: 10,
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}>
                                                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                                                                                    {preview.unread > 9 ? '9+' : preview.unread}
                                                                                </Text>
                                                                            </View>
                                                                        )}
                                                                    </View>
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    });
                                                })()
                                            )}
                                        </View>
                                    )}
                                </ScrollView>
                    
                            {/* --- 2. SAYFA (MESAJLAR) İÇİN YENİ ARAMA ÇUBUĞU --- */}
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : undefined}
                                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
                                style={{
                                    position: 'absolute',
                                    bottom: 20, // Alt menünün hemen üstünde dursun
                                    width: '100%',
                                    alignItems: 'center',
                                    zIndex: 999,
                                }}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    width: '90%',
                                    height: 50,
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    borderRadius: 25,
                                    paddingHorizontal: 15,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 10,
                                    elevation: 5,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                }}>
                                    <MessageCircle size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        value={searchFriends}
                                        onChangeText={setSearchFriends}
                                        placeholder={t('search_chats')}
                                        placeholderTextColor={currentColors.subText}
                                        style={{ flex: 1, color: currentColors.text, fontSize: 15, height: '100%' }}
                                    />
                                    {searchFriends.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchFriends('')} style={{ padding: 5 }}>
                                            <X size={18} color={currentColors.subText} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </KeyboardAvoidingView>
                            </View>

                            {/* --- SAYFA 3: SOSYAL (SOCIAL) --- */}
                            <View key="3" style={{ flex: 1, width: '100%' }}>
                                <ScrollView
                                    contentContainerStyle={{
                                        paddingHorizontal: 20,
                                        paddingBottom: 120,
                                        width: '100%',
                                        maxWidth: 600, // Web uyumluluğu
                                        alignSelf: 'center', // Ortala
                                        paddingTop: 10
                                    }}
                                    showsVerticalScrollIndicator={false}
                                >

                                    {/* --- MİSAFİR KULLANICI UYARISI --- */}
                                    {user.isAnonymous ? (
                                        <View style={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginTop: 40,
                                            backgroundColor: currentColors.surface,
                                            padding: 30,
                                            borderRadius: 24,
                                            shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 5
                                        }}>
                                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                                <Users size={40} color={COLORS.primary} />
                                            </View>
                                            <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 20, color: currentColors.text, marginBottom: 10 }}>
                                                {t('social1')}
                                            </Text>
                                            <Text style={{ textAlign: 'center', color: currentColors.subText, marginBottom: 25, fontSize: 14, lineHeight: 20, maxWidth: 280 }}>
                                                {t('register_af')}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setIsGuestModalOpen(true)}
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    paddingHorizontal: 30,
                                                    paddingVertical: 14,
                                                    borderRadius: 16,
                                                    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('create_ac')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ gap: 25 }}>

                                            {/* --- ARKADAŞLIK İSTEKLERİ --- */}
                                            {friendRequests.length > 0 && (
                                                <View>
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: currentColors.subText, marginBottom: 12, letterSpacing: 0.5 }}>
                                                        {t('social_pending_requests').toUpperCase()}
                                                    </Text>
                                                    {friendRequests.map(req => (
                                                        <View
                                                            key={req.id}
                                                            style={{
                                                                backgroundColor: currentColors.surface,
                                                                padding: 16,
                                                                borderRadius: 20,
                                                                marginBottom: 12,
                                                                flexDirection: 'row',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                borderLeftWidth: 4,
                                                                borderLeftColor: COLORS.warning,
                                                                shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3
                                                            }}
                                                        >
                                                            <View>
                                                                <Text style={{ color: currentColors.text, fontWeight: '700', fontSize: 16 }}>{req.fromUsername}</Text>
                                                                <Text style={{ color: currentColors.subText, fontSize: 12, marginTop: 2 }}>{t('istek')}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                                                <TouchableOpacity onPress={() => rejectRequest(req.id)} style={{ padding: 6, backgroundColor: '#fee2e2', borderRadius: 10 }}>
                                                                    <X size={20} color={COLORS.danger} />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => acceptRequest(req)} style={{ padding: 6, backgroundColor: '#dcfce7', borderRadius: 10 }}>
                                                                    <Check size={20} color={COLORS.success} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        

                                            {/* --- ARKADAŞ LİSTESİ --- */}
                                            {contacts.length === 0 && friendRequests.length === 0 ? (
                                                <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.6 }}>
                                                    <Users size={48} color={currentColors.subText} />
                                                    <Text style={{ textAlign: 'center', color: currentColors.subText, marginTop: 15, fontSize: 15 }}>
                                                        {t('no_users')}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={{ gap: 12 }}>
                                                    {/* --- SOSYAL SEKME KİŞİ LİSTESİ (TEMİZLENMİŞ) --- */}
                                                    {filteredSocialContacts.map(contact => {
                                                        const isExpanded = expandedContactId === contact.uid;
                                                        // Görev yorum sayısını güvenli al
                                                        const taskUnread = taskUnreadCounts[contact.uid] || 0;

                                                        return (
                                                            <View
                                                                key={contact.uid}
                                                                style={{
                                                                    backgroundColor: currentColors.surface,
                                                                    borderRadius: 24,
                                                                    marginBottom: 10,
                                                                    borderWidth: 1,
                                                                    borderColor: isDark ? '#334155' : 'transparent',
                                                                    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                                                                    overflow: 'hidden'
                                                                }}
                                                            >
                                                                {/* 1. TIKLANABİLİR ANA SATIR */}
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                                        setExpandedContactId(isExpanded ? null : contact.uid);
                                                                    }}
                                                                    activeOpacity={0.7}
                                                                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                                                                >

                                                                    {/* AVATAR ALANI */}
                                                                    <View style={{ position: 'relative', marginRight: 15 }}>
                                                                        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: currentColors.bg }}>
                                                                            {contact.photoURL ? (
                                                                                <Image source={{ uri: contact.photoURL }} style={{ width: '100%', height: '100%', borderRadius: 26 }} />
                                                                            ) : (
                                                                                <Text style={{ fontWeight: '800', color: '#fff', fontSize: 20 }}>{contact.username[0].toUpperCase()}</Text>
                                                                            )}
                                                                        </View>

                                                                        {/* 👇 KIRMIZI KUTUCUK (Sadece Görev Mesajı Varsa) 👇 */}
                                                                        {taskUnread > 0 && (
                                                                            <View style={{
                                                                                position: 'absolute', top: -2, right: -2, width: 20, height: 20,
                                                                                borderRadius: 10, backgroundColor: COLORS.danger, borderWidth: 2, borderColor: currentColors.surface,
                                                                                alignItems: 'center', justifyContent: 'center', zIndex: 999, elevation: 10
                                                                            }}>
                                                                                <ListTodo size={10} color="#fff" strokeWidth={4} />
                                                                            </View>
                                                                        )}
                                                                    </View>

                                                                    {/* İSİM ALANI */}
                                                                    <View style={{ flex: 1 }}>
                                                                        <Text style={{ fontSize: 16, fontWeight: '700', color: currentColors.text }}>
                                                                            {contact.displayName || contact.username}
                                                                        </Text>
                                                                        {/* Alt metin */}
                                                                        <Text numberOfLines={1} style={{ fontSize: 13, color: taskUnread > 0 ? COLORS.primary : currentColors.subText, fontWeight: taskUnread > 0 ? '600' : '400' }}>
                                                                            {taskUnread > 0 ? `📋 ${taskUnread} görev yorumu` : `@${contact.username}`}
                                                                        </Text>
                                                                    </View>

                                                                    {/* OK İKONU */}
                                                                    <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', padding: 8, borderRadius: 12 }}>
                                                                        {isExpanded ? <ChevronUp size={18} color={currentColors.subText} /> : <ChevronDown size={18} color={currentColors.subText} />}
                                                                    </View>
                                                                </TouchableOpacity>

                                                                {/* 2. GENİŞLEYEN DETAY ALANI (TouchableOpacity'nin DIŞINDA olmalı) */}
                                                                {isExpanded && (
                                                                    <View style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', padding: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#f1f5f9' }}>

                                                                        {/* İzin Ayarı */}
                                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>
                                                                            <View style={{ flex: 1, marginRight: 10 }}>
                                                                                <Text style={{ fontWeight: '700', color: currentColors.text, fontSize: 14 }}>
                                                                                    {t('task_assign_permission')}
                                                                                </Text>
                                                                                <Text style={{ fontSize: 11, color: currentColors.subText, marginTop: 2 }}>
                                                                                    {t('c_sendtask')}
                                                                                </Text>
                                                                            </View>
                                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                                <Text style={{ fontSize: 12, fontWeight: '700', color: contact.canAssignToMe ? COLORS.success : currentColors.subText }}>
                                                                                    {contact.canAssignToMe ? t('open_label') : t('closed_label')}
                                                                                </Text>
                                                                                <Switch
                                                                                    value={contact.canAssignToMe}
                                                                                    onValueChange={() => togglePermission(contact)}
                                                                                    trackColor={{ false: "#cbd5e1", true: "#10b981" }}
                                                                                    thumbColor={"#fff"}
                                                                                />
                                                                            </View>
                                                                        </View>

                                                                        {/* Aksiyon Butonları */}
                                                                        <View style={{ gap: 10 }}>
                                                                            <TouchableOpacity
                                                                                onPress={() => showTasksAssignedToFriend(contact.uid, contact.username)}
                                                                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: COLORS.primary + '15' }}
                                                                            >
                                                                                <ListTodo size={18} color={COLORS.primary} />
                                                                                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>
                                                                                    {t('my_assigned_tasks')}
                                                                                </Text>
                                                                            </TouchableOpacity>

                                                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                                                <TouchableOpacity onPress={() => handleRemoveFriend(contact.uid, contact.username)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: '#fee2e2' }}>
                                                                                    <UserMinus size={18} color={COLORS.danger} />
                                                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.danger }}>{t('remove_friend')}</Text>
                                                                                </TouchableOpacity>

                                                                                <TouchableOpacity onPress={() => handleBlockFriend(contact.uid, contact.username)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: isDark ? '#334155' : '#e2e8f0' }}>
                                                                                    <XCircle size={18} color={currentColors.subText} />
                                                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: currentColors.subText }}>{t('block')}</Text>
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                        </View>

                                                                    </View>
                                                                )}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </ScrollView>
                                {!user.isAnonymous && (
                                <KeyboardAvoidingView
                                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                                    keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
                                    style={{
                                        position: 'absolute',
                                        bottom: 20,
                                        width: '100%',
                                        alignItems: 'center',
                                        zIndex: 999,
                                    }}
                                >
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        width: '90%',
                                        height: 50,
                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                        borderRadius: 25,
                                        paddingHorizontal: 15,
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 10,
                                        elevation: 5,
                                        borderWidth: 1,
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                    }}>
                                        <User size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                                        <TextInput
                                            value={searchFriends}
                                            onChangeText={setSearchFriends}
                                            placeholder={t('friends')} // Burası farklı (Arkadaş Ara)
                                            placeholderTextColor={currentColors.subText}
                                            style={{ flex: 1, color: currentColors.text, fontSize: 15, height: '100%' }}
                                        />
                                        {searchFriends.length > 0 && (
                                            <TouchableOpacity onPress={() => setSearchFriends('')} style={{ padding: 5 }}>
                                                <X size={18} color={currentColors.subText} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </KeyboardAvoidingView>
                            )}
                            </View>

                            {/* --- SAYFA 4: PROFİL (PROFILE) --- */}
                            <View key="4" style={{ flex: 1, width: '100%' }}>
                                <ScrollView
                                    contentContainerStyle={{
                                        paddingHorizontal: 20,
                                        paddingBottom: 120,
                                        width: '100%',
                                        maxWidth: 600, // Web'de içeriğin çok yayılmasını engeller
                                        alignSelf: 'center', // Web'de içeriği ortalar
                                        paddingTop: 10
                                    }}
                                    showsVerticalScrollIndicator={false}
                                >

                                    {/* --- 1. PROFİL KARTI (FOTOĞRAF & İSİM) --- */}
                                    <View style={[styles.card, { backgroundColor: currentColors.surface, alignItems: 'center', paddingVertical: 25, marginBottom: 15, borderRadius: 24 }]}>

                                        {/* Fotoğraf Alanı */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (user.isAnonymous || user.isGuest) {
                                                    showToast(t('warning_title'), t('guest_edit_warning') || t('guest_cannot_change_photo'), 'warning');
                                                    return;
                                                }
                                                pickImage();
                                            }}
                                            activeOpacity={0.8}
                                            style={{ position: 'relative', marginBottom: 15 }}
                                        >
                                            <View style={{
                                                width: 110, height: 110, borderRadius: 55,
                                                backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
                                                borderWidth: 4, borderColor: currentColors.bg, // Fotoğrafın etrafına temiz bir çerçeve
                                                shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
                                            }}>
                                                {user.photoURL ? (
                                                    <Image source={{ uri: user.photoURL }} style={{ width: '100%', height: '100%', borderRadius: 55 }} />
                                                ) : (
                                                    <User size={50} color="#fff" />
                                                )}
                                            </View>

                                            {/* Düzenleme İkonu (Sağ Alt) */}
                                            {!(user.isAnonymous || user.isGuest) && (
                                                <View style={{
                                                    position: 'absolute', bottom: 0, right: 0,
                                                    backgroundColor: currentColors.surface, borderRadius: 20, padding: 6,
                                                    borderWidth: 1, borderColor: '#e2e8f0', shadowColor: "#000", shadowOpacity: 0.1, elevation: 2
                                                }}>
                                                    <Edit2 size={14} color={COLORS.primary} />
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        {/* İsim ve Kullanıcı Adı */}
                                        <View style={{ alignItems: 'center', gap: 4 }}>
                                            <Text style={{ fontSize: 24, fontWeight: '800', color: currentColors.text, textAlign: 'center' }}>
                                                {user.displayName || user.username || t('no_name')}
                                            </Text>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (user.isAnonymous || user.isGuest) return;
                                                    setEditUsernameInput(user.username || "");
                                                    setEditDisplayNameInput(user.displayName || "");
                                                    setIsEditProfileVisible(true);
                                                }}
                                                activeOpacity={(user.isAnonymous || user.isGuest) ? 1 : 0.6}
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                                            >
                                                <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '600' }}>@{user.username}</Text>
                                                {!(user.isAnonymous || user.isGuest) && <Edit2 size={10} color={COLORS.primary} style={{ opacity: 0.7 }} />}
                                            </TouchableOpacity>

                                            {(user.isAnonymous || user.isGuest) && (
                                                <View style={{ marginTop: 8, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' }}>
                                                    <Text style={{ fontSize: 11, color: '#c2410c', fontWeight: 'bold' }}>{t('guest_acc')}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* --- 2. AYARLAR KARTI --- */}
                                    <View style={[styles.card, { backgroundColor: currentColors.surface, padding: 0, borderRadius: 24, marginBottom: 15 }]}>
                                        <View style={{ padding: 20, paddingBottom: 10 }}>
                                            <Text style={[styles.cardTitle, { color: currentColors.text, fontSize: 18, marginBottom: 15 }]}>{t('settings')}</Text>

                                            {/* Kategoriler */}
                                            <TouchableOpacity onPress={() => setIsCategoryModalOpen(true)} style={[styles.settingBtn, { marginBottom: 12, justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderWidth: 0 }]}>
                                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                                    <View style={{ padding: 8, borderRadius: 10, backgroundColor: COLORS.primary + '15' }}><Layers size={20} color={COLORS.primary} /></View>
                                                    <Text style={{ color: currentColors.text, fontSize: 15, fontWeight: '500' }}>{t('edit_categories')}</Text>
                                                </View>
                                                <ChevronRight size={18} color={currentColors.subText} />
                                            </TouchableOpacity>

                                            {/* Dil Seçimi */}
                                            <TouchableOpacity onPress={() => setIsLangModalOpen(true)} style={[styles.settingBtn, { marginBottom: 12, justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderWidth: 0 }]}>
                                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                                    <View style={{ padding: 8, borderRadius: 10, backgroundColor: COLORS.primary + '15' }}><Globe size={20} color={COLORS.primary} /></View>
                                                    <Text style={{ color: currentColors.text, fontSize: 15, fontWeight: '500' }}>{t('language')}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                    <Text style={{ fontSize: 22 }}>{LANGUAGES.find(l => l.code === lang)?.flag}</Text>
                                                    <ChevronRight size={18} color={currentColors.subText} />
                                                </View>
                                            </TouchableOpacity>

                                            {/* Şifre İşlemleri */}
                                            <TouchableOpacity onPress={() => setIsPasswordModalOpen(true)} style={[styles.settingBtn, { marginBottom: 12, justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderWidth: 0 }]}>
                                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                                    <View style={{ padding: 8, borderRadius: 10, backgroundColor: COLORS.primary + '15' }}><Lock size={20} color={COLORS.primary} /></View>
                                                    <View>
                                                        <Text style={{ color: currentColors.text, fontSize: 15, fontWeight: '500' }}>
                                                            {user.providerData.some((p: any) => p.providerId === 'password') ? t('change_password') : t('create_password')}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <ChevronRight size={18} color={currentColors.subText} />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Görünüm (Theme) */}
                                        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                                            <Text style={{ fontSize: 12, color: currentColors.subText, fontWeight: '700', marginBottom: 10, marginLeft: 4 }}>{t('appearance')?.toUpperCase() || 'GÖRÜNÜM'}</Text>
                                            <View style={{ flexDirection: 'row', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', padding: 4, borderRadius: 14 }}>
                                                {['light', 'dark', 'system'].map((mode) => {
                                                    const isActive = theme === mode;
                                                    const icon = mode === 'light' ? <Sun size={16} color={isActive ? COLORS.primary : currentColors.subText} /> :
                                                        mode === 'dark' ? <Moon size={16} color={isActive ? COLORS.primary : currentColors.subText} /> :
                                                            <Monitor size={16} color={isActive ? COLORS.primary : currentColors.subText} />;
                                                    const labelKey = `theme_${mode}`;

                                                    return (
                                                        <TouchableOpacity
                                                            key={mode}
                                                            onPress={() => setTheme(mode as ThemeMode)}
                                                            style={{
                                                                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                paddingVertical: 10, borderRadius: 10,
                                                                backgroundColor: isActive ? currentColors.surface : 'transparent',
                                                                shadowColor: "#000", shadowOpacity: isActive ? 0.1 : 0, shadowRadius: 2, elevation: isActive ? 1 : 0
                                                            }}
                                                        >
                                                            {icon}
                                                            <Text style={{ fontSize: 12, fontWeight: isActive ? 'bold' : '500', color: isActive ? COLORS.primary : currentColors.subText }}>
                                                                {t(labelKey)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>

                                        {/* Gizlilik Linki */}
                                        <TouchableOpacity onPress={() => { setIsSettingsOpen(false); router.push(`/${lang}/privacy`); }} style={{ borderTopWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', padding: 15 }}>
                                            <Text style={{ color: currentColors.subText, textAlign: 'center', fontSize: 12, fontWeight: '500' }}>{t('privacy_terms')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* --- 3. PREMIUM VE ÜYELİK DURUMU ALANI --- */}
                                    <View style={{ marginBottom: 25 }}>
                                        {!isPremium ? (
                                            /* DURUM 1: KULLANICI PREMIUM DEĞİL */
                                            user.isGuest ? (
                                                /* A. MİSAFİR UYARISI KARTI (Sarı) */
                                                <View style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d', borderWidth: 1, padding: 20, borderRadius: 24 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                        <View style={{ backgroundColor: '#fff7ed', padding: 8, borderRadius: 10 }}>
                                                            <AlertCircle size={24} color="#d97706" />
                                                        </View>
                                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#9a3412' }}>{t('guest_acc')}</Text>
                                                    </View>
                                                    <Text style={{ color: '#9a3412', marginBottom: 15, fontSize: 13, lineHeight: 20 }}>{t('guest_now')}</Text>
                                                    <TouchableOpacity
                                                        onPress={() => setIsGuestModalOpen(true)}
                                                        activeOpacity={0.8}
                                                        style={{ backgroundColor: '#d97706', padding: 14, borderRadius: 14, alignItems: 'center', shadowColor: "#d97706", shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 }}
                                                    >
                                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{t('save_register')}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                /* B. PREMIUM SATIN ALMA KARTI (Ana Renk) */
                                                <TouchableOpacity
                                                    activeOpacity={0.9}
                                                    onPress={() => router.push('/paywall')}
                                                    style={{
                                                        backgroundColor: COLORS.primary, // Ana tema rengin
                                                        borderRadius: 24,
                                                        padding: 20,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        // Modern Gölge Efekti
                                                        shadowColor: COLORS.primary,
                                                        shadowOffset: { width: 0, height: 8 },
                                                        shadowOpacity: 0.4,
                                                        shadowRadius: 12,
                                                        elevation: 10,
                                                        borderWidth: 1,
                                                        borderColor: 'rgba(255,255,255,0.2)'
                                                    }}
                                                >
                                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                            <Trophy size={16} color="#fbbf24" fill="#fbbf24" />
                                                            <Text style={{ color: '#fbbf24', fontWeight: '800', fontSize: 11, letterSpacing: 1.5 }}>{t('premium_label')}</Text>
                                                        </View>
                                                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{t('premium_cta')}</Text>
                                                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' }}>{t('premium_price')}</Text>
                                                    </View>

                                                    <View style={{
                                                        width: 44, height: 44, borderRadius: 22,
                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                        alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <ChevronRight size={24} color="#fff" />
                                                    </View>
                                                </TouchableOpacity>
                                            )
                                        ) : (
                                            /* DURUM 2: KULLANICI ZATEN PREMIUM (Yeşil Bilgi Kartı) */
                                            <View style={{
                                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                                                borderColor: '#10b981',
                                                borderWidth: 1,
                                                borderRadius: 24,
                                                padding: 20,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 15
                                            }}>
                                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Check size={24} color="#fff" strokeWidth={3} />
                                                </View>
                                                <View>
                                                    <Text style={{ color: currentColors.text, fontWeight: 'bold', fontSize: 16 }}>{t('uyesiniz')}</Text>
                                                    <Text style={{ color: currentColors.subText, fontSize: 12, marginTop: 2 }}>{t('all_active')}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {/* --- 4. ÇIKIŞ & SİLME --- */}
                                    <View style={{ gap: 12 }}>
                                        <TouchableOpacity onPress={handleLogout} style={[styles.card, { backgroundColor: currentColors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 20, marginBottom: 0 }]}>
                                            <LogOut size={20} color={COLORS.danger} />
                                            <Text style={{ color: COLORS.danger, fontWeight: 'bold', fontSize: 16 }}>{t('logout')}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={handleDeleteAccount} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, opacity: 0.7 }}>
                                            <Text style={{ color: currentColors.subText, fontWeight: '500', fontSize: 13 }}>{t('delete_account')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                </ScrollView>
                            </View>
                        </PagerView>
                    </View>
                )}

                {/* ================================================================================= */}
                {/* 4. REKLAM (Sabit) */}
                {/* ================================================================================= */}
                {!isSettingsOpen && (<OmmioAdBanner isPremium={isPremium} />)}

                {/* ================================================================================= */}
                {/* 5. BOTTOM TABS */}
                {/* ================================================================================= */}
                {!isSettingsOpen && (
                    <View style={[styles.tabBar, { backgroundColor: currentColors.surface, borderTopColor: isDark ? '#334155' : '#e2e8f0' }]}>
                        {[
                            { key: 'list', Icon: ListTodo, label: t('tasks_tab') },
                            { key: 'habits', Icon: Repeat, label: t('habits_tab') },
                            { key: 'messages', Icon: MessageCircle, label: t('messages_tab') }, // Normal Chat Buraya
                            { key: 'social', Icon: Users, label: t('social_tab') }, // Task Chat Buraya
                            { key: 'profile', Icon: User, label: t('profile_tab') },
                        ].map((item) => {
                            const isActive = activeTab === item.key;
                            const iconColor = isActive ? COLORS.primary : currentColors.subText;

                            // --- HESAPLAMA MANTIĞI ---
                            let badgeCount = 0;

                            // Eğer SOSYAL sekmesiyse -> SADECE GÖREV YORUMLARINI Say
                            if (item.key === 'social') {
                                badgeCount = Object.values(taskUnreadCounts).reduce((acc: number, curr: any) => acc + (curr || 0), 0);
                            }

                            // Eğer MESAJLAR sekmesiyse -> Normal Chatleri Say (İstersen bunu kaldırabilirsin)
                            if (item.key === 'messages') {
                                badgeCount = Object.values(chatPreviews).reduce((acc: number, curr: any) => acc + (curr.unread || 0), 0);
                            }
                            // -------------------------

                            return (
                                <TouchableOpacity key={item.key} onPress={() => onBottomTabPress(item.key)} style={styles.tabItem}>
                                    <View style={{ opacity: isActive ? 1 : 0.5, alignItems: 'center' }}>
                                        <View>
                                            <item.Icon size={24} color={iconColor} />

                                            {/* KIRMIZI KUTUCUK (TaskChatButton'daki mantığın aynısı) */}
                                            {badgeCount > 0 && (
                                                <View style={{
                                                    position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16,
                                                    borderRadius: 8, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center',
                                                    borderWidth: 1.5, borderColor: currentColors.surface, zIndex: 999
                                                }}>
                                                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{badgeCount}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.tabLabel, { color: iconColor }]}>{item.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ================================================================================= */}
                {/* 6. FLOATING ACTION BUTTONS & TASK INPUT BAR */}
                {/* ================================================================================= */}

                {/* A. ALIŞKANLIK EKLEME BUTONU (Sadece Habits Sekmesi) */}
                {!isSettingsOpen && activeTab === 'habits' && (
                    <View style={[styles.fabContainer, { bottom: !isPremium ? 175 : 105 }]}>
                        <TouchableOpacity
                            onPress={() => { setAddMode('habit'); setIsAddModalOpen(true); }}
                            style={styles.fabButton}
                            activeOpacity={0.8}
                        >
                            <Plus size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* B. GÖREV EKLEME BARI (Sadece List Sekmesi) */}
                {!isSettingsOpen && activeTab === 'list' && (
                    <>
                        {/* Dışarı Tıklama Alanı (Overlay) */}
                        {isInputExpanded && (
                            <TouchableWithoutFeedback
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setIsInputExpanded(false);
                                    Keyboard.dismiss();
                                }}
                            >
                                <View style={styles.overlay} />
                            </TouchableWithoutFeedback>
                        )}

                        {/* Blur Input Bar */}
                        <BlurView
                            intensity={Platform.OS === 'ios' ? 80 : 100}
                            tint={isDark ? 'dark' : 'light'}
                            style={[
                                styles.blurInputContainer,
                                {
                                    bottom: !isPremium ? 185 : 120,
                                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.65)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                                }
                            ]}
                        >
                            {/* 1. GENİŞLETİLMİŞ SEÇENEKLER */}
                            {isInputExpanded && (
                                <View style={styles.expandedContent}>

                                    {/* 1. BÖLÜM: ÇOKLU ATAMA (Multi-Assign) */}
                                    <Text style={styles.sectionTitle}>{t('assign_to')} {assignTargets.length > 0 && `(${assignTargets.length})`}</Text>

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
                                        {/* Seçenek: Ben (Varsayılan) */}
                                        <TouchableOpacity
                                            onPress={() => setAssignTargets([])} // Listeyi temizle = Sadece Ben
                                            style={[
                                                styles.assignChip,
                                                assignTargets.length === 0
                                                    ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                                                    : { backgroundColor: isDark ? '#334155' : '#fff', borderColor: isDark ? '#475569' : '#e2e8f0' }
                                            ]}
                                        >
                                            <View style={[styles.avatarSmall, { backgroundColor: assignTargets.length === 0 ? 'rgba(255,255,255,0.2)' : (isDark ? '#475569' : '#f1f5f9') }]}>
                                                {user.photoURL ? <Image source={{ uri: user.photoURL }} style={styles.avatarImage} /> : <User size={16} color={currentColors.subText} />}
                                            </View>
                                            <Text style={[styles.chipText, { color: assignTargets.length === 0 ? '#fff' : currentColors.text }]}>{t('me')}</Text>
                                        </TouchableOpacity>

                                        {/* Kişiler */}
                                        {contacts.map(contact => {
                                            const isSelected = assignTargets.some(t => t.uid === contact.uid);
                                            return (
                                                <TouchableOpacity
                                                    key={contact.uid}
                                                    onPress={() => {
                                                        if (isSelected) {
                                                            // Varsa çıkar
                                                            setAssignTargets(prev => prev.filter(t => t.uid !== contact.uid));
                                                        } else {
                                                            // Yoksa ekle
                                                            setAssignTargets(prev => [...prev, contact]);
                                                        }
                                                    }}
                                                    style={[
                                                        styles.assignChip,
                                                        isSelected
                                                            ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                                                            : { backgroundColor: isDark ? '#334155' : '#fff', borderColor: isDark ? '#475569' : '#e2e8f0' }
                                                    ]}
                                                >
                                                    <View style={[styles.avatarSmall]}>
                                                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{contact.username[0].toUpperCase()}</Text>
                                                    </View>
                                                    <Text style={[styles.chipText, { color: isSelected ? '#fff' : currentColors.text }]}>
                                                        {contact.displayName || contact.username}
                                                    </Text>
                                                    {isSelected && <CheckCircle2 size={14} color="#fff" style={{ marginLeft: 6 }} />}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {/* 2. BÖLÜM: ÖNCELİK (Priority) & DOSYA */}
                                    <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                                        {/* Öncelik Seçimi */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.sectionTitle}>{t('priority')}</Text>
                                            <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 12, padding: 4 }}>
                                                {['low', 'medium', 'high'].map((p) => {
                                                    const isSelected = priority === p;
                                                    let color = '#10b981'; // Low (Green)
                                                    if (p === 'medium') color = '#f59e0b'; // Medium (Orange)
                                                    if (p === 'high') color = '#ef4444'; // High (Red)

                                                    return (
                                                        <TouchableOpacity
                                                            key={p}
                                                            onPress={() => setPriority(p as any)}
                                                            style={{
                                                                flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8,
                                                                backgroundColor: isSelected ? color : 'transparent'
                                                            }}
                                                        >
                                                            <Flag size={16} color={isSelected ? '#fff' : color} fill={isSelected ? '#fff' : 'none'} />
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>

                                        {/* Dosya Ekleme */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.sectionTitle}>{t('ekler')} ({attachments.length})</Text>
                                            <TouchableOpacity
                                                onPress={pickDocument}
                                                style={{
                                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 12, paddingVertical: 8, height: 40,
                                                    borderWidth: 1, borderColor: attachments.length > 0 ? COLORS.primary : 'transparent'
                                                }}
                                            >
                                                <Paperclip size={18} color={attachments.length > 0 ? COLORS.primary : currentColors.subText} />
                                                <Text style={{ fontSize: 12, fontWeight: '600', color: attachments.length > 0 ? COLORS.primary : currentColors.subText }}>
                                                {attachments.length > 0
                                                    ? tFormat('files_count', { count: attachments.length })
                                                    : t('add_file')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Bölüm: Açıklama */}
                                    <View style={{ marginBottom: 10 }}>
                                        <Text style={styles.sectionTitle}>{t('description')}</Text>
                                        <TextInput
                                            value={inputDesc}
                                            onChangeText={setInputDesc}
                                            placeholder="..."
                                            placeholderTextColor={currentColors.subText}
                                            style={[styles.smallInput, { backgroundColor: currentColors.bg, color: currentColors.text }]}
                                            onSubmitEditing={addTask}
                                        />
                                    </View>

                                    {/* Bölüm: Tarihler (Görsel Olarak Düzeltilmiş) */}
                                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                                    
                                    {/* 1. Başlangıç Tarihi */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ 
                                            fontSize: 12, 
                                            fontWeight: 'bold', 
                                            color: currentColors.subText, 
                                            marginBottom: 6, 
                                            textTransform: 'uppercase' 
                                        }}>
                                            {t('start_date')}
                                        </Text>
                                        
                                        <View style={{ 
                                            flexDirection: 'row', 
                                            alignItems: 'center', 
                                            backgroundColor: isDark ? '#1e293b' : '#f8fafc', // Input arka planı
                                            borderRadius: 12, 
                                            borderWidth: 1, 
                                            borderColor: isDark ? '#334155' : '#e2e8f0',
                                            overflow: 'hidden',
                                            height: 48 // Sabit yükseklik ile hizalama garantisi
                                        }}>
                                            <TextInput
                                                value={inputStartDate}
                                                onChangeText={handleInputStartDateChange}
                                                placeholder="GG-AA-YYYY"
                                                placeholderTextColor={currentColors.subText}
                                                maxLength={10}
                                                keyboardType="numeric"
                                                style={{ 
                                                    flex: 1, 
                                                    color: currentColors.text, 
                                                    paddingHorizontal: 12,
                                                    fontSize: 14,
                                                    height: '100%' 
                                                }}
                                                onSubmitEditing={addTask} // Klavyeden "Git" deyince ekle
                                            />
                                            <TouchableOpacity 
                                                onPress={() => openDatePicker('start')} 
                                                style={{ 
                                                    paddingHorizontal: 12, 
                                                    height: '100%', 
                                                    justifyContent: 'center',
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0', // İkon arkası hafif farklı ton
                                                    borderLeftWidth: 1,
                                                    borderLeftColor: isDark ? '#334155' : '#cbd5e1'
                                                }}
                                            >
                                                <CalendarIcon size={18} color={COLORS.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* 2. Bitiş Tarihi */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ 
                                            fontSize: 12, 
                                            fontWeight: 'bold', 
                                            color: currentColors.subText, 
                                            marginBottom: 6, 
                                            textTransform: 'uppercase' 
                                        }}>
                                            {t('due_date')}
                                        </Text>
                                        
                                        <View style={{ 
                                            flexDirection: 'row', 
                                            alignItems: 'center', 
                                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                            borderRadius: 12, 
                                            borderWidth: 1, 
                                            borderColor: isDark ? '#334155' : '#e2e8f0',
                                            overflow: 'hidden',
                                            height: 48
                                        }}>
                                            <TextInput
                                                value={inputDueDate}
                                                onChangeText={handleInputDueDateChange}
                                                placeholder="GG-AA-YYYY"
                                                placeholderTextColor={currentColors.subText}
                                                maxLength={10}
                                                keyboardType="numeric"
                                                style={{ 
                                                    flex: 1, 
                                                    color: currentColors.text, 
                                                    paddingHorizontal: 12,
                                                    fontSize: 14,
                                                    height: '100%'
                                                }}
                                                onSubmitEditing={addTask}
                                            />
                                            <TouchableOpacity 
                                                onPress={() => openDatePicker('due')} 
                                                style={{ 
                                                    paddingHorizontal: 12, 
                                                    height: '100%', 
                                                    justifyContent: 'center',
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                                                    borderLeftWidth: 1,
                                                    borderLeftColor: isDark ? '#334155' : '#cbd5e1'
                                                }}
                                            >
                                                <CalendarIcon size={18} color={COLORS.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                </View>

                                    {/* Bölüm: Kategoriler veya Uyarı */}
                                    <View style={[styles.divider, { borderColor: isDark ? '#334155' : '#f1f5f9' }]}>
                                        {!assignTarget ? (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                                {categories.map(cat => {
                                                    const cc = CATEGORY_COLORS.find(c => c.id === cat.color) || CATEGORY_COLORS[0];
                                                    const isSelected = selectedCategory.id === cat.id;
                                                    return (
                                                        <TouchableOpacity
                                                            key={cat.id}
                                                            onPress={() => setSelectedCategory(cat)}
                                                            style={[
                                                                styles.categoryPill,
                                                                {
                                                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                                                    backgroundColor: isSelected ? cc.hex : (isDark ? '#334155' : '#fff')
                                                                },
                                                                isSelected && { borderColor: 'transparent' }
                                                            ]}
                                                        >
                                                            <View style={[styles.dot, { backgroundColor: cc.hex }]} />
                                                            <Text style={[styles.categoryText, { color: currentColors.text }]}>{cat.name}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                        ) : (
                                            <Text style={{ fontSize: 11, color: COLORS.warning, fontStyle: 'italic' }}>
                                                {tFormat("task_assign_info", { name: assignTarget.username })}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Bölüm: Alt Butonlar (Alarm, Bildirim, Recurring) */}
                                    <View style={styles.bottomActions}>
                                        <View style={{ flexDirection: 'row', gap: 5 }}>
                                            <TouchableOpacity
                                                onPress={() => setIsNotifOn(!isNotifOn)}
                                                style={[styles.iconToggle, isNotifOn && styles.iconToggleActiveBlue]}
                                            >
                                                <Bell size={16} color={isNotifOn ? '#3b82f6' : currentColors.subText} />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => setIsAlarmOn(!isAlarmOn)}
                                                style={[styles.iconToggle, isAlarmOn && styles.iconToggleActiveRed]}
                                            >
                                                <AlarmClock size={16} color={isAlarmOn ? '#ef4444' : currentColors.subText} />
                                            </TouchableOpacity>

                                            {inputDueDate && (
                                                <TouchableOpacity
                                                    onPress={() => setIsEveryDayOn(!isEveryDayOn)}
                                                    style={[styles.iconToggle, isEveryDayOn && styles.iconToggleActiveGreen, { width: 'auto', paddingHorizontal: 8, gap: 5 }]}
                                                >
                                                    <CalendarDays size={16} color={isEveryDayOn ? '#10b981' : currentColors.subText} />
                                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: isEveryDayOn ? '#10b981' : currentColors.subText }}>
                                                        {t('every_day')}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View style={{ flexDirection: 'row', gap: 5 }}>
                                            {isNotifOn && (
                                                <TextInput
                                                    value={notifInput}
                                                    onChangeText={handleNotifInputChange}
                                                    placeholder="09:00"
                                                    placeholderTextColor="#94a3b8"
                                                    style={[styles.timeInput, { color: COLORS.primary, borderColor: COLORS.primary }]}
                                                    maxLength={5}
                                                    onSubmitEditing={addTask}
                                                />
                                            )}
                                            {isAlarmOn && (
                                                <TextInput
                                                    value={alarmInput}
                                                    onChangeText={handleAlarmInputChange}
                                                    placeholder="07:00"
                                                    placeholderTextColor="#94a3b8"
                                                    style={[styles.timeInput, { color: COLORS.danger, borderColor: COLORS.danger }]}
                                                    maxLength={5}
                                                    onSubmitEditing={addTask}
                                                />
                                            )}
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* 2. ANA INPUT SATIRI */}
                            <View style={styles.mainInputRow}>
                                <TouchableOpacity
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setIsInputExpanded(!isInputExpanded);
                                    }}
                                    style={styles.expandBtn}
                                >
                                    {isInputExpanded ? <X size={20} color={currentColors.subText} /> : <Sliders size={20} color={currentColors.subText} />}
                                </TouchableOpacity>

                                <TextInput
                                    value={inputValue}
                                    onChangeText={setInputValue}
                                    placeholder={t('addTask')}
                                    placeholderTextColor={currentColors.subText}
                                    style={[styles.mainTextInput, { color: currentColors.text }]}
                                    onSubmitEditing={addTask}
                                />

                                <TouchableOpacity
                                    onPress={addTask}
                                    style={[
                                        styles.sendBtn,
                                        {
                                            backgroundColor: inputValue.trim() ? (assignTarget ? COLORS.warning : COLORS.primary) : (isDark ? '#334155' : '#e2e8f0')
                                        }
                                    ]}
                                >
                                    <Plus size={24} color={inputValue.trim() ? '#fff' : '#94a3b8'} />
                                </TouchableOpacity>
                            </View>

                        </BlurView>
                    </>
                )}
                {/* ================================================================================= */}
                {/* 7. TOAST BİLDİRİMLER */}
                {/* ================================================================================= */}
                {customToast.visible && (() => {
                    // Toast Tiplerine Göre Ayarlar (Renkler ve İkonlar)
                    const TOAST_CONFIG = {
                        success: { bg: '#ecfdf5', border: '#10b981', iconBg: '#10b981', Icon: Check },
                        error: { bg: '#fef2f2', border: '#ef4444', iconBg: '#ef4444', Icon: X },
                        warning: { bg: '#fffbeb', border: '#f59e0b', iconBg: '#f59e0b', Icon: AlertCircle },
                        info: { bg: '#f0f9ff', border: '#0ea5e9', iconBg: '#0ea5e9', Icon: Bell },
                    };

                    // Geçerli ayarı seç (yoksa varsayılan olarak info kullan)
                    const currentToast = TOAST_CONFIG[customToast.type] || TOAST_CONFIG.info;
                    const ToastIcon = currentToast.Icon;

                    return (
                        <View style={[styles.toastContainer, { backgroundColor: currentToast.bg, borderColor: currentToast.border }]}>

                            {/* Sol İkon */}
                            <View style={[styles.toastIconBox, { backgroundColor: currentToast.iconBg }]}>
                                <ToastIcon size={20} color="#fff" strokeWidth={2.5} />
                            </View>

                            {/* Metin İçeriği */}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toastTitle}>{customToast.title}</Text>
                                <Text style={styles.toastMessage} numberOfLines={2}>{customToast.message}</Text>
                            </View>

                            {/* Kapat Butonu */}
                            <TouchableOpacity
                                onPress={() => setCustomToast({ ...customToast, visible: false })}
                                style={styles.toastCloseBtn}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Tıklama alanını genişletir
                            >
                                <X size={18} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    );
                })()}

                {/* ================================================================================= */}
                {/* 8. MODALLAR (Modernize Edilmiş) */}
                {/* ================================================================================= */}

                {/* A. ALIŞKANLIK EKLEME MODALI */}
                <Modal visible={isAddModalOpen} transparent animationType="slide" statusBarTranslucent>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { setIsAddModalOpen(false); Keyboard.dismiss(); }}>
                            <View style={styles.modalBackdrop} />
                        </TouchableWithoutFeedback>

                        <View style={styles.bottomSheetCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('new_habit')}</Text>
                                <TouchableOpacity onPress={() => setIsAddModalOpen(false)} style={styles.closeBtn}>
                                    <X size={24} color={currentColors.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formGap}>
                                {/* İsim */}
                                <TextInput
                                    placeholder={t('habit_name')}
                                    placeholderTextColor={currentColors.subText}
                                    value={newHabitTitle}
                                    onChangeText={setNewHabitTitle}
                                    style={styles.inputField}
                                />

                                {/* Sıklık (Haftalık/Günlük) */}
                                <View style={styles.freqRow}>
                                    {(['daily', 'weekly'] as const).map((freq) => (
                                        <TouchableOpacity
                                            key={freq}
                                            onPress={() => setNewHabitFreq(freq)}
                                            style={[styles.freqPill, newHabitFreq === freq && styles.freqPillActive]}
                                        >
                                            <Text style={[styles.freqText, newHabitFreq === freq && styles.freqTextActive]}>
                                                {t('freq')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Gün Seçimi (Sadece Weekly ise) */}
                                {newHabitFreq === 'weekly' && (
                                    <View style={styles.daysWrapper}>
                                        <Text style={styles.sectionLabel}>{t('which_days')}</Text>
                                        <View style={styles.daysContainer}>
                                            {getDaysOfWeek(lang).map((dayObj) => {
                                                const isSelected = newHabitDays.includes(dayObj.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={dayObj.id}
                                                        onPress={() => toggleHabitDay(dayObj.id)}
                                                        style={[styles.dayCircle, isSelected && styles.dayCircleActive]}
                                                    >
                                                        <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                                                            {dayObj.label.substring(0, 2)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* Bildirim Saati */}
                                <View>
                                    <Text style={styles.sectionLabel}>{t('time_placeholder')}</Text>
                                    <TextInput
                                        placeholder="09:00"
                                        placeholderTextColor={currentColors.subText}
                                        value={habitNotifInput}
                                        onChangeText={(t) => setHabitNotifInput(maskTimeInput(t))}
                                        style={styles.inputField}
                                        maxLength={5}
                                        keyboardType="numeric"
                                    />
                                </View>

                                {/* Kategori Seçimi */}
                                <View>
                                    <Text style={styles.sectionLabel}>{t('category')}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                        {categories.map(c => (
                                            <TouchableOpacity
                                                key={c.id}
                                                onPress={() => setSelectedCategory(c)}
                                                style={[
                                                    styles.categoryTag,
                                                    selectedCategory.id === c.id && { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary }
                                                ]}
                                            >
                                                <Text style={{ color: selectedCategory.id === c.id ? '#fff' : currentColors.text, fontSize: 12, fontWeight: '600' }}>
                                                    {c.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                <TouchableOpacity onPress={addHabit} style={styles.primaryButton}>
                                    <Text style={styles.primaryButtonText}>{t('start_habit')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* B. MİSAFİR DÖNÜŞÜM MODALI */}
                <Modal visible={isGuestModalOpen} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.centerModalOverlay}>
                            <View style={styles.centerCard}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{t('create_ac')}</Text>
                                    <TouchableOpacity onPress={() => setIsGuestModalOpen(false)}><X size={24} color={currentColors.subText} /></TouchableOpacity>
                                </View>
                                <Text style={styles.modalSubtitle}>{t('protect_data_msg')}</Text>

                                <View style={styles.formGap}>
                                    <View style={styles.iconInputRow}>
                                        <User size={20} color={currentColors.subText} />
                                        <TextInput value={username} onChangeText={setUsername} placeholder={t('social_search_tab_username')} placeholderTextColor={currentColors.subText} style={styles.flexInput} autoCapitalize='none' />
                                    </View>
                                    <View style={styles.iconInputRow}>
                                        <Mail size={20} color={currentColors.subText} />
                                        <TextInput value={email} onChangeText={setEmail} placeholder={t('email')} placeholderTextColor={currentColors.subText} style={styles.flexInput} autoCapitalize='none' keyboardType="email-address" />
                                    </View>
                                    <View style={styles.iconInputRow}>
                                        <Lock size={20} color={currentColors.subText} />
                                        <TextInput value={password} onChangeText={setPassword} placeholder={t('auth_password_placeholder')} placeholderTextColor={currentColors.subText} style={styles.flexInput} secureTextEntry />
                                    </View>

                                    <TouchableOpacity onPress={handleConvertGuest} style={styles.primaryButton}>
                                        {isAuthLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('complete_profile')}</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* C. TARİH SEÇİCİLER (Date Pickers) */}
                {/* 1. Genel Date Picker */}
                {showDatePicker && (
                    Platform.OS === 'android' ? (
                        <DateTimePicker 
                            value={selectedDate || new Date()} 
                            mode="date" 
                            display="default" 
                            onChange={onDateChange} 
                        />
                    ) : (
                        <Modal transparent visible={true} animationType="fade">
                            <TouchableOpacity 
                                activeOpacity={1} 
                                onPress={() => setShowDatePicker(false)} 
                                style={styles.centerModalOverlay}
                            >
                                <View style={[
                                    styles.centerCard, 
                                    { 
                                        width: '90%', // Sabit 340 yerine %90 genişlik
                                        maxWidth: 380, // Çok geniş ekranlarda yayılmasın
                                        padding: 0, 
                                        overflow: 'hidden',
                                        backgroundColor: currentColors.surface // Arka plan rengini garantiye al
                                    }
                                ]}>
                                    {/* Modal Header */}
                                    <View style={{ 
                                        padding: 16, 
                                        borderBottomWidth: 1, 
                                        borderColor: isDark ? '#334155' : '#f1f5f9', 
                                        flexDirection: 'row', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc' // Hafif header tonu
                                    }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: currentColors.text }}>
                                            {t('select_date')}
                                        </Text>
                                        <TouchableOpacity 
                                            onPress={() => setShowDatePicker(false)}
                                            style={{ padding: 4 }}
                                        >
                                            <X size={22} color={currentColors.subText} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Takvim Gövdesi */}
                                    <View style={{ paddingVertical: 10 }}>
                                        <Calendar
                                            current={getISODate(selectedDate)}
                                            key={`${lang}-${isDark ? 'dark' : 'light'}`} // Tema değişince render'ı zorla
                                            onDayPress={(day: any) => {
                                                const newDate = new Date(day.timestamp);
                                                // Saat dilimi kaymasını düzelt
                                                newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                                                onDateChange(null, newDate);
                                            }}
                                            theme={{
                                                backgroundColor: currentColors.surface,
                                                calendarBackground: currentColors.surface, // Transparent yerine solid renk
                                                textSectionTitleColor: currentColors.subText,
                                                selectedDayBackgroundColor: COLORS.primary,
                                                selectedDayTextColor: '#ffffff',
                                                todayTextColor: COLORS.primary,
                                                dayTextColor: currentColors.text,
                                                textDisabledColor: isDark ? '#475569' : '#d9e1e8',
                                                dotColor: COLORS.primary,
                                                selectedDotColor: '#ffffff',
                                                arrowColor: COLORS.primary,
                                                disabledArrowColor: '#d9e1e8',
                                                monthTextColor: currentColors.text,
                                                indicatorColor: COLORS.primary,
                                                textDayFontWeight: '600',
                                                textMonthFontWeight: 'bold',
                                                textDayHeaderFontWeight: '600',
                                                textDayFontSize: 15,
                                                textMonthFontSize: 16,
                                                textDayHeaderFontSize: 13
                                            }}
                                            markingType={'custom'}
                                            markedDates={calendarMarks}
                                            enableSwipeMonths={true} // Kaydırma özelliği
                                        />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    )
                )}

                {/* 2. iOS Detail & Habit Date Pickers (Inline Wrapper) */}
                {(showDetailDatePicker || (showHabitDatePicker && Platform.OS === 'ios')) && Platform.OS === 'ios' && (
                    <Modal transparent visible={true} animationType="slide">
                        <View style={styles.modalOverlay}>
                            <TouchableOpacity style={styles.modalBackdrop} onPress={() => { setShowDetailDatePicker(false); setShowHabitDatePicker(false); }} />
                            <View style={styles.bottomSheetCard}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={() => { setShowDetailDatePicker(false); setShowHabitDatePicker(false); }}>
                                        <Text style={{ color: COLORS.danger, fontSize: 16 }}>{t('cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setShowDetailDatePicker(false); setShowHabitDatePicker(false); }}>
                                        <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>{t('ok_btn')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={new Date()}
                                    mode="date"
                                    display="inline"
                                    onChange={showDetailDatePicker ? onDetailDateChange : onHabitDateChange}
                                    style={{ height: 320 }}
                                />
                            </View>
                        </View>
                    </Modal>
                )}
                {/* Android Habit Picker */}
                {showHabitDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker value={new Date()} mode="date" display="default" onChange={onHabitDateChange} />
                )}

                {/* D. GÖREV DETAY MODALI - GÜNCELLENMİŞ VERSİYON */}
                <Modal visible={!!selectedTask} animationType="slide" presentationStyle="pageSheet">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: currentColors.bg }}>
                        <View style={{ flex: 1, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>

                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {/* Başlık Dinamik: Chat ise "Yorumlar", Detay ise "Detaylar" yazar */}
                                    {taskModalTab === 'chat' ? t('messaging_title') : t('task_detail_title')}
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedTask(null)}>
                                    <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>{t('close_btn')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Segmented Control (Tabs) */}
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity
                                    onPress={() => setTaskModalTab('chat')}
                                    style={[styles.segmentBtn, taskModalTab === 'chat' && styles.segmentBtnActive, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                                >
                                    <Text style={{ fontWeight: '600', color: taskModalTab === 'chat' ? currentColors.text : currentColors.subText }}>
                                        {t('messaging_title')}
                                    </Text>

                                    {/* Eğer okunmamış mesaj varsa kırmızı nokta koy */}
                                    {hasUnreadInSelectedTask && (
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger }} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Content */}
                            <View style={{ flex: 1, marginTop: 15 }}>
                                {taskModalTab === 'details' ? (
                                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                                        {/* ... (Detaylar kısmı aynı kalsın, burayı değiştirmene gerek yok) ... */}
                                        <View>
                                            <Text style={styles.sectionLabel}>{t('title_label')}</Text>
                                            <TextInput value={detailText} onChangeText={setDetailText} multiline style={[styles.inputField, { height: 'auto', minHeight: 60, paddingTop: 12 }]} />
                                        </View>
                                        <View>
                                            <Text style={styles.sectionLabel}>{t('description_label')}</Text>
                                            <TextInput value={detailDesc} onChangeText={setDetailDesc} multiline numberOfLines={4} placeholder={t('add_note_placeholder')} placeholderTextColor={currentColors.subText} style={[styles.inputField, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]} />
                                        </View>
                                        {selectedTask?.attachments && selectedTask.attachments.length > 0 && (
                                            <View>
                                                <Text style={styles.sectionLabel}>{t('atch')}</Text>
                                                <View style={{ gap: 8 }}>
                                                    {selectedTask.attachments.map((file: any, index: number) => (
                                                        <TouchableOpacity
                                                            key={index}
                                                            onPress={() => {
                                                                // WebBrowser ile aç (PDF, Resim vb. görüntülenir)
                                                                if (file.url) WebBrowser.openBrowserAsync(file.url);
                                                            }}
                                                            style={{
                                                                flexDirection: 'row', alignItems: 'center',
                                                                backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                                                padding: 12, borderRadius: 12, gap: 10
                                                            }}
                                                        >
                                                            <View style={{ backgroundColor: '#fff', padding: 6, borderRadius: 8 }}>
                                                                <FileText size={20} color={COLORS.primary} />
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text numberOfLines={1} style={{ color: currentColors.text, fontWeight: '600' }}>{file.name}</Text>
                                                                <Text style={{ fontSize: 10, color: currentColors.subText }}>{t('doc_pic')}</Text>
                                                            </View>
                                                            <Download size={20} color={currentColors.subText} />
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                        <View>
                                            <Text style={styles.sectionLabel}>{t('due_date_label')}</Text>
                                            <View style={{ flexDirection: 'row' }}>
                                                <TextInput value={detailDueDate} onChangeText={handleDetailDueDateChange} placeholder="dd-mm-yyyy" placeholderTextColor={currentColors.subText} maxLength={10} keyboardType="numeric" style={[styles.inputField, { borderTopRightRadius: 0, borderBottomRightRadius: 0, flex: 1 }]} />
                                                <TouchableOpacity onPress={() => openDatePicker('detail')} style={styles.inputAppendBtn}>
                                                    <CalendarIcon size={22} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <TouchableOpacity onPress={saveTaskDetail} style={styles.primaryButton}>
                                            <Text style={styles.primaryButtonText}>{t('save')}</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                ) : (
                                    /* --- YENİ MODERN GÖREV SOHBET TASARIMI --- */
                                    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderRadius: 20, overflow: 'hidden' }}>
                                        <FlatList
                                            data={taskComments}
                                            keyExtractor={item => item.id}
                                            contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                                            showsVerticalScrollIndicator={false}
                                            renderItem={({ item }) => {
                                                const isMe = item.senderId === user.uid;
                                                return (
                                                    <View style={{
                                                        flexDirection: 'row',
                                                        marginBottom: 15,
                                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                        alignItems: 'flex-end'
                                                    }}>
                                                        {/* Karşı Tarafın Avatarı */}
                                                        {!isMe && (
                                                            <View style={{
                                                                width: 32, height: 32, borderRadius: 16,
                                                                backgroundColor: COLORS.secondary, marginRight: 8,
                                                                alignItems: 'center', justifyContent: 'center',
                                                                borderWidth: 1, borderColor: currentColors.bg
                                                            }}>
                                                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>{item.senderName?.[0]?.toUpperCase()}</Text>
                                                            </View>
                                                        )}

                                                        {/* Mesaj Baloncuğu */}
                                                        <View style={{ maxWidth: '75%' }}>
                                                            {/* İsim (Sadece karşı tarafsa ve grup mantığı varsa, ama burada şık durur) */}
                                                            {!isMe && <Text style={{ fontSize: 10, color: currentColors.subText, marginLeft: 4, marginBottom: 2 }}>{item.senderName}</Text>}

                                                            <View style={{
                                                                backgroundColor: isMe ? COLORS.primary : (isDark ? '#334155' : '#fff'),
                                                                paddingVertical: 10, paddingHorizontal: 14,
                                                                borderRadius: 18,
                                                                borderBottomLeftRadius: isMe ? 18 : 4,
                                                                borderBottomRightRadius: isMe ? 4 : 18,
                                                                shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
                                                            }}>
                                                                <Text style={{ color: isMe ? '#fff' : currentColors.text, fontSize: 15, lineHeight: 20 }}>{item.text}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                );
                                            }}
                                            ListEmptyComponent={
                                                <View style={{ alignItems: 'center', justifyContent: 'center', height: 200, opacity: 0.6 }}>
                                                    <View style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0', padding: 20, borderRadius: 50, marginBottom: 15 }}>
                                                        <MessageCircle size={40} color={currentColors.subText} />
                                                    </View>
                                                    <Text style={{ color: currentColors.text, fontWeight: '600' }}>{t('no_comments_yet')}</Text>
                                                    <Text style={{ color: currentColors.subText, fontSize: 12 }}>{t('tsk_note')}</Text>
                                                </View>
                                            }
                                        />

                                        {/* Mesaj Yazma Alanı */}
                                        <View style={{
                                            padding: 10,
                                            backgroundColor: currentColors.surface,
                                            borderTopWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
                                            flexDirection: 'row', alignItems: 'center', gap: 10
                                        }}>
                                            <TextInput
                                                value={taskCommentInput}
                                                onChangeText={setTaskCommentInput}
                                                placeholder={t('add_comment_placeholder')}
                                                placeholderTextColor={currentColors.subText}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                    borderRadius: 24,
                                                    paddingHorizontal: 16,
                                                    height: 44, // Biraz daha yüksek
                                                    color: currentColors.text,
                                                    borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0'
                                                }}
                                            />
                                            <TouchableOpacity
                                                onPress={sendTaskComment}
                                                disabled={!taskCommentInput.trim()}
                                                style={{
                                                    width: 44, height: 44, borderRadius: 22,
                                                    backgroundColor: taskCommentInput.trim() ? COLORS.primary : (isDark ? '#334155' : '#e2e8f0'),
                                                    alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Send size={20} color={taskCommentInput.trim() ? '#fff' : '#94a3b8'} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* E. KATEGORİ MODALI */}
                <Modal visible={isCategoryModalOpen} transparent animationType="fade">
                    <TouchableOpacity activeOpacity={1} onPress={() => { setIsCategoryModalOpen(false); Keyboard.dismiss(); }} style={styles.centerModalOverlay}>
                        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: '100%', alignItems: 'center' }}>
                            <TouchableWithoutFeedback>
                                <View style={[styles.centerCard, { height: '80%', maxHeight: 600 }]}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>{t('categories_title')}</Text>
                                        <TouchableOpacity onPress={() => setIsCategoryModalOpen(false)}><X size={24} color={currentColors.subText} /></TouchableOpacity>
                                    </View>

                                    <ScrollView style={{ flex: 1, marginBottom: 15 }} showsVerticalScrollIndicator={false}>
                                        {categories.map((cat) => (
                                            <View key={cat.id} style={styles.categoryListItem}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={[styles.colorDot, { backgroundColor: CATEGORY_COLORS.find(c => c.id === cat.color)?.hex || 'gray' }]} />
                                                    <Text style={{ fontSize: 16, fontWeight: '600', color: currentColors.text }}>{cat.name}</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)} style={styles.deleteIconBtn}>
                                                    <Trash2 size={18} color={COLORS.danger} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>

                                    <View style={{ paddingTop: 15, borderTopWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9' }}>
                                        <Text style={styles.sectionLabel}>{t('create_new_category')}</Text>
                                        <TextInput value={newCategoryName} onChangeText={setNewCategoryName} placeholder={t('category_name_placeholder')} placeholderTextColor={currentColors.subText} style={[styles.inputField, { marginBottom: 15 }]} />

                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 15 }}>
                                            {CATEGORY_PALETTE.map(colorName => {
                                                const colorHex = CATEGORY_COLORS.find(c => c.id === colorName)?.hex || '#000';
                                                const isSelected = newCategoryColor === colorName;
                                                return (
                                                    <TouchableOpacity key={colorName} onPress={() => setNewCategoryColor(colorName)} style={[styles.colorCircle, { backgroundColor: colorHex }, isSelected && styles.colorCircleSelected]}>
                                                        {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                                                    </TouchableOpacity>
                                                )
                                            })}
                                        </ScrollView>

                                        <TouchableOpacity onPress={handleAddCategory} disabled={!newCategoryName.trim()} style={[styles.primaryButton, !newCategoryName.trim() && { backgroundColor: '#94a3b8' }]}>
                                            <Plus size={20} color="#fff" strokeWidth={3} />
                                            <Text style={styles.primaryButtonText}>{t('create_new_category')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </KeyboardAvoidingView>
                    </TouchableOpacity>
                </Modal>
                {/* --- H. ARKADAŞ EKLEME (NETWORK) MODALI --- */}
                <Modal visible={isNetworkModalOpen} animationType="slide" presentationStyle="pageSheet">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: currentColors.bg }}>
                        <View style={{ flex: 1, padding: 20 }}>

                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('connections')}</Text>
                                <TouchableOpacity onPress={() => setIsNetworkModalOpen(false)}>
                                    <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>{t('close_btn')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Sekmeler (Kullanıcı Adı ile Ara / Rehberden Bul) */}
                            <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 12, padding: 4 }}>
                                <TouchableOpacity
                                    onPress={() => setNetworkTab('ommio')}
                                    style={{ flex: 1, padding: 8, alignItems: 'center', borderRadius: 10, backgroundColor: networkTab === 'ommio' ? (isDark ? '#1e293b' : '#fff') : 'transparent', shadowColor: networkTab === 'ommio' ? "#000" : "transparent", shadowOpacity: 0.1, elevation: networkTab === 'ommio' ? 2 : 0 }}
                                >
                                    <Text style={{ fontWeight: 'bold', color: networkTab === 'ommio' ? currentColors.text : currentColors.subText }}>
                                        {t('auth_username_placeholder')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => { setNetworkTab('contacts'); fetchDeviceContacts(); }}
                                    style={{ flex: 1, padding: 8, alignItems: 'center', borderRadius: 10, backgroundColor: networkTab === 'contacts' ? (isDark ? '#1e293b' : '#fff') : 'transparent', shadowColor: networkTab === 'contacts' ? "#000" : "transparent", shadowOpacity: 0.1, elevation: networkTab === 'contacts' ? 2 : 0 }}
                                >
                                    <Text style={{ fontWeight: 'bold', color: networkTab === 'contacts' ? currentColors.text : currentColors.subText }}>
                                        {t('find_from_contacts')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* --- SEKME 1: KULLANICI ADI İLE ARA --- */}
                            {networkTab === 'ommio' ? (
                                <View style={{ gap: 20 }}>
                                    <Text style={{ color: currentColors.subText, fontSize: 14 }}>
                                        {t('add_friend_prompt')}
                                    </Text>

                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <View style={[styles.authInputRow, { flex: 1, marginBottom: 0, height: 50 }]}>
                                            <User size={20} color={currentColors.subText} />
                                            <TextInput
                                                value={searchUsername}
                                                onChangeText={setSearchUsername}
                                                placeholder={t('search_username')}
                                                placeholderTextColor={currentColors.subText}
                                                style={[styles.authInput, { color: currentColors.text }]}
                                                autoCapitalize='none'
                                            />
                                        </View>

                                        <TouchableOpacity
                                            onPress={sendFriendRequest}
                                            style={{ backgroundColor: COLORS.primary, width: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <UserPlus size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Bilgilendirme */}
                                    <View style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primary }}>
                                        <Text style={{ color: currentColors.text, fontSize: 13 }}>
                                            {t('usr_exctly')}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                /* --- SEKME 2: REHBER (CONTACTS) --- */
                                <FlatList
                                    data={deviceContacts}
                                    keyExtractor={item => item.id}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    renderItem={({ item }) => (
                                        <View style={{ backgroundColor: currentColors.surface, padding: 15, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9' }}>
                                            <View>
                                                <Text style={{ color: currentColors.text, fontWeight: 'bold' }}>{item.name}</Text>
                                                <Text style={{ color: currentColors.subText, fontSize: 12 }}>{item.phoneNumber}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => inviteContact(item.phoneNumber)} style={{ backgroundColor: isDark ? '#334155' : '#eff6ff', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                <Send size={14} color={COLORS.primary} />
                                                <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: 'bold' }}>{t('social_invite_btn')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={{ textAlign: 'center', color: currentColors.subText, marginTop: 40 }}>
                                            {t('contacts_loading_or_denied')}
                                        </Text>
                                    }
                                />
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* F. PREMIUM & UPSELL & ADS */}
                <Modal visible={isAdVisible} transparent animationType="fade">
                    <View style={styles.fullScreenOverlay}>
                        <View style={styles.adCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
                                <Text style={styles.adBadge}>{t('ad_label_full')}</Text>
                            </View>
                            <View style={styles.adContentPlaceholder}>
                                <Text style={{ color: '#666' }}>Google Ads Component</Text>
                            </View>
                            <TouchableOpacity disabled={adCountdown > 0} onPress={() => { setIsAdVisible(false); setIsUpsellVisible(true); }} style={styles.adCloseBtn}>
                                <Text style={{ color: '#000', fontWeight: 'bold' }}>{adCountdown > 0 ? `${t('ad_skip')} ${adCountdown}` : `${t('ad_close')} ✕`}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal visible={isUpsellVisible} transparent animationType="slide">
                    <View style={styles.centerModalOverlay}>
                        <View style={styles.centerCard}>
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <View style={styles.upsellIconCircle}><Trophy size={40} color="#d97706" fill="#d97706" /></View>
                                <Text style={styles.upsellTitle}>{t('premium_unlock')}</Text>
                                <Text style={styles.upsellSubtitle}>{t('premium_subtitle')}</Text>
                            </View>

                            <View style={{ gap: 12, marginBottom: 25 }}>
                                {[t('premium_feat_ads'), t('premium_feat_habits'), t('premium_feat_stats'), t('premium_feat_themes')].map((feat, i) => (
                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={styles.checkCircleSmall}><Check size={12} color="#fff" strokeWidth={3} /></View>
                                        <Text style={{ color: currentColors.text, fontSize: 14 }}>{feat}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity onPress={async () => { if (user) { await setDoc(doc(db, "users", user.uid), { isPremium: true }, { merge: true }); setIsUpsellVisible(false); } }} style={styles.primaryButton}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.primaryButtonText}>{t('premium_cta')}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>{t('premium_price')}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsUpsellVisible(false)} style={{ padding: 15, alignItems: 'center' }}>
                                <Text style={{ color: currentColors.subText, fontSize: 13, fontWeight: '600' }}>{t('keep_ads')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* G. DİĞER KÜÇÜK MODALLAR (Onboarding, Language, Confirm vb.) */}
                {/* ONBOARDING */}
                <Modal visible={showOnboarding} animationType="fade">
                    <View style={styles.onboardingContainer}>
                        <View style={{ alignItems: 'center', gap: 20, paddingHorizontal: 20 }}>
                            <View style={styles.onboardingIconCircle}>
                                {onboardingStep === 0 ? <ListTodo size={60} color="#fff" /> : (onboardingStep === 1 ? <Repeat size={60} color="#fff" /> : <Users size={60} color="#fff" />)}
                            </View>
                            <Text style={styles.onboardingTitle}>
                                {onboardingStep === 0 ? t('welcome') : (onboardingStep === 1 ? t('onboard_step2_title') : t('onboard_step3_title'))}
                            </Text>
                            <Text style={styles.onboardingDesc}>
                                {onboardingStep === 0 ? t('onboard_step1_desc') : (onboardingStep === 1 ? t('onboard_step2_desc') : t('onboard_step3_desc'))}
                            </Text>
                        </View>
                        <View style={styles.onboardingFooter}>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                {[0, 1, 2].map(i => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === onboardingStep ? '#fff' : 'rgba(255,255,255,0.3)' }} />)}
                            </View>
                            <TouchableOpacity onPress={async () => { if (onboardingStep < 2) { setOnboardingStep(onboardingStep + 1); } else { setShowOnboarding(false); if (user) await updateDoc(doc(db, "users", user.uid), { hasSeenOnboarding: true }); } }} style={styles.onboardingBtn}>
                                <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>{onboardingStep === 2 ? t('start_btn') : t('next_btn')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                {/* --- H. ŞİFRE SIFIRLAMA MODALI (GÜNCELLENDİ) --- */}
                <Modal visible={isPasswordModalOpen} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={() => setIsPasswordModalOpen(false)}>
                        <View style={styles.centerModalOverlay}>
                            <View style={styles.centerCard}>

                                {/* Header */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {t('change_password')}
                                    </Text>
                                    <TouchableOpacity onPress={() => setIsPasswordModalOpen(false)}>
                                        <X size={24} color={currentColors.subText} />
                                    </TouchableOpacity>
                                </View>

                                {/* Bilgilendirme Metni */}
                                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                                        <Mail size={30} color="#0284c7" />
                                    </View>
                                    <Text style={{ textAlign: 'center', color: currentColors.text, fontSize: 16, fontWeight: '600', marginBottom: 5 }}>
                                        {t('snd_maill')}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold' }}>{user?.email}</Text>
                                        <Text>
                                        {tFormat('reset_password_info', { email: user?.email || '' })}
                                        </Text>
                                </View>

                                {/* Gönder Butonu */}
                                <View style={styles.formGap}>
                                    <TouchableOpacity onPress={handlePasswordChange} style={styles.primaryButton}>
                                        {isAuthLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.primaryButtonText}>{t('snd_cnc')}</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => setIsPasswordModalOpen(false)} style={{ padding: 10, alignItems: 'center' }}>
                                        <Text style={{ color: currentColors.subText }}>{t('cancel_btn')}</Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* --- I. DİL SEÇİMİ (LANGUAGE) MODALI --- */}
                <Modal visible={isLangModalOpen} transparent animationType="fade">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setIsLangModalOpen(false)}
                        style={styles.centerModalOverlay}
                    >
                        <View style={[styles.centerCard, { padding: 0, overflow: 'hidden', maxHeight: 500 }]}>
                            <View style={{ padding: 20, borderBottomWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.modalTitle}>{t('select_language')}</Text>
                                <TouchableOpacity onPress={() => setIsLangModalOpen(false)}>
                                    <X size={24} color={currentColors.subText} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={{ padding: 10 }}>
                                {LANGUAGES.map((item) => {
                                    const isSelected = lang === item.code;
                                    return (
                                        <TouchableOpacity
                                            key={item.code}
                                            onPress={() => {
                                                setLang(item.code as LangCode);
                                                setIsLangModalOpen(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 15,
                                                borderRadius: 12,
                                                backgroundColor: isSelected ? (isDark ? '#334155' : '#eff6ff') : 'transparent',
                                                marginBottom: 5
                                            }}
                                        >
                                            <Text style={{ fontSize: 24, marginRight: 15 }}>{item.flag}</Text>
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: isSelected ? 'bold' : '500',
                                                color: isSelected ? COLORS.primary : currentColors.text,
                                                flex: 1
                                            }}>
                                                {item.label}
                                            </Text>
                                            {isSelected && <Check size={20} color={COLORS.primary} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
                {/* --- J. ARKADAŞA ATANAN GÖREVLER LİSTESİ MODALI --- */}
                <Modal visible={friendTasksModal.visible} transparent animationType="slide">
                    <View style={styles.centerModalOverlay}>
                        <View style={[styles.centerCard, { height: '70%', padding: 0, overflow: 'hidden' }]}>

                            {/* Başlık */}
                            <View style={{ padding: 20, borderBottomWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={styles.modalTitle}>{friendTasksModal.friendName}</Text>
                                    <Text style={{ fontSize: 12, color: currentColors.subText }}>{t('my_assigned_tasks')}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setFriendTasksModal({ visible: false, tasks: [], friendName: '' })}>
                                    <X size={24} color={currentColors.subText} />
                                </TouchableOpacity>
                            </View>

                            {/* Liste */}
                            <FlatList
                                data={friendTasksModal.tasks}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                                ListEmptyComponent={
                                    <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.6 }}>
                                        <ListTodo size={40} color={currentColors.subText} />
                                        <Text style={{ marginTop: 10, color: currentColors.subText }}>{t('geen_tsk')}</Text>
                                    </View>
                                }
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            // 1. Tıklanan görevi seçili hale getir
                                            setSelectedTask(item);
                                            // 2. Bu modalı kapat
                                            setFriendTasksModal({ ...friendTasksModal, visible: false });
                                            // 3. Sohbet sekmesini aktif et (Task Detay Modalı içinde)
                                            setTaskModalTab('chat');
                                        }}
                                        style={{
                                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                            padding: 12, borderRadius: 12, marginBottom: 10,
                                            borderLeftWidth: 4, borderLeftColor: item.completed ? COLORS.success : COLORS.warning
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Text style={{ flex: 1, color: currentColors.text, fontWeight: '600', fontSize: 15, textDecorationLine: item.completed ? 'line-through' : 'none' }}>
                                                {item.text}
                                            </Text>
                                            {/* Mesaj İkonu ve Bildirim Baloncuğu */}
                                            <View style={{ marginLeft: 5 }}>
                                                {/* Burada TaskChatButton'ı kullanamayız çünkü onPress'i farklı, 
      o yüzden manuel bir kontrol ekliyoruz veya TaskChatButton'ı modifiye ediyoruz. 
      En kolayı TaskChatButton'ı buraya da koymak ama onPress'i override etmek. */}
                                                <TaskChatButton
                                                    task={item}
                                                    user={user}
                                                    onPress={() => {
                                                        setSelectedTask(item);
                                                        setFriendTasksModal({ ...friendTasksModal, visible: false });
                                                        setTaskModalTab('chat');
                                                    }}
                                                />
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                                <CalendarIcon size={12} color={currentColors.subText} />
                                                <Text style={{ fontSize: 12, color: currentColors.subText }}>{item.date}</Text>
                                            </View>

                                            <View style={{
                                                backgroundColor: item.completed ? '#dcfce7' : '#fef3c7',
                                                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6
                                            }}>
                                                <Text style={{
                                                    fontSize: 10, fontWeight: 'bold',
                                                    color: item.completed ? '#166534' : '#b45309'
                                                }}>
                                                    {item.completed ? t('completed') : t('pending') || "Bekliyor"}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

                {/* --- K. TÜM GÖREVLER (AJANDA) MODALI --- */}
                <Modal visible={isAllTasksModalOpen} animationType="slide" presentationStyle="pageSheet">
                    <View style={{ flex: 1, backgroundColor: currentColors.bg }}>

                        {/* Header */}
                        <View style={{ padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: currentColors.text }}>{t('agenda') || "Tüm Planlar"}</Text>
                                <Text style={{ fontSize: 12, color: currentColors.subText }}>{t('tsk_soon')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsAllTasksModalOpen(false)} style={{ padding: 5 }}>
                                <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>{t('close_btn')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* --- YENİ ARAMA ÇUBUĞU (YAKLAŞAN GÖREVLER) --- */}
                        <View style={[styles.inputField, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginHorizontal: 20, marginBottom: 15 }]}>
                            <ListTodo size={20} color={currentColors.subText} style={{ marginRight: 10 }} />
                            <TextInput
                                value={searchTasks}
                                onChangeText={setSearchTasks}
                                placeholder={t('search_tasks')}
                                placeholderTextColor={currentColors.subText}
                                style={{ flex: 1, color: currentColors.text, fontSize: 15, height: '100%' }}
                            />
                            {searchTasks.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchTasks('')} style={{ padding: 5 }}>
                                    <X size={18} color={currentColors.subText} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Liste */}
                        <FlatList
                            data={tasks
                                .filter(t => !t.completed)
                                .filter(t => t.text.toLowerCase().includes(searchTasks.toLowerCase())) // <--- BURASI GÜNCELLENDİ
                                .sort((a, b) => a.date.localeCompare(b.date))
                            }
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', marginTop: 100, opacity: 0.6 }}>
                                    <CalendarDays size={50} color={currentColors.subText} />
                                    <Text style={{ marginTop: 15, color: currentColors.subText, fontSize: 16 }}>{t('no_plan_tsk')}</Text>
                                </View>
                            }
                            renderItem={({ item }) => {
                                // Kategori rengini bul
                                const cat = categories.find(c => c.id === item.categoryId);
                                const catColor = CATEGORY_COLORS.find(c => c.id === cat?.color)?.hex || COLORS.primary;

                                // Tarihi güzelleştir (Opsiyonel: Bugün/Yarın yazdırılabilir ama basitçe tarihi yazıyoruz)
                                const dateParts = item.date.split('-'); // YYYY-MM-DD varsayıyoruz
                                const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`; // DD.MM.YYYY çevrimi

                                return (
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: currentColors.surface,
                                        padding: 16,
                                        marginBottom: 12,
                                        borderRadius: 16,
                                        borderLeftWidth: 4,
                                        borderLeftColor: catColor,
                                        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
                                    }}>
                                        {/* Tarih Kutusu (Sol) */}
                                        <View style={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            paddingRight: 15,
                                            borderRightWidth: 1,
                                            borderRightColor: isDark ? '#334155' : '#f1f5f9',
                                            marginRight: 15,
                                            width: 60
                                        }}>
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: currentColors.text }}>{dateParts[2]}</Text>
                                            <Text style={{ fontSize: 12, color: currentColors.subText }}>{dateParts[1]}/{dateParts[0]}</Text>
                                        </View>

                                        {/* İçerik (Orta) */}
                                        <View style={{ flex: 1 }}>
                                            <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: '600', color: currentColors.text, marginBottom: 4 }}>
                                                {item.text}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: catColor }} />
                                                    <Text style={{ fontSize: 12, color: currentColors.subText }}>{cat?.name || "Genel"}</Text>
                                                </View>
                                                {item.dueDate && (
                                                    <Text style={{ fontSize: 10, color: COLORS.danger, fontWeight: 'bold' }}>
                                                    {tFormat('due_label', { date: item.dueDate })}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        {/* Git Butonu (Sağ) */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setIsAllTasksModalOpen(false); // Modalı kapat
                                                // Takvimi o tarihe götür
                                                const targetDate = new Date(item.date);
                                                setSelectedDate(targetDate);
                                            }}
                                        >
                                            <ChevronRight size={20} color={currentColors.subText} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                        />
                    </View>
                </Modal>

                {/* --- L. ALIŞKANLIK ANALİZ MODALI --- */}
                <Modal visible={isHabitStatsModalOpen} animationType="slide" presentationStyle="pageSheet">
                    <View style={{ flex: 1, backgroundColor: currentColors.bg }}>

                        {/* Header */}
                        <View style={{ padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: currentColors.text }}>{t('analysis')}</Text>
                                <Text style={{ fontSize: 12, color: currentColors.subText }}>{t('prfm_hbt')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsHabitStatsModalOpen(false)} style={{ padding: 5 }}>
                                <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>{t('close_btn')}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>

                            {/* 1. HESAPLAMA MANTIĞI (Render içinde yapıyoruz ki güncel olsun) */}
                            {(() => {
                                // A. Toplam Tamamlanma Sayısına Göre Sırala
                                const sortedHabits = [...habits].sort((a, b) => b.completedDates.length - a.completedDates.length);
                                const bestHabit = sortedHabits.length > 0 ? sortedHabits[0] : null;
                                const worstHabit = sortedHabits.length > 0 ? sortedHabits[sortedHabits.length - 1] : null;

                                // B. Son 7 Günlük Aktiviteyi Hesapla
                                const last7Days = [];
                                const today = new Date();
                                let maxActivity = 0; // Grafik ölçeği için

                                for (let i = 6; i >= 0; i--) {
                                    const d = new Date();
                                    d.setDate(today.getDate() - i);
                                    const isoDate = getISODate(d);

                                    // O gün tamamlanan toplam alışkanlık sayısı
                                    const count = habits.reduce((acc, h) => acc + (h.completedDates.includes(isoDate) ? 1 : 0), 0);
                                    if (count > maxActivity) maxActivity = count;

                                    last7Days.push({
                                        label: getDaysOfWeek(lang)[d.getDay() === 0 ? 6 : d.getDay() - 1].label[0], // P, S, Ç gibi tek harf
                                        count: count,
                                        fullDate: isoDate
                                    });
                                }

                                return (
                                    <View style={{ gap: 20 }}>

                                        {/* --- 2. GRAFİK (SON 7 GÜN) --- */}
                                        <View style={{ backgroundColor: currentColors.surface, padding: 20, borderRadius: 24, shadowColor: "#000", shadowOpacity: 0.05, elevation: 3 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                                <View style={{ padding: 8, backgroundColor: '#eff6ff', borderRadius: 10 }}>
                                                    <TrendingUp size={20} color="#3b82f6" />
                                                </View>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: currentColors.text }}>{t('last_svn')}</Text>
                                            </View>

                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 }}>
                                                {last7Days.map((day, index) => {
                                                    // Bar yüksekliği (Max 100%)
                                                    const heightPct = maxActivity > 0 ? (day.count / maxActivity) * 100 : 0;
                                                    const isToday = index === 6;

                                                    return (
                                                        <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                                                            {/* Bar Sayısı (Üstte) */}
                                                            <Text style={{ fontSize: 10, color: currentColors.subText, marginBottom: 5 }}>{day.count > 0 ? day.count : ''}</Text>

                                                            {/* Bar Çubuğu */}
                                                            <View style={{
                                                                width: 12,
                                                                height: `${heightPct || 5}%`, // En az %5 görünsün 
                                                                backgroundColor: isToday ? COLORS.primary : (day.count > 0 ? '#cbd5e1' : '#f1f5f9'),
                                                                borderRadius: 6,
                                                                minHeight: 12
                                                            }} />

                                                            {/* Gün Harfi */}
                                                            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: isToday ? 'bold' : '500', color: isToday ? COLORS.primary : currentColors.subText }}>
                                                                {day.label}
                                                            </Text>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </View>

                                        {/* --- 3. ŞAMPİYON ALIŞKANLIK --- */}
                                        {bestHabit && bestHabit.completedDates.length > 0 && (
                                            <View style={{ backgroundColor: '#f0fdf4', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#bbf7d0' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={{ padding: 10, backgroundColor: '#dcfce7', borderRadius: 12 }}>
                                                        <Award size={24} color="#16a34a" />
                                                    </View>
                                                    <View>
                                                        <Text style={{ fontSize: 13, color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('istikrar')}</Text>
                                                        <Text style={{ fontSize: 18, color: '#14532d', fontWeight: '900' }}>{bestHabit.title}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#16a34a' }}>{bestHabit.completedDates.length}</Text>
                                                    <Text style={{ fontSize: 14, color: '#15803d', fontWeight: '500', marginBottom: 5 }}>{t('times_done')}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {/* --- 4. GELİŞTİRİLMESİ GEREKEN --- */}
                                        {worstHabit && worstHabit.id !== bestHabit?.id && (
                                            <View style={{ backgroundColor: '#fff7ed', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#ffedd5' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={{ padding: 10, backgroundColor: '#ffedd5', borderRadius: 12 }}>
                                                        <AlertTriangle size={24} color="#ea580c" />
                                                    </View>
                                                    <View>
                                                        <Text style={{ fontSize: 13, color: '#c2410c', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('bekli')}</Text>
                                                        <Text style={{ fontSize: 18, color: '#7c2d12', fontWeight: '900' }}>{worstHabit.title}</Text>
                                                    </View>
                                                </View>
                                                <Text style={{ marginTop: 10, color: '#9a3412', fontSize: 14 }}>
                                                    {t('sml_tsk')}
                                                </Text>
                                            </View>
                                        )}

                                        {/* --- 5. DETAYLI LİSTE --- */}
                                        <View>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: currentColors.text, marginBottom: 10 }}>{t('detail_sira')}</Text>
                                            {sortedHabits.map((habit, index) => (
                                                <View key={habit.id} style={{
                                                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: 15, backgroundColor: currentColors.surface, marginBottom: 8, borderRadius: 16
                                                }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                        <Text style={{ fontSize: 14, color: currentColors.subText, fontWeight: 'bold', width: 20 }}>#{index + 1}</Text>
                                                        <Text style={{ fontSize: 15, color: currentColors.text, fontWeight: '600' }}>{habit.title.startsWith('habit_') ? t(habit.title) : habit.title}</Text>
                                                    </View>
                                                    <View style={{ backgroundColor: index === 0 ? '#dcfce7' : (isDark ? '#334155' : '#f1f5f9'), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                                        <Text style={{ fontWeight: 'bold', color: index === 0 ? '#166534' : currentColors.text, fontSize: 12 }}>
                                                            {habit.completedDates.length} <Text style={{ fontSize: 10 }}>{t('kez')}</Text>
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>

                                    </View>
                                );
                            })()}
                        </ScrollView>
                    </View>
                </Modal>

                {/* --- M. GRUP OLUŞTURMA MODALI --- */}
                <Modal visible={isGroupModalOpen} animationType="slide" presentationStyle="pageSheet">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: currentColors.bg }}>
                        <View style={{ flex: 1, padding: 20 }}>

                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('new_ghbt')}</Text>
                                <TouchableOpacity onPress={() => setIsGroupModalOpen(false)}>
                                    <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>{t('cancel')}</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={{ gap: 20 }}>

                                {/* İsim */}
                                <View>
                                    <Text style={styles.sectionLabel}>{t('gname')}</Text>
                                    <TextInput
                                        value={newGroupTitle}
                                        onChangeText={setNewGroupTitle}
                                        placeholder={t('example_hbbt')}
                                        placeholderTextColor={currentColors.subText}
                                        style={styles.inputField}
                                    />
                                </View>

                                {/* Arkadaş Seçimi */}
                                <View>
                                    <Text style={styles.sectionLabel}>{t('feat_social_link')}</Text>
                                    {contacts.length === 0 ? (
                                        <Text style={{ color: currentColors.subText, fontStyle: 'italic' }}>{t('add_none_f')}</Text>
                                    ) : (
                                        <View style={{ gap: 10 }}>
                                            {contacts.map(contact => {
                                                const isSelected = selectedGroupMembers.includes(contact.uid);
                                                return (
                                                    <TouchableOpacity
                                                        key={contact.uid}
                                                        onPress={() => {
                                                            if (isSelected) setSelectedGroupMembers(prev => prev.filter(id => id !== contact.uid));
                                                            else setSelectedGroupMembers(prev => [...prev, contact.uid]);
                                                        }}
                                                        style={{
                                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                                            padding: 12, backgroundColor: currentColors.surface, borderRadius: 12,
                                                            borderWidth: 1, borderColor: isSelected ? COLORS.primary : (isDark ? '#334155' : '#e2e8f0')
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' }}>
                                                                {contact.photoURL ? (
                                                                    <Image source={{ uri: contact.photoURL }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                                                                ) : (
                                                                    <Text style={{ fontWeight: 'bold', color: '#fff' }}>{contact.username[0].toUpperCase()}</Text>
                                                                )}
                                                            </View>
                                                            <Text style={{ color: currentColors.text, fontWeight: '600' }}>{contact.displayName || contact.username}</Text>
                                                        </View>

                                                        <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: isSelected ? COLORS.primary : '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? COLORS.primary : 'transparent' }}>
                                                            {isSelected && <Check size={14} color="#fff" />}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>

                                <TouchableOpacity onPress={handleCreateGroup} style={[styles.primaryButton, { marginTop: 20 }]}>
                                    {isAuthLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('set_grp')}</Text>}
                                </TouchableOpacity>

                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* --- N. TAMAMLANAN GÖREVLER (GEÇMİŞ) MODALI --- */}
                <Modal visible={isHistoryModalOpen} animationType="slide" presentationStyle="pageSheet">
                    <View style={{ flex: 1, backgroundColor: currentColors.bg }}>

                        {/* Header */}
                        <View style={{ padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: currentColors.text }}>{t('completed')}</Text>
                                <Text style={{ fontSize: 12, color: currentColors.subText }}>{t('cmp_tsk')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)} style={{ padding: 5 }}>
                                <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>{t('close_btn')}</Text>
                            </TouchableOpacity>
                        </View>
                        {/* --- YENİ ARAMA ÇUBUĞU (GEÇMİŞ GÖREVLER) --- */}
                        <View style={[styles.inputField, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginHorizontal: 20, marginBottom: 15 }]}>
                            <FileText size={20} color={currentColors.subText} style={{ marginRight: 10 }} />
                            <TextInput
                                value={searchHistory}
                                onChangeText={setSearchHistory}
                                placeholder={t('search_history')}
                                placeholderTextColor={currentColors.subText}
                                style={{ flex: 1, color: currentColors.text, fontSize: 15, height: '100%' }}
                            />
                            {searchHistory.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchHistory('')} style={{ padding: 5 }}>
                                    <X size={18} color={currentColors.subText} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Liste */}
                        <FlatList
                            data={tasks
                                .filter(t => t.completed)
                                .filter(t => t.text.toLowerCase().includes(searchHistory.toLowerCase())) // <--- BURASI GÜNCELLENDİ
                                .sort((a, b) => b.date.localeCompare(a.date))
                            }
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', marginTop: 100, opacity: 0.6 }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                        <CheckCircle2 size={40} color={COLORS.success} />
                                    </View>
                                    <Text style={{ marginTop: 15, color: currentColors.subText, fontSize: 16 }}>{t('no_done_tsk')}</Text>
                                </View>
                            }
                            renderItem={({ item }) => {
                                // Kategori rengi
                                const cat = categories.find(c => c.id === item.categoryId);
                                const catColor = CATEGORY_COLORS.find(c => c.id === cat?.color)?.hex || COLORS.success;

                                const dateParts = item.date.split('-');
                                const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;

                                return (
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: currentColors.surface,
                                        padding: 16,
                                        marginBottom: 12,
                                        borderRadius: 16,
                                        borderLeftWidth: 4,
                                        borderLeftColor: COLORS.success, // Yeşil çizgi
                                        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
                                    }}>
                                        {/* Tarih (Sol) */}
                                        <View style={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            paddingRight: 15,
                                            borderRightWidth: 1,
                                            borderRightColor: isDark ? '#334155' : '#f1f5f9',
                                            marginRight: 15,
                                            width: 60
                                        }}>
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.success }}>{dateParts[2]}</Text>
                                            <Text style={{ fontSize: 12, color: currentColors.subText }}>{dateParts[1]}/{dateParts[0]}</Text>
                                        </View>

                                        {/* İçerik (Orta) */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: currentColors.text, marginBottom: 4, textDecorationLine: 'line-through', opacity: 0.7 }}>
                                                {item.text}
                                            </Text>

                                            {/* Alt Bilgiler */}
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                                {/* Kategori */}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? '#334155' : '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: catColor }} />
                                                    <Text style={{ fontSize: 10, color: currentColors.subText }}>{cat?.name || "Genel"}</Text>
                                                </View>

                                                {/* Kim atadı? (Başkasıysa) */}
                                                {item.assignedBy && item.assignedBy !== user.uid && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                        <User size={10} color="#ea580c" />
                                                        <Text style={{ fontSize: 10, color: "#ea580c" }}>{item.assignedByName}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Açıklama Varsa */}
                                            {item.description ? (
                                                <Text numberOfLines={2} style={{ fontSize: 12, color: currentColors.subText, marginTop: 6, fontStyle: 'italic' }}>
                                                    "{item.description}"
                                                </Text>
                                            ) : null}
                                        </View>

                                        {/* Sil butonu (Opsiyonel: Geçmişten tamamen silmek için) */}
                                        <TouchableOpacity
                                            onPress={() => askConfirmation(t('delete'), t('task_delete_confirm'), () => deleteTask(item), true)}
                                            style={{ padding: 5 }}
                                        >
                                            <Trash2 size={18} color={currentColors.subText} style={{ opacity: 0.5 }} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                        />
                    </View>
                </Modal>
                {/* --- EKSİK OLAN KISIM: PROFİL DÜZENLEME MODALI --- */}
                <Modal visible={isEditProfileVisible} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.centerModalOverlay}>
                            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: '100%', alignItems: 'center' }}>
                                <View style={styles.centerCard}>
                                    
                                    {/* Başlık ve Kapatma Butonu */}
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>{t('edit_profile')}</Text>
                                        <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                                            <X size={24} color={currentColors.subText} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.formGap}>
                                        
                                        {/* İsim Soyisim Input */}
                                        <View>
                                            <Text style={styles.sectionLabel}>{t('display_name_label')}</Text>
                                            <View style={styles.iconInputRow}>
                                                <User size={20} color={currentColors.subText} />
                                                <TextInput 
                                                    value={editDisplayNameInput} 
                                                    onChangeText={setEditDisplayNameInput} 
                                                    placeholder={t('jouw_naam')} 
                                                    placeholderTextColor={currentColors.subText} 
                                                    style={styles.flexInput} 
                                                />
                                            </View>
                                        </View>

                                        {/* Kullanıcı Adı Input */}
                                        <View>
                                            <Text style={styles.sectionLabel}>{t('auth_username_placeholder')}</Text>
                                            <View style={styles.iconInputRow}>
                                                <Text style={{ fontSize: 18, color: currentColors.subText, fontWeight: 'bold', paddingLeft: 5 }}>@</Text>
                                                <TextInput 
                                                    value={editUsernameInput} 
                                                    onChangeText={setEditUsernameInput} 
                                                    placeholder={t('auth_username_placeholder')}
                                                    placeholderTextColor={currentColors.subText} 
                                                    style={styles.flexInput} 
                                                    autoCapitalize='none'
                                                />
                                            </View>
                                            <Text style={{ fontSize: 11, color: COLORS.warning, marginTop: 5 }}>
                                                 {t('username_change_warning')}
                                            </Text>
                                        </View>

                                        {/* Kaydet Butonu */}
                                        <TouchableOpacity onPress={handleUpdateProfile} style={[styles.primaryButton, { marginTop: 10 }]}>
                                            <Text style={styles.primaryButtonText}>{t('save_changes')}</Text>
                                        </TouchableOpacity>

                                    </View>
                                </View>
                            </KeyboardAvoidingView>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* CONFIRM (Onay) */}
                <Modal visible={confirmModal.visible} transparent animationType="fade">
                    <View style={styles.centerModalOverlay}>
                        <View style={[styles.centerCard, { maxWidth: 320 }]}>
                            <Text style={styles.modalTitle}>{confirmModal.title}</Text>
                            <Text style={[styles.modalSubtitle, { textAlign: 'center' }]}>{confirmModal.message}</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <TouchableOpacity onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))} style={styles.cancelButton}>
                                    <Text style={{ color: currentColors.text, fontWeight: '600' }}>{t('cancel_btn')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, visible: false })); }}
                                    style={[styles.confirmButton, { backgroundColor: confirmModal.isDestructive ? COLORS.danger : COLORS.primary }]}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{confirmModal.isDestructive ? t('delete') : t('confirm_btn')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

// --- OmmioApp FONKSİYONUNUN DIŞINA, EN ALTA ---

// --- TİP TANIMLAMASI ---
interface MessageItemProps {
    msg: any;          // Detaylı tipiniz varsa ChatMessage kullanın, yoksa any
    user: any;         // User tipi
    chatTarget: any;   // Contact tipi
    currentColors: any;
    isDark: boolean;
}
// --- GÖREV KARTINDAKİ AKILLI SOHBET BUTONU (DÜZELTİLMİŞ) ---
const TaskChatButton = ({ task, user, onPress }: { task: any, user: any, onPress: () => void }) => {
    const [hasUnread, setHasUnread] = React.useState(false);

    React.useEffect(() => {
        if (!user || !task) return;

        let targetDbId = user.uid;
        if (task.assignedTo) {
            targetDbId = task.assignedTo;
        }

        // --- DÜZELTME BURADA ---
        // Sadece 'read' durumuna bakıyoruz. 'senderId' kontrolünü aşağıda yapacağız.
        // Bu sayede Index oluşturmana gerek kalmaz.
        const q = query(
            collection(db, "users", targetDbId, "tasks", task.id, "comments"),
            where("read", "==", false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setHasUnread(false);
                return;
            }

            // JavaScript tarafında filtreleme:
            // Okunmamış mesajların içinde "Bana Ait Olmayan" (Başkası tarafından atılmış) var mı?
            const incomingUnreadMessages = snapshot.docs.filter(doc => {
                const data = doc.data();
                return data.senderId !== user.uid;
            });

            if (incomingUnreadMessages.length > 0) {
                setHasUnread(true);
            } else {
                setHasUnread(false);
            }
        }, (error) => {
            // Hata olursa konsola yaz ama uygulamayı çökertme
            console.log("TaskChatButton Error:", error);
        });

        return () => unsubscribe();
    }, [task, user]);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{ padding: 8, marginRight: 5, position: 'relative' }}
        >
            <MessageCircle size={22} color={COLORS.primary} strokeWidth={2} />
            {hasUnread && (
                <View style={{
                    position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: 6,
                    backgroundColor: COLORS.danger, borderWidth: 2, borderColor: '#fff', zIndex: 10
                }} />
            )}
        </TouchableOpacity>
    );
};
// --- GÜNCELLENMİŞ MessageItem ---
const MessageItem = ({ msg, user, chatTarget, currentColors, isDark }: MessageItemProps) => {
    const [decryptedText, setDecryptedText] = useState(msg.text);
    const isMe = msg.senderId === user.uid;

    // MessageItem içindeki useEffect'i bununla değiştir:
    useEffect(() => {
        const decrypt = async () => {
            // 1. Düz metin kontrolü
            if (!msg.text || !msg.text.startsWith('{')) {
                setDecryptedText(msg.text);
                return;
            }

            // 2. Şifre Çözme
            if (isMe) {
                // ... (Kendi mesajım kısmı aynı kalsın) ...
                if (msg.senderCopy && msg.senderCopy.startsWith('{')) {
                    const myKey = user.publicKey;
                    if (myKey) {
                        try {
                            const text = await decryptMessage(msg.senderCopy, myKey);
                            setDecryptedText(text);
                        } catch (e) { setDecryptedText("⚠️ Çözülemedi"); }
                    } else { setDecryptedText("Anahtar yok..."); }
                } else { setDecryptedText(msg.senderCopy || "🔒"); }
            } else {
                // --- GELEN MESAJ (KARŞI TARAF) ---

                // A. Önce prop'tan gelen anahtarı dene
                let senderKey = chatTarget?.publicKey;

                // B. Eğer prop'ta yoksa, ACİL DURUM: Veritabanından o an çek
                if (!senderKey) {
                    try {
                        const userDoc = await getDoc(doc(db, "public_users", chatTarget.uid));
                        if (userDoc.exists()) {
                            senderKey = userDoc.data().publicKey;
                        }
                    } catch (e) { console.log("Key fetch error", e); }
                }

                if (senderKey) {
                    try {
                        const text = await decryptMessage(msg.text, senderKey);
                        setDecryptedText(text);
                    } catch (e) {
                        setDecryptedText("⚠️ Şifre hatası");
                    }
                } else {
                    setDecryptedText("⏳ Anahtar bekleniyor...");
                }
            }
        };
        decrypt();
    }, [msg.text, msg.senderCopy, isMe, user.publicKey, chatTarget]); // chatTarget dependency'de kalsın

    const timeString = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <View style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', marginBottom: 8, maxWidth: '75%' }}>
            <View style={{
                backgroundColor: isMe ? COLORS.primary : (isDark ? '#334155' : '#fff'),
                borderRadius: 12, borderBottomRightRadius: isMe ? 2 : 12, borderBottomLeftRadius: isMe ? 12 : 2,
                padding: 8, paddingHorizontal: 12,
                shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
            }}>
                <Text style={{ color: isMe ? '#fff' : currentColors.text, fontSize: 15 }}>
                    {decryptedText}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2, gap: 4 }}>
                    <Text style={{ fontSize: 9, color: isMe ? 'rgba(255,255,255,0.7)' : currentColors.subText }}>{timeString}</Text>
                    {isMe && (
                        msg.read ? <CheckCheck size={14} color="#a5f3fc" /> : <CheckCheck size={14} color="rgba(255,255,255,0.6)" />
                    )}
                </View>
            </View>
        </View>
    )
};


const premiumStyles = StyleSheet.create({

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)', // Arkası hafif karartılmış
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    adContainer: {
        width: '100%',
        maxWidth: 400, // Web'de çok genişlemesin
        height: '60%', // Ekranın %60'ını kaplasın
        backgroundColor: '#000',
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    closeAdButton: {
        width: '100%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15
    },
    card: {
        width: '100%',
        maxWidth: 380, // Web'de kart görünümü için sınır
        borderRadius: 32, // Modern yuvarlak köşeler
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 25
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fffbeb', // Açık amber rengi
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#fcd34d'
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 10,
        lineHeight: 20
    },
    featuresList: {
        width: '100%',
        marginBottom: 20
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10b981', // Yeşil tik
        alignItems: 'center',
        justifyContent: 'center'
    },
    featureText: {
        fontSize: 15,
        fontWeight: '500'
    },
    ctaButton: {
        backgroundColor: '#d97706', // Amber-600
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#d97706',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5
    },
    ctaText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    ctaSubText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2
    },
    secondaryButton: {
        padding: 10,
        alignItems: 'center'
    }
});
const getIconButtonStyle = (isDark: boolean): import('react-native').ViewStyle => ({
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    // Gölge ayarları
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
});


const getDynamicStyles = (currentColors: any, isDark: boolean) => StyleSheet.create({
    closeBtn: {
        padding: 8,
        backgroundColor: isDark ? '#334155' : '#f1f5f9', // Hafif bir arka plan
        borderRadius: 20, // Yuvarlak buton görünümü
        alignItems: 'center',
        justifyContent: 'center',
    },
    // --- MODAL & SHEET STYLES ---
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalBackdrop: {
        flex: 1,
    },
    shadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, // Daha yumuşak gölge
        shadowRadius: 4,
        elevation: 3,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 15,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1, // Hafif bir çizgi daha modern durur
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        zIndex: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 1,
    },
    headerSubtitle: {
        fontSize: 12,
    },
    // Menu Dropdown
    menuDropdown: {
        position: 'absolute',
        top: 45,
        right: 0,
        width: 150,
        borderRadius: 14,
        padding: 6,
        borderWidth: 1,
        zIndex: 100,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    // List
    listContainer: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    // Input Area
    inputWrapper: {
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 26,
        borderWidth: 1,
        minHeight: 50,
        padding: 4, // İç boşluk ile butonu inputtan ayıran modern görünüm
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 12, // Dikey ortalama
        maxHeight: 120,
        paddingTop: 12, // Multiline için hizalama
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
        marginRight: 2,
    },
    bottomSheetCard: {
        backgroundColor: currentColors.bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    centerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    centerCard: {
        backgroundColor: currentColors.surface,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: currentColors.text,
    },
    modalSubtitle: {
        color: currentColors.subText,
        marginBottom: 20,
        lineHeight: 20,
    },
    

    // FORM ELEMENTS
    formGap: {
        gap: 16,
    },
    inputField: {
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        color: currentColors.text,
        padding: 14,
        borderRadius: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    inputAppendBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 15,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 15,
        gap: 10,
    },
    flexInput: {
        flex: 1,
        paddingVertical: 14,
        color: currentColors.text,
        fontSize: 15,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
        flexDirection: 'row',
        gap: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // HABIT & FREQUENCY
    freqRow: {
        flexDirection: 'row',
        gap: 10,
    },
    freqPill: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: isDark ? '#334155' : '#f1f5f9',
        borderWidth: 1,
        borderColor: isDark ? '#475569' : '#e2e8f0',
    },
    freqPillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    freqText: {
        fontWeight: '600',
        color: currentColors.text,
    },
    freqTextActive: {
        color: '#fff',
    },
    daysWrapper: {
        marginTop: 5,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    dayCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: isDark ? '#334155' : '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: isDark ? '#475569' : '#e2e8f0',
    },
    dayCircleActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: currentColors.text,
    },
    dayTextActive: {
        color: '#fff',
    },
    sectionLabel: {
        color: currentColors.subText,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoryTag: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: currentColors.surface,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#e2e8f0',
        marginRight: 6,
    },

    // SEGMENTED CONTROL (TABS)
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: isDark ? '#334155' : '#e2e8f0',
        borderRadius: 12,
        padding: 4,
        marginBottom: 10,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    segmentBtnActive: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    // CHAT
    chatAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.secondary,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatBubble: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 2,
    },
    chatBubbleMe: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    chatBubbleOther: {
        backgroundColor: isDark ? '#334155' : '#f1f5f9',
        borderTopLeftRadius: 4,
    },
    chatInputBar: {
        padding: 12,
        borderTopWidth: 1,
        borderColor: isDark ? '#334155' : '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: currentColors.surface,
    },
    chatInput: {
        flex: 1,
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 40,
        color: currentColors.text,
    },
    chatSendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // CATEGORY LIST
    categoryListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    deleteIconBtn: {
        padding: 8,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
    },
    colorCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    colorCircleSelected: {
        borderWidth: 3,
        borderColor: currentColors.text,
    },

    // ONBOARDING
    onboardingContainer: {
        flex: 1,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onboardingIconCircle: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onboardingTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    onboardingDesc: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
    },
    onboardingFooter: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        paddingHorizontal: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    onboardingBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },

    // CONFIRM BUTTONS
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: isDark ? '#334155' : '#f1f5f9',
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    // ADS & UPSELL
    fullScreenOverlay: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        padding: 20,
    },
    adCard: {
        backgroundColor: '#1e1e1e',
        borderRadius: 16,
        padding: 20,
        height: '60%',
        alignItems: 'center',
    },
    adBadge: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    adContentPlaceholder: {
        flex: 1,
        width: '100%',
        backgroundColor: '#000',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    adCloseBtn: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 24,
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
    },
    upsellIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    upsellTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: currentColors.text,
        textAlign: 'center',
    },
    upsellSubtitle: {
        color: currentColors.subText,
        textAlign: 'center',
        marginTop: 5,
    },
    checkCircleSmall: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toastContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40, // Android/iOS farkı
        left: 20,
        right: 20,
        zIndex: 9999,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderWidth: 1,
        // Modern Gölge
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    toastIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    toastTitle: {
        color: '#0f172a', // Daha koyu, okunabilir renk
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 2,
        letterSpacing: 0.3,
    },
    toastMessage: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
    },
    toastCloseBtn: {
        padding: 4,
        opacity: 0.7,
    },
    // FAB (Habit)
    fabContainer: {
        alignItems: 'flex-end',
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        zIndex: 50,
        position: 'absolute',
        right: 20, // Sağdan boşluk varsayılan olarak eklendi
    },
    fabButton: {
        backgroundColor: COLORS.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Task Input Overlay & Container
    overlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        zIndex: 40
    },
    blurInputContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        borderWidth: 1,
        overflow: 'hidden',
        zIndex: 50,
        borderRadius: 20, // Varsayılan olarak ekledim, tasarımına göre değiştirebilirsin
    },

    // Expanded Content
    expandedContent: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: currentColors.subText,
        marginBottom: 5,
    },
    miniHeader: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5
    },
    searchRow: {
        flexDirection: 'row',
        gap: 5,
        marginBottom: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingBottom: 10,
    },

    // Assignee Chips
    assignChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    avatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        overflow: 'hidden',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '700'
    },

    // Date Inputs
    dateRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    dateInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateInput: {
        flex: 1,
        height: 36,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        paddingHorizontal: 10,
        fontSize: 12,
    },
    calendarBtn: {
        backgroundColor: COLORS.primary,
        padding: 7,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        height: 36,
        justifyContent: 'center',
    },
    smallInput: {
        height: 36,
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 12,
    },

    // Categories
    divider: {
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1,
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Bottom Actions (Toggles)
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
    },
    iconToggle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    iconToggleActiveBlue: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
    iconToggleActiveRed: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
    iconToggleActiveGreen: { backgroundColor: '#f0fdf4', borderColor: '#10b981' },
    timeInput: {
        width: 50,
        height: 30,
        borderWidth: 1,
        borderRadius: 6,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: 'bold',
    },

    // Main Input Row
    mainInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 10,
    },
    expandBtn: {
        padding: 5,
    },
    mainTextInput: {
        flex: 1,
        height: 40,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Öğeleri eşit aralıkla yayar
        alignItems: 'center',
        paddingVertical: 10, // Alt ve üst boşluk
        paddingBottom: 20, // iPhone safe area için ekstra boşluk (gerekirse)
        borderTopWidth: 1,
        elevation: 10, // Android gölgesi için
        shadowColor: '#000', // iOS gölgesi için
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1, // Tıklama alanını genişletir
        paddingVertical: 5,
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 4, // İkon ile metin arasına biraz boşluk
        fontWeight: '500',
    },

    container: { flex: 1, },
    card: { padding: 20, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
    input: { backgroundColor: 'rgba(0,0,0,0.05)', padding: 15, borderRadius: 12, fontSize: 16 },
    btn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
    greeting: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    appTitle: { fontSize: 28, fontWeight: '900' },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1' },
    menuText: { fontSize: 16, fontWeight: '500', marginLeft: 10, flex: 1 },
    pill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10 },
    dateNavContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 },
    // styles objesi içinde güncelle veya kontrol et:
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)', // Hafif mor arka plan
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    dateText: { fontWeight: '700', fontSize: 14 },
    todayBadge: { marginLeft: 8, backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    todayText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    dateArrow: { padding: 5 },
    content: { flex: 1, paddingHorizontal: 24 },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    emptyDesc: { textAlign: 'center', color: '#94a3b8', lineHeight: 20 },
    taskCard: { padding: 16, borderRadius: 24, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    checkBox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    taskText: { fontSize: 16, fontWeight: '600' },
    taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    floatingInputWrapper: { position: 'absolute', bottom: 90, left: 20, right: 20, borderRadius: 24, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, overflow: 'hidden' },
    inputMainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mainInput: { flex: 1, fontSize: 16, height: 40, fontWeight: '500' },
    expandedOptions: { paddingBottom: 10, marginBottom: 10 },
    timeToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    statsHero: { padding: 30, borderRadius: 32, marginBottom: 20 },
    activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 4 },
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
    tinyInput: { fontSize: 12, fontWeight: 'bold', width: 40, padding: 0, textAlign: 'center', borderBottomWidth: 1 },
    dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', padding: 8, borderRadius: 8, marginTop: 5 },
    catModal: { width: '80%', padding: 20, borderRadius: 24 },
    catModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },

});
