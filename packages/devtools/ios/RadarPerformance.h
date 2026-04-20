#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RadarDevtoolsSpec/RadarDevtoolsSpec.h>

@interface RadarPerformance : NSObject <NativeRadarPerformanceSpec>
@end
#else
@interface RadarPerformance : NSObject <RCTBridgeModule>
@end
#endif
