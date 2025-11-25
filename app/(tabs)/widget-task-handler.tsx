import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface WidgetData {
  completedCount: number;
  totalCount: number;
  topTasks: Array<{ text: string; completed: boolean }>;
}

export async function widgetTaskHandler(props: WidgetData) {
  const { completedCount, totalCount, topTasks } = props;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#1e293b', 
        borderRadius: 16,
        flexDirection: 'column',
        padding: 12,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="Ommio"
          style={{
            fontSize: 18,
            fontFamily: 'Inter',
            fontWeight: 'bold',
            color: '#7c3aed',
          }}
        />
        <TextWidget
          text={`${completedCount}/${totalCount}`}
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        />
      </FlexWidget>

      <TextWidget
        text="Bugünün Durumu"
        style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}
      />

      {topTasks.map((task, index) => (
        <FlexWidget
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
            backgroundColor: '#334155',
            borderRadius: 8,
            padding: 6,
          }}
        >
          <FlexWidget
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: task.completed ? '#10b981' : '#f97316', 
              marginRight: 8,
            }}
          />
          <TextWidget
            text={task.text}
            style={{
              fontSize: 12,
              color: '#ffffff',
              fontWeight: 'bold',
              // textDecorationLine özelliği kaldırıldı
            }}
          />
        </FlexWidget>
      ))}

      {topTasks.length === 0 && (
        <TextWidget
          text="Bugün için plan yok."
          style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}
        />
      )}
    </FlexWidget>
  );
}