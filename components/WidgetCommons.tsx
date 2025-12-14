import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Ana Uygulama Renkleri (Tüm widget'larda tutarlılık için)
export const WIDGET_COLORS = { 
    primary: '#6366f1', 
    success: '#10b981', 
    danger: '#ef4444', 
    text: '#1e293b', 
    subText: '#64748b', 
    bg: '#f8fafc',
    card: '#ffffff'
};

// Widget'lar için sade tema objesi
export const WIDGET_THEME = {
    background: WIDGET_COLORS.card,
    text: WIDGET_COLORS.text,
    subText: WIDGET_COLORS.subText,
};

// --- ORTAK TİPLER ---
export interface WidgetTask { text: string; completed: boolean; date: string; priority?: 'low' | 'medium' | 'high'; }
export interface WidgetHabit { title: string; completed: boolean; streak: number; isToday: boolean; }

// --- ORTAK KÜÇÜK BİLEŞENLER (Export Edilmesi Gerekenler) ---

// Small Task Item (TaskMediumWidget'ta kullanılır)
export const TaskItemSmall: React.FC<{ task: WidgetTask }> = ({ task }) => (
    <View style={commonStyles.taskContainer}>
        <View style={[commonStyles.check, { borderColor: task.completed ? WIDGET_COLORS.success : WIDGET_COLORS.subText, backgroundColor: task.completed ? WIDGET_COLORS.success : 'transparent' }]}>
            {task.completed && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
        </View>
        <Text style={[commonStyles.taskText, { textDecorationLine: task.completed ? 'line-through' : 'none', color: WIDGET_THEME.text }]} numberOfLines={1}>
            {task.text}
        </Text>
    </View>
);

// Habit Streak Indicator
export const HabitStreakIndicator: React.FC<{ habit: WidgetHabit }> = ({ habit }) => (
    <View style={commonStyles.habitContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[commonStyles.dot, { backgroundColor: habit.completed ? WIDGET_COLORS.success : WIDGET_COLORS.primary }]} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: WIDGET_THEME.text }} numberOfLines={1}>{habit.title}</Text>
        </View>
        <Text style={{ fontSize: 12, color: WIDGET_COLORS.primary, fontWeight: 'bold' }}>
            🔥 {habit.streak} Gün
        </Text>
    </View>
);

const commonStyles = StyleSheet.create({
    taskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    check: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1.5,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskText: {
        fontSize: 13,
        flex: 1,
    },
    habitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    }
});