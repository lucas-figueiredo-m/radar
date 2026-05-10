import { ipcRenderer } from './ipc';

export const openInEditor = (
  file: string,
  line?: number,
): Promise<{ success: boolean; error?: string }> =>
  ipcRenderer.invoke<{ success: boolean; error?: string }>(
    'radar:open-in-editor',
    { file, line },
  );
