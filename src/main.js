/* eslint-disable global-require import/no-extraneous-dependencies */
const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const url = require('url');

let browserWindow = null;

function createWindow() {
  browserWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      experimentalFeatures: true,
    },
  });
  browserWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  browserWindow.on('closed', () => {
    browserWindow = null;
  });
}

app.on('ready', async () => {
  if (process.env.MOSEAMP_DEVTOOLS) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS,
    } = require('electron-devtools-installer');

    await installExtension(REACT_DEVELOPER_TOOLS);
    await installExtension(REDUX_DEVTOOLS);
  }

  createWindow();

  globalShortcut.register('mediaplaypause', () => {
    browserWindow.webContents.send('mediaplaypause');
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
