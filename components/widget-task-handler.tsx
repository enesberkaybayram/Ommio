import React from 'react';
// 1. ListItemWidget kaldırıldı (Hata veriyordu)
// 2. Stil tipleri (FlexWidgetStyle, TextWidgetStyle) import edildi
import {
  FlexWidget,
  FlexWidgetStyle,
  TextWidget,
  TextWidgetStyle
} from 'react-native-android-widget';

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
}

export function WidgetTaskHandler({ tasks, habits }: WidgetProps) {
  
  // 3. Stiller için "Tip Tanımlaması" yapıldı (Hata çözümü)
  const cardStyle: FlexWidgetStyle = {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    flex: 1,
    flexDirection: 'column',
  };

  const headerStyle: TextWidgetStyle = {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
  };

  const itemStyle: FlexWidgetStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  };

  // Başlık kutusu stili
  const headerContainerStyle: FlexWidgetStyle = {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10
  };

  return (
    <FlexWidget style={cardStyle}>
      {/* BAŞLIK */}
      <FlexWidget style={headerContainerStyle}>
        <TextWidget text="Ommio - Bugün" style={headerStyle} />
        <TextWidget text="📅" style={{ fontSize: 14 } as TextWidgetStyle} />
      </FlexWidget>

      {/* --- GÖREVLER BÖLÜMÜ --- */}
      <TextWidget 
        text="Görevler" 
        style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 } as TextWidgetStyle} 
      />
      
      {tasks.length === 0 ? (
        <TextWidget 
          text="Bugün için görev yok." 
          style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' } as TextWidgetStyle} 
        />
      ) : (
        tasks.slice(0, 3).map((task, index) => (
          <FlexWidget key={`task-${index}`} style={itemStyle}>
            <TextWidget 
              text={task.completed ? "✅ " : "⬜ "} 
              style={{ fontSize: 12, marginRight: 5 } as TextWidgetStyle} 
            />
            {/* 4. textDecorationLine kaldırıldı (Desteklenmiyor), yerine renk değişimi kullanıldı */}
            <TextWidget 
              text={task.text} 
              style={{ 
                color: task.completed ? '#64748b' : '#ffffff', 
                fontSize: 13,
                // textDecorationLine desteklenmediği için kaldırdık.
              } as TextWidgetStyle} 
            />
          </FlexWidget>
        ))
      )}

      {/* --- AYIRAÇ --- */}
      <FlexWidget style={{ height: 1, backgroundColor: '#334155', marginVertical: 8 } as FlexWidgetStyle} />

      {/* --- ALIŞKANLIKLAR BÖLÜMÜ --- */}
      <TextWidget 
        text="Alışkanlıklar" 
        style={{ color: '#a855f7', fontSize: 12, marginBottom: 4 } as TextWidgetStyle} 
      />
      
      {habits.length === 0 ? (
        <TextWidget 
          text="Takip edilen alışkanlık yok." 
          style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' } as TextWidgetStyle} 
        />
      ) : (
        habits.slice(0, 3).map((habit, index) => (
          <FlexWidget key={`habit-${index}`} style={itemStyle}>
            <TextWidget 
              text={habit.completed ? "🔥 " : "⭕ "} 
              style={{ fontSize: 12, marginRight: 5 } as TextWidgetStyle} 
            />
            <TextWidget 
              text={habit.title} 
              style={{ 
                color: habit.completed ? '#a855f7' : '#ffffff', 
                fontSize: 13 
              } as TextWidgetStyle} 
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}