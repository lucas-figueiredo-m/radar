import {
  patchConsole,
  patchFetch,
  patchXHR,
  installComponentTreeHook,
  createProfilerService,
  createPerformanceService,
  createStartupService,
  createStorageService,
  createStateService,
} from './services';
import { inspectComponent } from './services/componentTree/inspectComponent';
import { createConnection } from './connection';
import { DEFAULT_HOST, DEFAULT_PORT } from './constants';
import { getDeviceInfo } from './deviceInfo';
import type {
  RadarCommand,
  StorageCommand,
  StateGetCommand,
} from '@radar/types';
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

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

let initialized = false;
let startupRef: ReturnType<typeof createStartupService> | null = null;

export const markInteractive = () => {
  startupRef?.markInteractive();
};

export const init = (config: RadarConfig = {}) => {
  // Refuse to run in production builds — defense against a missing `if (__DEV__)` wrapper.
  const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
  if (dev === false) return;
  const nodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process?.env?.NODE_ENV;
  if (nodeEnv === 'production') return;

  if (initialized) return;
  initialized = true;

  const host = config.host ?? DEFAULT_HOST;
  const port = config.port ?? DEFAULT_PORT;
  const projectRoot = getProjectRoot(config);

  // Suspicious combination: unknown dev environment AND a non-loopback target.
  if (dev === undefined && !LOOPBACK_HOSTS.has(host)) {
    console.warn(
      `[radar] init() called with non-loopback host "${host}" but __DEV__ is undefined. ` +
        'This may indicate the SDK is running outside an expected dev build.',
    );
  }

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
  const startup = createStartupService(send);
  startupRef = startup;
  const storageService = createStorageService(send, config);
  const stateService = createStateService(send, config);
  const originalConsole = patchConsole(send);

  // Always start profiling eagerly to capture early commits.
  // When the WebSocket connects, Electron will send a profilingStatus
  // command — if profiling is not active, we discard the buffer.
  profiler.startProfiling();
  performanceService.start();

  const isStorageCommand = (cmd: RadarCommand): cmd is StorageCommand =>
    cmd.type === 'storageGetAll' ||
    cmd.type === 'storageSet' ||
    cmd.type === 'storageRemove' ||
    cmd.type === 'storageClear';

  const isStateCommand = (cmd: RadarCommand): cmd is StateGetCommand =>
    cmd.type === 'stateGet';

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
    } else if (isStorageCommand(command)) {
      storageService.handleCommand(command);
    } else if (isStateCommand(command)) {
      stateService.handleCommand(command);
    }
  };

  patchXHR(send);
  patchFetch(send);
  const { addCommitListener } = installComponentTreeHook(send);
  addCommitListener(profiler.handleCommit);

  connect(host, port, originalConsole);

  // Send capabilities after a short delay to ensure connection is established
  setTimeout(() => {
    storageService.sendCapabilities();
    stateService.sendCapabilities();
    stateService.sendAllSnapshots();
  }, 500);

  setTimeout(() => startup.sendWithoutTti(), 10000);

  originalConsole.log('[radar] devtools initialized');
};
