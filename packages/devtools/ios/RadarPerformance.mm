#import "RadarPerformance.h"

#ifdef RCT_NEW_ARCH_ENABLED

#import <QuartzCore/CADisplayLink.h>
#import <mach/mach.h>
#import <sys/sysctl.h>

@implementation RadarPerformance {
  CADisplayLink *_displayLink;
  NSUInteger _frameCount;
  CFTimeInterval _lastTimestamp;
  double _currentUiFps;
}

RCT_EXPORT_MODULE(RadarPerformance)

- (instancetype)init {
  self = [super init];
  if (self) {
    _currentUiFps = 0;
    _frameCount = 0;
    _lastTimestamp = 0;

    dispatch_async(dispatch_get_main_queue(), ^{
      self->_displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(handleFrame:)];
      [self->_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    });
  }
  return self;
}

- (void)handleFrame:(CADisplayLink *)link {
  if (_lastTimestamp == 0) {
    _lastTimestamp = link.timestamp;
    _frameCount = 0;
    return;
  }

  _frameCount++;
  CFTimeInterval elapsed = link.timestamp - _lastTimestamp;

  if (elapsed >= 1.0) {
    _currentUiFps = _frameCount / elapsed;
    _frameCount = 0;
    _lastTimestamp = link.timestamp;
  }
}

- (double)nativeRam {
  struct task_vm_info info;
  mach_msg_type_number_t count = TASK_VM_INFO_COUNT;
  kern_return_t kr = task_info(mach_task_self(), TASK_VM_INFO, (task_info_t)&info, &count);
  if (kr == KERN_SUCCESS) {
    return (double)info.phys_footprint;
  }
  return 0;
}

- (double)cpuUsage {
  thread_array_t threads;
  mach_msg_type_number_t threadCount;
  kern_return_t kr = task_threads(mach_task_self(), &threads, &threadCount);
  if (kr != KERN_SUCCESS) return 0;

  double totalUsage = 0;
  for (mach_msg_type_number_t i = 0; i < threadCount; i++) {
    thread_basic_info_data_t threadInfo;
    mach_msg_type_number_t infoCount = THREAD_BASIC_INFO_COUNT;
    kr = thread_info(threads[i], THREAD_BASIC_INFO, (thread_info_t)&threadInfo, &infoCount);
    if (kr == KERN_SUCCESS && !(threadInfo.flags & TH_FLAGS_IDLE)) {
      totalUsage += threadInfo.cpu_usage / (double)TH_USAGE_SCALE * 100.0;
    }
    mach_port_deallocate(mach_task_self(), threads[i]);
  }
  vm_deallocate(mach_task_self(), (vm_address_t)threads, threadCount * sizeof(thread_t));

  return totalUsage;
}

- (NSDictionary *)getMetrics {
  return @{
    @"uiFps": @((int)round(_currentUiFps)),
    @"nativeRam": @([self nativeRam]),
    @"cpuUsage": @([self cpuUsage]),
  };
}

- (NSNumber *)getNativeLaunchTime {
  // Get process start time via sysctl
  struct kinfo_proc info;
  size_t size = sizeof(info);
  int mib[4] = { CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid() };

  if (sysctl(mib, 4, &info, &size, NULL, 0) != 0) {
    return @(0);
  }

  struct timeval startTime = info.kp_proc.p_starttime;
  double processStartMs = startTime.tv_sec * 1000.0 + startTime.tv_usec / 1000.0;
  double nowMs = [[NSDate date] timeIntervalSince1970] * 1000.0;

  return @(nowMs - processStartMs);
}

- (void)dealloc {
  [_displayLink invalidate];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeRadarPerformanceSpecJSI>(params);
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end

#endif
