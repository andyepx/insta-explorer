import {app, BrowserWindow, ipcMain} from 'electron'

const path = require('path');
const url = require('url');

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow, serverWindow;
const winURL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:9080'
    : `file://${__dirname}/index.html`;

const serverURL = process.env.NODE_ENV === 'development'
    ? `file://${path.join(process.mainModule.path, 'server/server.html')}`
    : `file://${__dirname}/server/server.html`;

function createWindow() {
    mainWindow = new BrowserWindow({
        height: 900,
        width: 1280,
        webPreferences: {
            nodeIntegrationInWorker: true,
            nodeIntegration: true
        }
    });
    mainWindow.loadURL(winURL);

    mainWindow.on('closed', () => {
        mainWindow = null;
        serverWindow = null;
    });

    serverWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            webSecurity: false,
            experimentalFeatures: true,
            nodeIntegrationInWorker: true,
            nodeIntegration: true

        }
    });
    serverWindow.loadURL(serverURL);

    ipcMain.on('web-server-config', (event, arg) => {
        mainWindow.webContents.send('web-server-config', arg);
    });

    ipcMain.on('temp-path', (event, arg) => {
        serverWindow.webContents.send('temp-path', arg);
    });

    ipcMain.on('new-port', (event, arg) => {
        serverWindow.webContents.send('new-port', arg);
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
