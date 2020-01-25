const { app, BrowserWindow, globalShortcut, Menu, shell } = require('electron');
const windowStateKeeper = require('electron-window-state');


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
    },
  });
  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });
  browserWindow.loadFile('build/index.html');

  browserWindow.on('closed', () => {
    browserWindow = null;
  });

  // Monitor window for size/position changes and save them
  mainWindowState.manage(browserWindow);
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
} else {
  template.unshift({
    label: 'File',
    submenu: [
      { role: 'quit' },
    ],
  });
}

const menu = Menu.buildFromTemplate(template);

app.on('ready', async () => {
  Menu.setApplicationMenu(menu);
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
