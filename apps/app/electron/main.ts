import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'node:path';
import type { WebSocket as WsWebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import {
  detectEditors,
  getPreferredEditor,
  setPreferredEditor,
  openInEditor,
} from './editors';
import { startDeviceDetection } from './deviceDetection';
import type {
  DevicePlatform,
  MetadataMessage,
  RadarCommand,
} from '@radar/types';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

type ConnectedDevice = {
  socket: WsWebSocket;
  deviceId: string;
  deviceName: string;
  platform: DevicePlatform;
  osVersion: string;
  projectRoot: string | null;
};

let win: BrowserWindow | null;
let wss: WebSocketServer | null;
let cleanupDeviceDetection: (() => void) | null = null;
let getDetectedDevices: (() => import('@radar/types').DetectedDevice[]) | null =
  null;

const connectedDevices = new Map<string, ConnectedDevice>();
const socketToDeviceId = new Map<WsWebSocket, string>();

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const WS_PORT = 8347;

function createWindow() {
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
}

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
    const device = connectedDevices.get(payload.deviceId);
    device?.socket.send(JSON.stringify(payload.command));
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

    let root: string | null = null;
    if (payload.deviceId) {
      root = connectedDevices.get(payload.deviceId)?.projectRoot ?? null;
    } else {
      for (const device of connectedDevices.values()) {
        if (device.projectRoot) {
          root = device.projectRoot;
          break;
        }
      }
    }

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

type ParsedMessage = Record<string, string | number | boolean | null>;

const isMetadataMessage = (
  message: ParsedMessage,
): message is ParsedMessage & MetadataMessage =>
  message.type === 'metadata' &&
  typeof message.deviceId === 'string' &&
  typeof message.deviceName === 'string' &&
  typeof message.platform === 'string' &&
  typeof message.osVersion === 'string';

const sendConnectedDevices = () => {
  win?.webContents.send(
    'radar:connected-devices',
    Array.from(connectedDevices.keys()),
  );
};

function startWebSocketServer() {
  wss = new WebSocketServer({ port: WS_PORT });

  wss.on('listening', () => {
    console.log(`[radar] WebSocket server listening on port ${WS_PORT}`);
  });

  wss.on('connection', socket => {
    console.log('[radar] Client connected, waiting for metadata...');

    socket.on('message', data => {
      try {
        const message = JSON.parse(data.toString()) as ParsedMessage;

        if (isMetadataMessage(message)) {
          const detected = getDetectedDevices?.() ?? [];
          const match = detected.find(
            d =>
              d.platform === message.platform &&
              d.osVersion === message.osVersion,
          );

          const resolvedDeviceId = match?.id ?? message.deviceId;

          const device: ConnectedDevice = {
            socket,
            deviceId: resolvedDeviceId,
            deviceName: match?.name ?? message.deviceName,
            platform: message.platform,
            osVersion: message.osVersion,
            projectRoot: message.projectRoot ?? null,
          };

          connectedDevices.set(resolvedDeviceId, device);
          socketToDeviceId.set(socket, resolvedDeviceId);

          console.log(
            `[radar] Device registered: ${device.deviceName} (${resolvedDeviceId})`,
          );
          console.log('[radar] Project root set to:', message.projectRoot);

          sendConnectedDevices();
          return;
        }

        const deviceId = socketToDeviceId.get(socket);
        if (deviceId) {
          const stamped = { ...message, deviceId };
          win?.webContents.send('radar:message', stamped);
        } else {
          win?.webContents.send('radar:message', message);
        }
      } catch (err) {
        console.error('[radar] Failed to parse message:', err);
      }
    });

    socket.on('close', () => {
      const deviceId = socketToDeviceId.get(socket);
      if (deviceId) {
        connectedDevices.delete(deviceId);
        socketToDeviceId.delete(socket);
        console.log(`[radar] Device disconnected: ${deviceId}`);
        sendConnectedDevices();
      } else {
        console.log('[radar] Unregistered client disconnected');
      }
    });
  });

  wss.on('error', err => {
    console.error('[radar] WebSocket server error:', err);
  });
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', info => {
    console.log('Update available:', info.version);
  });

  autoUpdater.on('update-downloaded', info => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded. Restart to apply the update.`,
        buttons: ['Restart Now', 'Later'],
      })
      .then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on('error', err => {
    console.error('Auto-updater error:', err);
  });

  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  createWindow();
  startWebSocketServer();

  if (win) {
    const detection = startDeviceDetection(win, sendConnectedDevices);
    cleanupDeviceDetection = detection.cleanup;
    getDetectedDevices = detection.getDetectedDevices;
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
  wss?.close();
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
