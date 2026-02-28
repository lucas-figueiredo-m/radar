import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import {
  detectEditors,
  getPreferredEditor,
  setPreferredEditor,
  openInEditor,
} from './editors';
import { startDeviceDetection } from './deviceDetection';
import { startWebSocketServer } from './websocketServer';
import { setupAutoUpdater } from './autoUpdater';
import type { WebSocketServerHandle } from './websocketServer';
import type { RadarCommand } from '@radar/types';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
let wsHandle: WebSocketServerHandle | null = null;
let cleanupDeviceDetection: (() => void) | null = null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

const createWindow = () => {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Radar',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }
};

ipcMain.on('radar:toggle-devtools', () => {
  if (win?.webContents.isDevToolsOpened()) {
    win.webContents.closeDevTools();
  } else {
    win?.webContents.openDevTools();
  }
});

ipcMain.on(
  'radar:command',
  (_event, payload: { deviceId: string; command: RadarCommand }) => {
    wsHandle?.sendToDevice(payload.deviceId, JSON.stringify(payload.command));
  },
);

ipcMain.handle('radar:get-editor-info', () => {
  const editors = detectEditors();
  const preferred = getPreferredEditor();
  return { editors, preferred };
});

ipcMain.handle('radar:set-editor-preference', (_event, editorId: string) => {
  setPreferredEditor(editorId);
  const editors = detectEditors();
  return { editors, preferred: editorId };
});

ipcMain.handle(
  'radar:open-in-editor',
  (_event, payload: { file: string; line?: number; deviceId?: string }) => {
    const preferred = getPreferredEditor();
    if (!preferred)
      return { success: false, error: 'No editor preference set' };

    const root = payload.deviceId
      ? (wsHandle?.getDevice(payload.deviceId)?.projectRoot ?? null)
      : (wsHandle?.getFirstProjectRoot() ?? null);

    if (!root) {
      return {
        success: false,
        error: 'Project root not set. Restart the React Native app.',
      };
    }

    const absolutePath = path.join(root, payload.file);

    try {
      openInEditor(preferred, absolutePath, payload.line);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
);

app.whenReady().then(() => {
  createWindow();

  if (win) {
    const detection = startDeviceDetection(win);
    cleanupDeviceDetection = detection.cleanup;

    wsHandle = startWebSocketServer(win, detection.getDetectedDevices);
  }

  if (app.isPackaged) {
    setupAutoUpdater();
  }
});

app.on('before-quit', () => {
  cleanupDeviceDetection?.();
});

app.on('window-all-closed', () => {
  cleanupDeviceDetection?.();
  cleanupDeviceDetection = null;
  wsHandle?.close();
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
