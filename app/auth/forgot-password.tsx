import { Stack, useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, CheckCircle2, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView, Platform,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// --- DEĞİŞİKLİK BURADA ---
// Sabit tr objesini sildik, yerine dışarıdan import ediyoruz:
import { TRANSLATIONS, } from '../../constants/translations';

// Kodun geri kalanında "tr.forgot_title" gibi kullanımların çalışması için
// TRANSLATIONS içinden "tr" kısmını alıyoruz.
// (Eğer TRANSLATIONS dosyanızda yapı farklıysa burayı ona göre güncelleyebilirsiniz: örn. const tr = TRANSLATIONS;)
const currentLangCode = 'en'; 
const en = TRANSLATIONS[currentLangCode];

const COLORS = {
    primary: '#6366f1',
    background: '#F8FAFC',
    surface: '#ffffff',
    textDark: '#1e293b',
    subText: '#94a3b8',
    danger: '#ef4444',
    success: '#10b981'
};

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleReset = async () => {
        if (!input.trim()) {
            setStatus('error');
            setMessage(en.forgot_enter_email_username_error);
            return;
        }

        setLoading(true);
        setStatus('idle');
        let targetEmail = input.trim();

        try {
            // 1. Eğer '@' yoksa, bunun bir kullanıcı adı olduğunu varsay ve e-postayı bul
            if (!targetEmail.includes('@')) {
                const cleanUsername = targetEmail.toLowerCase()
                    .replace(/\s+/g, '')
                    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

                const usernameRef = doc(db, "usernames", cleanUsername);
                const docSnap = await getDoc(usernameRef);

                if (docSnap.exists()) {
                    targetEmail = docSnap.data().email;
                } else {
                    throw new Error("USER_NOT_FOUND");
                }
            }

            // 2. Firebase Şifre Sıfırlama
            await sendPasswordResetEmail(auth, targetEmail);
            
            setStatus('success');
            // {{email}} kısmını gerçek e-posta ile değiştiriyoruz
            setMessage(en.forgot_success_with_email.replace('{{email}}', targetEmail));
            setInput(""); 

        } catch (error: any) {
            console.log(error);
            setStatus('error');
            if (error.message === "USER_NOT_FOUND") {
                setMessage(en.forgot_username_not_found);
            } else if (error.code === 'auth/user-not-found') {
                setMessage(en.forgot_email_not_found);
            } else if (error.code === 'auth/invalid-email') {
                setMessage(en.forgot_invalid_email);
            } else {
                setMessage(en.generic_error_prefix + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.container}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={COLORS.textDark} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Lock size={40} color={COLORS.primary} />
                </View>

                <Text style={styles.title}>{en.forgot_title}</Text>
                <Text style={styles.subtitle}>
                    {en.forgot_subtitle}
                </Text>

                <View style={styles.inputWrapper}>
                    <Mail size={20} color={COLORS.subText} style={styles.inputIcon} />
                    <TextInput 
                        style={styles.input}
                        placeholder={en.forgot_input_placeholder}
                        placeholderTextColor={COLORS.subText}
                        value={input}
                        onChangeText={setInput}
                        autoCapitalize="none"
                    />
                </View>

                {status !== 'idle' && (
                    <View style={[styles.messageBox, status === 'success' ? styles.msgSuccess : styles.msgError]}>
                        {status === 'success' ? <CheckCircle2 size={18} color={COLORS.success} /> : <AlertCircle size={18} color={COLORS.danger} />}
                        <Text style={[styles.messageText, { color: status === 'success' ? '#065f46' : '#991b1b' }]}>
                            {message}
                        </Text>
                    </View>
                )}

                <TouchableOpacity 
                    onPress={handleReset} 
                    style={styles.resetBtn} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.resetBtnText}>{en.forgot_button}</Text>
                    )}
                </TouchableOpacity>

            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, backgroundColor: COLORS.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    content: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
    subtitle: { textAlign: 'center', color: COLORS.subText, marginBottom: 30, fontSize: 14, lineHeight: 22 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 15, height: 55, width: '100%', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: '100%', fontSize: 16, color: COLORS.textDark },
    resetBtn: { width: '100%', backgroundColor: COLORS.primary, height: 55, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    resetBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    messageBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, width: '100%', gap: 10 },
    msgSuccess: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: COLORS.success },
    msgError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: COLORS.danger },
    messageText: { fontSize: 13, flex: 1, fontWeight: '500' }
});