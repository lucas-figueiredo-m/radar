import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  clipboard,
  session,
} from 'electron';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveEditorTarget } from './resolveEditorTarget';
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
import { startMcpServer } from '@radar/mcp';
import type { WebSocketServerHandle } from './websocketServer';
import type { McpServerHandle } from '@radar/mcp';
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
let tray: Tray | null = null;
let wsHandle: WebSocketServerHandle | null = null;
let mcpHandle: McpServerHandle | null = null;
let cleanupDeviceDetection: (() => void) | null = null;
let isQuitting = false;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const MCP_TOKEN = process.env.RADAR_MCP_TOKEN || crypto.randomUUID();

const createWindow = () => {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Radar',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== VITE_DEV_SERVER_URL && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  win.on('close', e => {
    if (!isQuitting) {
      e.preventDefault();
      win?.hide();
    }
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }
};

const createTray = () => {
  const iconPath = path.join(
    app.isPackaged ? process.resourcesPath : path.join(__dirname, '..'),
    'build',
    'icon.png',
  );
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('Radar DevTools');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Radar',
      click: () => {
        if (win) {
          win.show();
          win.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'MCP Server: Running (127.0.0.1:8348)',
      enabled: false,
    },
    {
      label: 'Copy MCP Token',
      click: () => clipboard.writeText(MCP_TOKEN),
    },
    { type: 'separator' },
    {
      label: 'Quit Radar',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (win?.isVisible()) {
      win.hide();
    } else if (win) {
      win.show();
      win.focus();
    } else {
      createWindow();
    }
  });
};

if (!app.isPackaged) {
  ipcMain.on('radar:toggle-devtools', () => {
    if (win?.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    } else {
      win?.webContents.openDevTools();
    }
  });
}

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
  (_event, storeName: string, deviceId: string) => {
    return getDatabase().state.getActions(storeName, deviceId);
  },
);

ipcMain.handle('radar:db:state:clear', (_event, deviceId: string) => {
  return getDatabase().state.clear(deviceId);
});

// Startup metrics IPC handlers
ipcMain.handle('radar:db:startup:get', (_event, deviceId: string) => {
  return getDatabase().startup.get(deviceId);
});

ipcMain.handle('radar:db:startup:clear', (_event, deviceId: string) => {
  return getDatabase().startup.clear(deviceId);
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

    const resolution = resolveEditorTarget(root, payload.file, payload.line);
    if (!resolution.ok) {
      return { success: false, error: resolution.error };
    }

    try {
      openInEditor(preferred, resolution.absolutePath, resolution.line);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
);

const CSP_HEADER_VALUE =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none';";

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    responseHeaders['Content-Security-Policy'] = [CSP_HEADER_VALUE];
    callback({ responseHeaders });
  });

  createWindow();
  createTray();

  if (win) {
    const detection = startDeviceDetection(win);
    cleanupDeviceDetection = detection.cleanup;

    const db = getDatabase();
    wsHandle = startWebSocketServer(win, detection.getDetectedDevices, db);

    mcpHandle = startMcpServer({ db, wsHandle, token: MCP_TOKEN });
  }

  if (app.isPackaged) {
    setupAutoUpdater();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  cleanupDeviceDetection?.();
});

app.on('window-all-closed', () => {
  // Don't quit — keep services alive for MCP access via system tray.
  // Actual cleanup happens in 'before-quit'.
  if (isQuitting) {
    cleanupDeviceDetection?.();
    cleanupDeviceDetection = null;
    mcpHandle?.close();
    mcpHandle = null;
    wsHandle?.close();
    closeDatabase();
    tray?.destroy();
    tray = null;
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
