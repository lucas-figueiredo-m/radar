import type { RadarCommand } from '@radar/types';
import { ipcRenderer } from './ipc';

export const sendCommand = (command: RadarCommand) => {
  ipcRenderer?.send('radar:command', command);
};
