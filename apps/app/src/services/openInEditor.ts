import { ipcRenderer } from './ipc';

export const openInEditor = (
  file: string,
  line?: number,
): Promise<{ success: boolean; error?: string }> =>
  ipcRenderer?.invoke('radar:open-in-editor', { file, line }) ??
  Promise.resolve({ success: false, error: 'IPC not available' });
