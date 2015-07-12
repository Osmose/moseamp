import app from 'app';
import BrowserWindow from 'browser-window';
import ipc from 'ipc';
import Menu from 'menu';

import * as config from './config';


let mainWindow = null;
let baseHeight = 150 - 22;
let baseWidth = 300;


// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


ipc.on('resizeHeight', (event, height) => {
    // Accommodate titlebar.
    mainWindow.setSize(baseWidth, height + 22);
});


app.on('ready', function() {
    config.load();

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
