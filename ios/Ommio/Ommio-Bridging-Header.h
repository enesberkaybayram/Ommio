// WidgetBridge.swift dosyanızdaki sınıfı Objective-C'ye açar
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetBridge, NSObject)
// Swift metodunun React Native tarafından erişilebilir olmasını sağlar
RCT_EXTERN_METHOD(reloadAllTimelines)
@end
