import React from 'react';
import {
  FlexWidget,
  IconWidget,
  TextWidget
} from 'react-native-android-widget';

interface TaskData {
  text: string;
  completed: boolean;
}

interface HabitData {
  title: string;
  completed: boolean;
}

// Interface'i dışarı aktarıyoruz ki _layout.tsx hata vermesin
export interface WidgetProps {
  tasks: TaskData[];
  habits: HabitData[];
  isPremium: boolean;
}

export function WidgetTaskHandler({ tasks, habits, isPremium }: WidgetProps) {

  // ---------------------------------------------------------
  // 🔒 DURUM 1: PREMIUM DEĞİLSE -> KİLİT EKRANI
  // ---------------------------------------------------------
  if (!isPremium) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <IconWidget
          font="material"
          icon="lock"
          size={40}
          style={{ color: '#f59e0b', marginBottom: 10 }}
        />
        <TextWidget
          text="Premium Özellik"
          style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 }}
        />
        <TextWidget
          text="Widget'ı açmak için dokun."
          style={{ fontSize: 12, color: '#64748b' }}
        />
      </FlexWidget>
    );
  }

  // ---------------------------------------------------------
  // ✅ DURUM 2: PREMIUM İSE -> LİSTE
  // ---------------------------------------------------------
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      {/* --- BAŞLIK: GÖREVLER --- */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <TextWidget
          text="GÖREVLER"
          style={{ fontSize: 11, fontWeight: 'bold', color: '#6366f1', letterSpacing: 1 }}
        />
      </FlexWidget>

      {tasks.length === 0 ? (
        <TextWidget
          text="Görevler tamamlandı! 🎉"
          style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8 }}
        />
      ) : (
        tasks.slice(0, 3).map((task, index) => (
          <FlexWidget
            key={`task-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              padding: 6,
              marginBottom: 4,
            }}
          >
            <IconWidget
              font="material"
              icon={task.completed ? 'check_circle' : 'radio_button_unchecked'}
              size={16}
              style={{ color: task.completed ? '#10b981' : '#6366f1', marginRight: 8 }}
            />
            
            {/* 👇 DÜZELTME BURADA: TextWidget'a flex verilemediği için FlexWidget ile sardık */}
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget
                text={task.text}
                style={{
                  fontSize: 12,
                  color: task.completed ? '#94a3b8' : '#334155',
                }}
                maxLines={1}
              />
            </FlexWidget>
          </FlexWidget>
        ))
      )}

      {/* --- AYIRAÇ --- */}
      <FlexWidget style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 6 }} />

      {/* --- BAŞLIK: ALIŞKANLIKLAR --- */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <TextWidget
          text="ALIŞKANLIKLAR"
          style={{ fontSize: 11, fontWeight: 'bold', color: '#f97316', letterSpacing: 1 }}
        />
      </FlexWidget>

      {habits.length === 0 ? (
        <TextWidget
          text="Yeni bir hedef belirle 🚀"
          style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}
        />
      ) : (
        habits.slice(0, 2).map((habit, index) => (
          <FlexWidget
            key={`habit-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              padding: 6,
              marginBottom: 4,
            }}
          >
            <IconWidget
              font="material"
              icon={habit.completed ? 'local_fire_department' : 'radio_button_unchecked'}
              size={16}
              style={{ color: habit.completed ? '#f97316' : '#f97316', marginRight: 8 }}
            />
            
            {/* 👇 DÜZELTME BURADA: Aynı şekilde FlexWidget ile sardık */}
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget
                text={habit.title}
                style={{ fontSize: 12, color: '#334155' }}
                maxLines={1}
              />
            </FlexWidget>
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}