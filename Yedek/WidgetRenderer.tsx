import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
// 👈 Düzeltme 1: Tüm gerekli sabitler ve bileşenler import edildi
import { HabitStreakIndicator, TaskItemSmall, WIDGET_COLORS, WIDGET_THEME, WidgetHabit, WidgetTask } from '../components/WidgetCommons';

// --- TASK WIDGET VARYASYONLARI ---

// 1. Task Widget - Small (Sadece 1 görev ve durum)
export const TaskSmallWidget: React.FC<{ task: WidgetTask | null }> = ({ task }) => (
    <View style={styles.iosContainer}>
        {task ? (
            <View style={{flex: 1, justifyContent: 'center'}}>
                <Text style={styles.iosTitle} numberOfLines={2}>Bugün Yapılacak:</Text>
                {/* 👈 Düzeltme 2: COLORS -> WIDGET_COLORS */}
                <Text style={[styles.iosText, {color: task.completed ? WIDGET_COLORS.success : WIDGET_COLORS.danger}]} numberOfLines={1}>
                    {task.text}
                </Text>
            </View>
        ) : <Text style={styles.iosEmptyText}>Göreviniz Yok</Text>}
    </View>
);

// 2. Task Widget - Medium (3 görevlik liste)
export const TaskMediumWidget: React.FC<{ tasks: WidgetTask[] }> = ({ tasks }) => (
    <View style={styles.iosContainer}>
        <Text style={styles.iosTitle}>Gelecek Görevler</Text>
        <View style={{marginTop: 8}}>
            {tasks.slice(0, 3).map((task, index) => (
                <TaskItemSmall key={index} task={task} />
            ))}
            {tasks.length === 0 && <Text style={styles.iosEmptyText}>Hepsi Tamamlandı!</Text>}
        </View>
    </View>
);

// 3. Task Widget - Large (Geniş görev listesi ve kategori özeti)
export const TaskLargeWidget: React.FC<{ tasks: WidgetTask[], overview: any }> = ({ tasks, overview }) => (
    <View style={styles.iosContainer}>
        <View style={styles.iosHeaderRow}>
            <Text style={styles.iosTitle}>Görev Listesi</Text>
            {/* 👈 Düzeltme 2: COLORS -> WIDGET_COLORS */}
            <Text style={{color: WIDGET_COLORS.primary, fontWeight: 'bold'}}>{overview.activeCount} Aktif</Text>
        </View>
        <View style={{marginTop: 10, flex: 1}}>
            {tasks.slice(0, 6).map((task, index) => (
                <TaskItemSmall key={index} task={task} />
            ))}
        </View>
    </View>
);

// --- HABIT WIDGET VARYASYONLARI ---

// 4. Habit Widget - Small (Günlük İlerleme Çubuğu)
export const HabitSmallWidget: React.FC<{ progress: number }> = ({ progress }) => (
    <View style={[styles.iosContainer, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={styles.iosTitle}>Alışkanlık</Text>
        {/* 👈 Düzeltme 2: COLORS -> WIDGET_COLORS */}
        <Text style={{fontSize: 32, fontWeight: 'bold', color: WIDGET_COLORS.primary}}>%{progress.toFixed(0)}</Text>
    </View>
);

// 5. Habit Widget - Medium (4 Alışkanlık Takibi)
export const HabitMediumWidget: React.FC<{ habits: WidgetHabit[] }> = ({ habits }) => (
    <View style={styles.iosContainer}>
        <Text style={styles.iosTitle}>Bugünkü Alışkanlıklar</Text>
        <View style={{marginTop: 5, flex: 1}}>
            {habits.slice(0, 4).map((habit, index) => (
                <HabitStreakIndicator key={index} habit={habit} />
            ))}
        </View>
    </View>
);

// 6. Habit Widget - Large (Habit Listesi ve Haftalık Özet)
export const HabitLargeWidget: React.FC<{ habits: WidgetHabit[], weeklySummary: any }> = ({ habits, weeklySummary }) => (
    <View style={styles.iosContainer}>
        <Text style={styles.iosTitle}>En Uzun Seriler</Text>
        <View style={{marginTop: 10, flex: 1}}>
            {habits.slice(0, 5).map((habit, index) => (
                <HabitStreakIndicator key={index} habit={habit} />
            ))}
        </View>
        {/* Haftalık özet bar grafiği buraya entegre edilebilir */}
        {/* <Text style={{fontSize: 10, color: WIDGET_THEME.subText, marginTop: 10}}>... Haftalık Özet...</Text> */}
    </View>
);

const styles = StyleSheet.create({
    iosContainer: {
        flex: 1,
        // WIDGET_THEME.background yerine WIDGET_THEME.background kullanıyoruz
        backgroundColor: WIDGET_THEME.background, 
        padding: 15,
        borderRadius: 16,
    },
    iosHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5
    },
    iosTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: WIDGET_THEME.text,
    },
    iosText: {
        fontSize: 14,
        color: WIDGET_THEME.subText,
        marginTop: 4,
    },
    iosEmptyText: {
        fontSize: 12,
        color: WIDGET_THEME.subText,
        textAlign: 'center',
        marginTop: 10
    }
});