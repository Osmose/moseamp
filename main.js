const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

let browserWindow = null;

function createWindow () {
  browserWindow = new BrowserWindow({width: 400, height: 100});
  browserWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  browserWindow.on('closed', () => {
    browserWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
