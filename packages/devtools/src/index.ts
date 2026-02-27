import { patchConsole, patchFetch } from './services';
import { createConnection } from './connection';
import { DEFAULT_HOST, DEFAULT_PORT } from './constants';
import type { RadarConfig } from './config';

export type { RadarConfig } from './config';

export const init = (config: RadarConfig = {}) => {
  const host = config.host ?? DEFAULT_HOST;
  const port = config.port ?? DEFAULT_PORT;

  const { send, connect } = createConnection();
  const originalConsole = patchConsole(send);

  patchFetch(send);
  connect(host, port, originalConsole);

  originalConsole.log('[radar] devtools initialized');
};
