import type { RadarCommand } from '@radar/types';
import { ipcRenderer } from './ipc';

export const sendCommand = (deviceId: string, command: RadarCommand) => {
  ipcRenderer?.send('radar:command', { deviceId, command });
};
