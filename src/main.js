/* global MAIN_WINDOW_WEBPACK_ENTRY */
const {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  Menu,
  shell,
  systemPreferences,
  ipcMain,
  session,
} = require('electron');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store');
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');
const path = require('path');

setupTitlebar();

const store = new Store();
let browserWindow = null;

function createWindow() {
  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 900,
    defaultHeight: 700,
  });

  browserWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    show: false,

    frame: process.platform !== 'win32',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      experimentalFeatures: true,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true,
      preload: path.resolve(app.getAppPath(), '.webpack/main/preload.js'),
    },
  });
  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });
  browserWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  browserWindow.on('closed', () => {
    browserWindow = null;
  });

  // Monitor window for size/position changes and save them
  mainWindowState.manage(browserWindow);

  attachTitlebarToWindow(browserWindow);
}

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open Directory',
        async click() {
          const { cancelled, filePaths } = await dialog.showOpenDialog({
            title: 'Open Directory',
            buttonLabel: 'Open',
            properties: ['openDirectory'],
          });
          if (!cancelled && filePaths.length > 0) {
            browserWindow.webContents.send('openDirectory', filePaths[0]);
          }
        },
      },
      {
        label: 'Edit Config File',
        click() {
          store.openInEditor();
        },
      },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Window',
    submenu: [{ role: 'minimize' }, { role: 'close' }],
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() {
          shell.openExternal('https://github.com/Osmose/moseamp');
        },
      },
    ],
  },
];

if (process.platform === 'darwin') {
  template.unshift({
    label: 'MoseAmp',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services', submenu: [] },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  });

  // Window menu
  template[3].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    {
      label: 'Main Window',
      accelerator: 'cmd+1',
      click() {
        if (browserWindow) {
          browserWindow.focus();
        } else {
          createWindow();
        }
      },
    },
  ];
} else {
  // File menu
  template[0].submenu.push({ role: 'quit' });
}

const menu = Menu.buildFromTemplate(template);

app.on('ready', async () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src * self blob: data: gap: 'unsafe-inline' 'unsafe-eval';"],
      },
    });
  });

  ipcMain.on('get-app-path', (e) => {
    e.returnValue = app.getAppPath();
  });

  Menu.setApplicationMenu(menu);
  createWindow();

  const shortcutEvents = {
    MediaPlayPause: 'play-pause',
    ...store.get('keyboardShortcuts', {}),
  };
  for (const [accelerator, eventName] of Object.entries(shortcutEvents)) {
    // eslint-disable-next-line no-loop-func
    globalShortcut.register(accelerator, () => {
      if (browserWindow) {
        browserWindow.webContents.send(eventName);
      }
    });
  }

  ipcMain.handle('showEntryContextMenu', async () => {
    return new Promise((resolve) => {
      const entryContextMenu = Menu.buildFromTemplate([
        {
          label: 'Change icon...',
          click() {
            resolve('changeIcon');
          },
        },
        {
          label: 'Rename...',
          click() {
            resolve('rename');
          },
        },
        {
          label: 'Remove',
          click() {
            resolve('remove');
          },
        },
      ]);
      entryContextMenu.popup({
        callback() {
          resolve('cancelled');
        },
      });
    });
  });

  ipcMain.handle('getFavoriteDirectoryPath', async () => {
    return await dialog.showOpenDialog(browserWindow, {
      title: 'Add Favorite Directory',
      buttonLabel: 'Add Favorite',
      properties: ['openDirectory', 'createDirectory', 'multiSelections'],
    });
  });

  ipcMain.handle('getRenderSavePath', async (event, defaultPath) => {
    return await dialog.showSaveDialog(browserWindow, {
      title: 'Save rendered video',
      buttonLabel: 'Save',
      defaultPath,
      properties: 'showOverwriteConfirmation',
    });
  });

  ipcMain.handle('getFFmpegPath', async () => {
    return await dialog.showOpenDialog(browserWindow, {
      title: 'Select FFmpeg executable',
      buttonLabel: 'Select',
      properties: ['openFile'],
    });
  });

  // Request media keys access if necessary
  // Thanks to SoundCleod for sharing how to do this
  // https://github.com/salomvary/soundcleod/blob/13bd4e9f467debc669539ee89511e5c982017188/app/check-accessibility-permissions.js
  browserWindow.once('ready-to-show', async () => {
    if (process.platform === 'darwin' && !systemPreferences.isTrustedAccessibilityClient(false)) {
      const neverAsk = store.get('neverAskForAccessibility');
      if (neverAsk) {
        return;
      }

      const { response } = await dialog.showMessageBox({
        type: 'warning',
        message: 'Enable accessibility access',
        detail:
          'To use media keys to control playback with MoseAmp, you must add and enable it in ' +
          'the list of trusted apps in System Preferences under Security & Privacy > Accessibility.' +
          '\n\n MoseAmp must be restarted for changes to take effect.\n',
        defaultId: 0,
        cancelId: 1,
        buttons: ['Turn on accessibility', 'Not now', 'Stop asking'],
      });
      if (response === 0) {
        systemPreferences.isTrustedAccessibilityClient(true);
      } else if (response === 2) {
        store.set('neverAskForAccessibility', true);
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (browserWindow === null) {
    createWindow();
  }
});
