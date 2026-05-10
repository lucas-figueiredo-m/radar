/* eslint-disable @typescript-eslint/no-explicit-any */
type RendererListener = (event: unknown, ...args: any[]) => void;

type RadarBridge = {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  send(channel: string, ...args: unknown[]): void;
  on(channel: string, listener: (...args: any[]) => void): () => void;
};

declare global {
  interface Window {
    radar?: RadarBridge;
  }
}

type IpcShim = {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  send(channel: string, ...args: unknown[]): void;
  on(channel: string, listener: RendererListener): void;
  removeListener(channel: string, listener: RendererListener): void;
};

const getBridge = (): RadarBridge => {
  const bridge = typeof window !== 'undefined' ? window.radar : undefined;
  if (!bridge) {
    throw new Error(
      '[radar] window.radar bridge is missing — preload script did not run',
    );
  }
  return bridge;
};

const bridge = getBridge();
const unsubscribers = new Map<RendererListener, () => void>();

export const ipcRenderer: IpcShim = {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
    return bridge.invoke<T>(channel, ...args);
  },
  send(channel: string, ...args: unknown[]): void {
    bridge.send(channel, ...args);
  },
  on(channel: string, listener: RendererListener): void {
    const unsubscribe = bridge.on(channel, (...args: unknown[]) =>
      listener({}, ...args),
    );
    unsubscribers.set(listener, unsubscribe);
  },
  removeListener(_channel: string, listener: RendererListener): void {
    const unsubscribe = unsubscribers.get(listener);
    if (unsubscribe) {
      unsubscribe();
      unsubscribers.delete(listener);
    }
  },
};
