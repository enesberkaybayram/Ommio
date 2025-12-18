import React from 'react';
import { FlexWidget, IconWidget, TextWidget } from 'react-native-android-widget';

interface TaskData {
  text: string;
  completed: boolean;
}

interface HabitData {
  title: string;
  completed: boolean;
}

interface WidgetProps {
  tasks: TaskData[];
  habits: HabitData[];
  isPremium: boolean;
}

export function WidgetTaskHandler({ tasks, habits, isPremium }: WidgetProps) {

  // ---------------------------------------------------------
  // 🔒 DURUM 1: KULLANICI PREMIUM DEĞİLSE (KİLİT EKRANI)
  // ---------------------------------------------------------
  if (!isPremium) {
    return (
      <FlexWidget
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
        clickAction="OPEN_APP"
      >
        <IconWidget
          font="material"
          icon="lock" // DÜZELTME 1: 'name' yerine 'icon'
          size={48}
          style={{ color: '#f59e0b', marginBottom: 12 }}
        />
        
        <TextWidget
          text="Özellik Kilitli"
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: 6,
          }}
        />

        <TextWidget
          text="Widget'ı kullanmak için Premium'a geç."
          style={{
            fontSize: 12,
            color: '#64748b',
            textAlign: 'center',
          }}
        />
      </FlexWidget>
    );
  }

  // ---------------------------------------------------------
  // ✅ DURUM 2: PREMIUM KULLANICI (NORMAL LİSTE)
  // ---------------------------------------------------------
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
      clickAction="OPEN_APP"
    >
      {/* --- BÖLÜM 1: GÖREVLER --- */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TextWidget
          text="GÖREVLER"
          style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: '#6366f1',
            letterSpacing: 1,
          }}
        />
      </FlexWidget>

      {tasks.length === 0 ? (
        <FlexWidget style={{ alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
          <TextWidget text="Görevler Tamam! 🎉" style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }} />
        </FlexWidget>
      ) : (
        tasks.slice(0, 3).map((task, index) => (
          <FlexWidget
            key={`task-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              borderRadius: 8,
              padding: 6,
              marginBottom: 4,
            }}
          >
            {/* İkon */}
            <IconWidget
              font="material"
              icon={task.completed ? 'check_circle' : 'radio_button_unchecked'} // DÜZELTME 1
              size={16}
              style={{ color: task.completed ? '#10b981' : '#6366f1', marginRight: 8 }}
            />
            
            {/* Metin Kapsayıcısı (Flex için) */}
            <FlexWidget style={{ flex: 1, justifyContent: 'center' }}> 
                <TextWidget
                text={task.text}
                style={{
                    fontSize: 12,
                    color: task.completed ? '#94a3b8' : '#334155',
                    // DÜZELTME 2: textDecorationLine kaldırıldı (Android Widget desteklemez)
                    // DÜZELTME 3: flex kaldırıldı (TextWidget desteklemez, üstündeki FlexWidget hallediyor)
                }}
                maxLines={1}
                />
            </FlexWidget>
          </FlexWidget>
        ))
      )}

      {/* --- AYIRACI --- */}
      <FlexWidget style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 6 }} />

      {/* --- BÖLÜM 2: ALIŞKANLIKLAR --- */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TextWidget
          text="ALIŞKANLIKLAR"
          style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: '#f97316',
            letterSpacing: 1,
          }}
        />
      </FlexWidget>

      {habits.length === 0 ? (
        <FlexWidget style={{ alignItems: 'center', marginTop: 4 }}>
           <TextWidget text="Listene ekle 🚀" style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }} />
        </FlexWidget>
      ) : (
        habits.slice(0, 2).map((habit, index) => (
          <FlexWidget
            key={`habit-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              borderRadius: 8,
              padding: 6,
              marginBottom: 4,
            }}
          >
             <IconWidget
              font="material"
              icon={habit.completed ? 'local_fire_department' : 'radio_button_unchecked'} // DÜZELTME 1
              size={16}
              style={{ color: habit.completed ? '#f97316' : '#f97316', marginRight: 8 }}
            />
            
            <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
                <TextWidget
                text={habit.title}
                style={{
                    fontSize: 12,
                    color: '#334155',
                    // DÜZELTME 3: flex kaldırıldı
                }}
                maxLines={1}
                />
            </FlexWidget>
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}