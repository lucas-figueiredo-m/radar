type RadarPerformanceModule = {
  getNativeLaunchTime: () => number;
};

type TurboModuleRegistryLike = {
  get: (name: string) => RadarPerformanceModule | null;
};

let cached: number | null | undefined;

export const getNativeLaunchTime = (): number | null => {
  if (cached !== undefined) return cached;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rn = require('react-native') as {
      TurboModuleRegistry: TurboModuleRegistryLike;
    };
    const mod = rn.TurboModuleRegistry.get('RadarPerformance');
    if (mod) {
      const launchTime = mod.getNativeLaunchTime();
      cached = launchTime > 0 ? launchTime : null;
      return cached;
    }
  } catch {
    // react-native or native module not available
  }

  cached = null;
  return cached;
};
