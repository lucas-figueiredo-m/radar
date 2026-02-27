import { patchConsole, patchFetch, installComponentTreeHook } from './services';
import { inspectComponent } from './services/componentTree/inspectComponent';
import { createConnection } from './connection';
import { DEFAULT_HOST, DEFAULT_PORT } from './constants';
import type { RadarConfig } from './config';

export type { RadarConfig } from './config';

export const init = (config: RadarConfig = {}) => {
  const host = config.host ?? DEFAULT_HOST;
  const port = config.port ?? DEFAULT_PORT;

  const { send, connect } = createConnection(command => {
    if (command.type === 'inspectComponent') {
      send(inspectComponent(command.componentId));
    }
  });
  const originalConsole = patchConsole(send);

  patchFetch(send);
  installComponentTreeHook(send);
  connect(host, port, originalConsole);

  originalConsole.log('[radar] devtools initialized');
};
