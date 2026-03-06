import {
  patchConsole,
  patchFetch,
  patchXHR,
  installComponentTreeHook,
  createProfilerService,
  createPerformanceService,
} from './services';
import { inspectComponent } from './services/componentTree/inspectComponent';
import { createConnection } from './connection';
import { DEFAULT_HOST, DEFAULT_PORT } from './constants';
import { getDeviceInfo } from './deviceInfo';
import type { RadarCommand } from '@radar/types';
import type { RadarConfig } from './config';

export type { RadarConfig } from './config';

const reloadApp = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
    const RN = require('react-native') as Record<string, any>;
    if (RN.DevSettings?.reload) {
      RN.DevSettings.reload();
    }
  } catch {
    // Fallback: try TurboModules directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as Record<string, any>;
    const DevSettings = g.__turboModuleProxy?.('DevSettings');
    if (DevSettings?.reload) {
      DevSettings.reload();
    }
  }
};

const getProjectRoot = (config: RadarConfig): string | undefined => {
  if (config.projectRoot) return config.projectRoot;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as Record<string, any>;
  if (typeof g.__RADAR_PROJECT_ROOT__ === 'string') {
    return g.__RADAR_PROJECT_ROOT__ as string;
  }

  return undefined;
};

let initialized = false;

export const init = (config: RadarConfig = {}) => {
  if (initialized) return;
  initialized = true;

  const host = config.host ?? DEFAULT_HOST;
  const port = config.port ?? DEFAULT_PORT;
  const projectRoot = getProjectRoot(config);

  const rawDeviceInfo = getDeviceInfo();
  const deviceInfo = {
    deviceId: config.deviceId ?? rawDeviceInfo.deviceId,
    deviceName: config.deviceName ?? rawDeviceInfo.deviceName,
    platform: rawDeviceInfo.platform,
    osVersion: rawDeviceInfo.osVersion,
  };

  const { send, connect } = createConnection(
    command => handleCommand(command),
    projectRoot,
    deviceInfo,
  );

  const profiler = createProfilerService(send);
  const performanceService = createPerformanceService(send);
  const originalConsole = patchConsole(send);

  // Always start profiling eagerly to capture early commits.
  // When the WebSocket connects, Electron will send a profilingStatus
  // command — if profiling is not active, we discard the buffer.
  profiler.startProfiling();
  performanceService.start();

  const handleCommand = (command: RadarCommand) => {
    if (command.type === 'inspectComponent') {
      send(inspectComponent(command.componentId));
    } else if (command.type === 'startProfiling') {
      profiler.startProfiling();
    } else if (command.type === 'stopProfiling') {
      profiler.stopProfiling();
    } else if (command.type === 'reloadAndProfile') {
      reloadApp();
    } else if (command.type === 'profilingStatus') {
      if (!command.isProfiling) {
        profiler.discardProfiling();
      }
    }
  };

  patchFetch(send);
  patchXHR(send);
  const { addCommitListener } = installComponentTreeHook(send);
  addCommitListener(profiler.handleCommit);

  connect(host, port, originalConsole);

  originalConsole.log('[radar] devtools initialized');
};
