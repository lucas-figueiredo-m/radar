import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

export const setupAutoUpdater = () => {
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
};
