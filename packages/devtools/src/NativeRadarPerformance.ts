import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getMetrics(): {
    uiFps: number;
    nativeRam: number;
    cpuUsage: number;
  };
  getNativeLaunchTime(): number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RadarPerformance');
