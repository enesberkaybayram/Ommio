import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function Layout() {
  return (
    <>
      {/* Üstteki saat/pil göstergesini koyu renk yapar */}
      <StatusBar style="dark" /> 
      
      {/* Stack: Sayfaları üst üste dizer. 
        headerShown: false diyerek üstteki varsayılan başlığı gizliyoruz.
      */}
      <Stack screenOptions={{ headerShown: false }}>
        
        {/* Sadece index.tsx dosyanız var, bu yüzden sadece bunu tanımlıyoruz */}
        <Stack.Screen name="index" />
        
      </Stack>
    </>
  );
}