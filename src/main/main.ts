import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
const { menubar } = require('menubar');
const Store = require('electron-store');
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { Menubar } from 'menubar';

const store = new Store();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

let mb: Menubar;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test2: ${pingPong}`;
  console.log('@', msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

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

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mb = menubar({
    dir: resolveHtmlPath(''),
    index: resolveHtmlPath('index.html'),
    icon: process.cwd() + '/assets/logo/checkIconTemplate.png',
    browserWindow: {
      width: 300,
      height: 275,
      minWidth: 300,
      maxWidth: 300,
      minHeight: 275,
      maxHeight: 400,
      movable: true,
      useContentSize: true,
      webPreferences: {
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
      },
    },
  });

  mb.on('ready', () => {
    console.log('app is ready', store.get('items'));
    const itemsCache = store.get('items');
    mb.tray.setTitle(itemsCache ? `${itemsCache} items` : 'No action items');
  });

  // mainWindow = new BrowserWindow({
  //   show: false,
  //   width: 1024,
  //   height: 728,
  //   icon: getAssetPath('icon.png'),
  //   webPreferences: {
  //     preload: app.isPackaged
  //       ? path.join(__dirname, 'preload.js')
  //       : path.join(__dirname, '../../.erb/dll/preload.js'),
  //   },
  // });

  // mainWindow.loadURL(resolveHtmlPath('index.html'));

  // mainWindow.on('ready-to-show', () => {
  //   if (!mainWindow) {
  //     throw new Error('"mainWindow" is not defined');
  //   }
  //   if (process.env.START_MINIMIZED) {
  //     mainWindow.minimize();
  //   } else {
  //     mainWindow.show();
  //   }
  // });

  // mainWindow.on('closed', () => {
  //   mainWindow = null;
  // });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // // Open urls in the user's browser
  // mainWindow.webContents.setWindowOpenHandler((edata) => {
  //   shell.openExternal(edata.url);
  //   return { action: 'deny' };
  // });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
