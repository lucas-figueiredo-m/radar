// eslint-disable-next-line @typescript-eslint/no-explicit-any
const electron = (window as any).require?.('electron');

export const ipcRenderer = electron?.ipcRenderer;
