import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Spec extends TurboModule {
  getMetrics(): {
    uiFps: number;
    nativeRam: number;
    cpuUsage: number;
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>('RadarPerformance');
