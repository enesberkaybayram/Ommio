import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, View, ViewStyle } from 'react-native';

const OmmioPager = forwardRef((props: {
  children: React.ReactNode;
  style?: ViewStyle;
  initialPage?: number;
  scrollEnabled?: boolean;
  onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
}, ref) => {
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [pagerWidth, setPagerWidth] = useState(() => Dimensions.get('window').width);

  useEffect(() => {
    if (Platform.OS === 'web') {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setPagerWidth(window.width); 
        });
        return () => subscription?.remove();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    setPage: (index: number) => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: index * pagerWidth, 
          y: 0,
          animated: true
        });
      }
    }
  }));

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Güvenlik kontrolü: Eğer e veya nativeEvent yoksa işlem yapma
    if (!e || !e.nativeEvent) return;

    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / pagerWidth);
    
    if (props.onPageSelected) {
      props.onPageSelected({ nativeEvent: { position: pageIndex } });
    }
  };

  return (
    <View 
        style={[{ flex: 1, overflow: 'hidden' }, props.style]}
        onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            if (width && Math.abs(pagerWidth - width) > 1) {
                setPagerWidth(width);
            }
        }}
    >
        <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={props.scrollEnabled !== false}
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ flex: 1 }}
        
        onMomentumScrollEnd={handleMomentumScrollEnd}
        
        // --- DÜZELTME BURADA ---
        // TypeScript hatasını gidermek için 'as any' ekledik.
        // Bu, "Ben ne yaptığımı biliyorum, bu tipi yoksay" demektir.
        onScrollAnimationEnd={handleMomentumScrollEnd as any} 
        >
        {React.Children.map(props.children, (child) => (
            <View style={{ width: pagerWidth, height: '100%', flex: 1 }}>
                {child}
            </View>
        ))}
        </ScrollView>
    </View>
  );
});

export default OmmioPager;