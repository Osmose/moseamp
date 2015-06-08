let app = require('app');
let BrowserWindow = require('browser-window');

let mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({width: 1280, height: 1024});

  mainWindow.loadUrl(`file://${__dirname}/../static/index.html`);

  // Open the devtools.
  mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
