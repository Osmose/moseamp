/* eslint-disable global-require import/no-extraneous-dependencies */
const { app, BrowserWindow, globalShortcut, Menu, shell } = require('electron');
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
      nodeIntegration: true,
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

const template = [
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
    submenu: [
      { role: 'minimize' },
      { role: 'close' },
    ],
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
  template[2].submenu = [
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
}

const menu = Menu.buildFromTemplate(template);

app.on('ready', async () => {
  Menu.setApplicationMenu(menu);

  if (process.env.MOSEAMP_DEVTOOLS) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS,
    } = require('electron-devtools-installer');

    try {
      await installExtension(REACT_DEVELOPER_TOOLS);
      await installExtension(REDUX_DEVTOOLS);
    } catch (err) {
      console.error('Failed to start devtools');
      console.error(err);
    }
  }

  createWindow();

  const shortcutEvents = {
    MediaPlayPause: 'play-pause',
  };
  for (const [accelerator, eventName] of Object.entries(shortcutEvents)) {
    // eslint-disable-next-line no-loop-func
    globalShortcut.register(accelerator, () => {
      if (browserWindow) {
        browserWindow.webContents.send(eventName);
      }
    });
  }
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
