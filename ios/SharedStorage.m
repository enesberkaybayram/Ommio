#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedStorage, NSObject)

RCT_EXTERN_METHOD(set:(NSString *)key value:(NSString *)value)

@end
