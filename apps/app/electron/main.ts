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
import { getDatabase, closeDatabase } from './database';
import type { WebSocketServerHandle } from './websocketServer';
import type { RadarCommand } from '@radar/types';
import type {
  ConsoleQueryFilter,
  NetworkQueryFilter,
  PerformanceQueryFilter,
  QueryFilter,
  StorageEntryFilter,
} from '@radar/database';

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

ipcMain.handle('radar:get-initial-state', () => ({
  connectedDeviceIds: wsHandle?.getConnectedDeviceIds() ?? [],
}));

// Database query IPC handlers
ipcMain.handle(
  'radar:db:console:query',
  (_event, filter: ConsoleQueryFilter) => {
    return getDatabase().console.query(filter);
  },
);

ipcMain.handle(
  'radar:db:console:count',
  (_event, filter: ConsoleQueryFilter) => {
    return getDatabase().console.count(filter);
  },
);

ipcMain.handle('radar:db:console:clear', (_event, deviceId: string) => {
  return getDatabase().console.clear(deviceId);
});

ipcMain.handle(
  'radar:db:network:query',
  (_event, filter: NetworkQueryFilter) => {
    return getDatabase().network.query(filter);
  },
);

ipcMain.handle(
  'radar:db:network:count',
  (_event, filter: NetworkQueryFilter) => {
    return getDatabase().network.count(filter);
  },
);

ipcMain.handle('radar:db:network:getById', (_event, id: string) => {
  return getDatabase().network.getById(id);
});

ipcMain.handle('radar:db:network:clear', (_event, deviceId: string) => {
  return getDatabase().network.clear(deviceId);
});

ipcMain.handle(
  'radar:db:componentTree:getLatest',
  (_event, deviceId: string) => {
    return getDatabase().componentTree.getLatest(deviceId);
  },
);

ipcMain.handle('radar:db:componentTree:clear', (_event, deviceId: string) => {
  return getDatabase().componentTree.clear(deviceId);
});

ipcMain.handle(
  'radar:db:profiler:getSessions',
  (_event, filter: QueryFilter) => {
    return getDatabase().profiler.getSessions(filter);
  },
);

ipcMain.handle(
  'radar:db:profiler:getCommitsBySession',
  (_event, profilerSessionId: number) => {
    return getDatabase().profiler.getCommitsBySession(profilerSessionId);
  },
);

ipcMain.handle(
  'radar:db:profiler:getLatestSession',
  (_event, deviceId: string) => {
    return getDatabase().profiler.getLatestSession(deviceId);
  },
);

ipcMain.handle('radar:db:profiler:clear', (_event, deviceId: string) => {
  return getDatabase().profiler.clear(deviceId);
});

ipcMain.handle(
  'radar:db:performance:query',
  (_event, filter: PerformanceQueryFilter) => {
    return getDatabase().performance.query(filter);
  },
);

ipcMain.handle(
  'radar:db:performance:count',
  (_event, filter: PerformanceQueryFilter) => {
    return getDatabase().performance.count(filter);
  },
);

ipcMain.handle('radar:db:performance:clear', (_event, deviceId: string) => {
  return getDatabase().performance.clear(deviceId);
});

ipcMain.handle(
  'radar:db:inspectedComponent:getByComponentId',
  (_event, deviceId: string, componentId: string) => {
    return getDatabase().inspectedComponent.getByComponentId(
      deviceId,
      componentId,
    );
  },
);

ipcMain.handle(
  'radar:db:inspectedComponent:clear',
  (_event, deviceId: string) => {
    return getDatabase().inspectedComponent.clear(deviceId);
  },
);

// Storage IPC handlers
ipcMain.handle(
  'radar:db:storage:getCapabilities',
  (_event, deviceId: string) => {
    return getDatabase().storage.getCapabilities(deviceId);
  },
);

ipcMain.handle(
  'radar:db:storage:getEntries',
  (_event, filter: StorageEntryFilter) => {
    return getDatabase().storage.getEntries(filter);
  },
);

ipcMain.handle('radar:db:storage:clear', (_event, deviceId: string) => {
  return getDatabase().storage.clear(deviceId);
});

// State management IPC handlers
ipcMain.handle('radar:db:state:getCapabilities', (_event, deviceId: string) => {
  return getDatabase().state.getCapabilities(deviceId);
});

ipcMain.handle(
  'radar:db:state:getSnapshot',
  (_event, deviceId: string, storeName: string) => {
    return getDatabase().state.getSnapshot(deviceId, storeName);
  },
);

ipcMain.handle('radar:db:state:getSnapshots', (_event, deviceId: string) => {
  return getDatabase().state.getSnapshots(deviceId);
});

ipcMain.handle(
  'radar:db:state:getActions',
  (_event, deviceId: string, storeName: string) => {
    return getDatabase().state.getActions(deviceId, storeName);
  },
);

ipcMain.handle('radar:db:state:clear', (_event, deviceId: string) => {
  return getDatabase().state.clear(deviceId);
});

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
      ? wsHandle?.getDevice(payload.deviceId)?.projectRoot ?? null
      : wsHandle?.getFirstProjectRoot() ?? null;

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

    const db = getDatabase();
    wsHandle = startWebSocketServer(win, detection.getDetectedDevices, db);
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
  closeDatabase();
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
