import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
const { menubar } = require('menubar');
const Store = require('electron-store');
import { resolveHtmlPath } from './util';
import { Menubar } from 'menubar';

const store = new Store({ launchAtStart: true });

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let mb: Menubar;

ipcMain.on('quit-app', async (event, arg) => {
  app.quit();
});

ipcMain.on('update-count', async (event, arg) => {
  mb.tray.setTitle(arg[0] > 0 ? `${String(arg[0])} items` : 'No action items');
  store.set('items', String(arg[0]));
  event.reply('update-count', arg);
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const EXTRA_RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'extraResources')
    : path.join(__dirname, '../../extraResources');

  const getExtraAssetPath = (...paths: string[]): string => {
    return path.join(EXTRA_RESOURCES_PATH, ...paths);
  };

  mb = menubar({
    index: resolveHtmlPath('index.html'),
    icon: getExtraAssetPath('logo/checkIconTemplate.png'),
    browserWindow: {
      width: 300,
      height: 275,
      minWidth: 300,
      maxWidth: 300,
      minHeight: 275,
      maxHeight: 400,
      frame: false,
      fullscreenable: false,
      resizable: false,
      showOnAllWorkspaces: false,
      webPreferences: {
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
      },
    },
  });

  mb.on('ready', () => {
    const itemsCache = store.get('items');
    mb.tray.setTitle(itemsCache ? `${itemsCache} items` : 'No action items');
  });

  mb.on('after-hide', () => {
    mb.app.hide();
  });

  mb.on('after-create-window', () => {
    mb.app.dock.hide();
  });

  new AppUpdater();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const additionalData = { myKey: 'myValue' };
const gotTheLock = app.requestSingleInstanceLock(additionalData);

if (!gotTheLock) {
  app.quit();
}

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      app.dock.hide();
    });
    app.on('second-instance', () => {
      app.dock.hide();
    });
  })
  .catch(console.log);
