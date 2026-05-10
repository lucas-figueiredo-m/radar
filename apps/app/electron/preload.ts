import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

const ALLOWED_CHANNEL_PREFIX = 'radar:';

const isAllowedChannel = (channel: unknown): channel is string =>
  typeof channel === 'string' && channel.startsWith(ALLOWED_CHANNEL_PREFIX);

type BridgeListener = (...args: unknown[]) => void;

contextBridge.exposeInMainWorld('radar', {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!isAllowedChannel(channel)) {
      return Promise.reject(new Error(`Channel "${channel}" is not allowed`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  send: (channel: string, ...args: unknown[]): void => {
    if (!isAllowedChannel(channel)) return;
    ipcRenderer.send(channel, ...args);
  },
  on: (channel: string, listener: BridgeListener): (() => void) => {
    if (!isAllowedChannel(channel)) return () => {};
    const wrapped = (_event: IpcRendererEvent, ...args: unknown[]) =>
      listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => {
      ipcRenderer.removeListener(channel, wrapped);
    };
  },
});
