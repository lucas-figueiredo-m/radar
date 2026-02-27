import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'node:path';
import { WebSocketServer } from 'ws';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
let wss: WebSocketServer | null;

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

function startWebSocketServer() {
  wss = new WebSocketServer({ port: WS_PORT });

  wss.on('listening', () => {
    console.log(`[radar] WebSocket server listening on port ${WS_PORT}`);
  });

  wss.on('connection', socket => {
    console.log('[radar] Client connected');
    win?.webContents.send('radar:connection', { connected: true });

    socket.on('message', data => {
      try {
        const message = JSON.parse(data.toString());
        win?.webContents.send('radar:message', message);
      } catch (err) {
        console.error('[radar] Failed to parse message:', err);
      }
    });

    socket.on('close', () => {
      console.log('[radar] Client disconnected');
      win?.webContents.send('radar:connection', { connected: false });
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

  if (app.isPackaged) {
    setupAutoUpdater();
  }
});

app.on('window-all-closed', () => {
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
