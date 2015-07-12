var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var Menu = require('menu');


var mainWindow = null;
var baseHeight = 128;
var baseWidth = 300;


// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


ipc.on('resizeHeight', function(event, height) {
    // Accommodate titlebar.
    mainWindow.setContentSize(baseWidth, height);
});


app.on('ready', function() {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: 'MoseAmp',
            submenu: [
                {
                    label: 'Open DevTools',
                    accelerator: 'Command+K',
                    click: function() {
                      mainWindow.openDevTools({detach: true});
                    }
                },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function() {
                      app.quit();
                    }
                }
            ]
        }
    ]));

    mainWindow = new BrowserWindow({
        width: baseWidth,
        height: baseHeight,
        'use-content-size': true,
        'accept-first-mouse': true,
    });

    mainWindow.loadUrl(`file://${__dirname}/../static/index.html`);

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
