type NativeMetrics = {
  uiFps: number | null;
  nativeRam: number | null;
  cpuUsage: number | null;
};

type MetricsResult = { uiFps: number; nativeRam: number; cpuUsage: number };
type NativeModule = { getMetrics: () => MetricsResult };

type TurboModuleRegistryLike = {
  get: (name: string) => NativeModule | null;
};

const NULL_METRICS: NativeMetrics = {
  uiFps: null,
  nativeRam: null,
  cpuUsage: null,
};

let cachedModule: NativeModule | null | undefined;

const resolveModule = (): NativeModule | null => {
  if (cachedModule !== undefined) return cachedModule;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rn = require('react-native') as {
      TurboModuleRegistry: TurboModuleRegistryLike;
    };
    cachedModule = rn.TurboModuleRegistry.get('RadarPerformance');
  } catch {
    cachedModule = null;
  }

  return cachedModule;
};

export const getNativeMetrics = (): NativeMetrics => {
  const mod = resolveModule();
  if (!mod) return NULL_METRICS;

  try {
    const { uiFps, nativeRam, cpuUsage } = mod.getMetrics();
    return { uiFps, nativeRam, cpuUsage };
  } catch {
    return NULL_METRICS;
  }
};
