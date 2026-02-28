import { patchConsole, patchFetch, installComponentTreeHook } from './services';
import { inspectComponent } from './services/componentTree/inspectComponent';
import { createConnection } from './connection';
import { DEFAULT_HOST, DEFAULT_PORT } from './constants';
import { getDeviceInfo } from './deviceInfo';
import type { RadarConfig } from './config';

export type { RadarConfig } from './config';

const getProjectRoot = (config: RadarConfig): string | undefined => {
  if (config.projectRoot) return config.projectRoot;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as Record<string, any>;
  if (typeof g.__RADAR_PROJECT_ROOT__ === 'string') {
    return g.__RADAR_PROJECT_ROOT__ as string;
  }

  return undefined;
};

export const init = (config: RadarConfig = {}) => {
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
    command => {
      if (command.type === 'inspectComponent') {
        send(inspectComponent(command.componentId));
      }
    },
    projectRoot,
    deviceInfo,
  );
  const originalConsole = patchConsole(send);

  patchFetch(send);
  installComponentTreeHook(send);
  connect(host, port, originalConsole);

  originalConsole.log('[radar] devtools initialized');
};
