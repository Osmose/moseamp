let app = require('app');
let BrowserWindow = require('browser-window');
let Menu = require('menu');

let mainWindow = null;


// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'MoseAmp',
      submenu: [
        {
          label: 'Open DevTools',
          accelerator: 'Command+K',
          click: () => {
            mainWindow.openDevTools({detach: true});
          }
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    }
  ]));

  mainWindow = new BrowserWindow({width: 300, height: 150});

  mainWindow.loadUrl(`file://${__dirname}/../static/index.html`);

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
