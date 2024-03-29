const {app, BrowserWindow, ipcMain, systemPreferences, protocol, Menu, ipcRenderer } = require('electron');
require('v8-compile-cache');
const { createWindow, getMenuAfterAuth, getMenuBeforeAuth } = require('./windows');
const { initUpdater } = require('./updater');
const i18n = require('./configs/i18next.config');
const Badge = require('electron-windows-badge');

let dev = false;
app.getLocale()
let win;
let splash;
let result;
let mainurl;
let mainev;
// Create window on electron intialization
if (process.platform === 'win32'){
    app.setAsDefaultProtocolClient('piman-discuss');

    const primaryInstance = app.requestSingleInstanceLock();
    if (!primaryInstance) {
        app.quit();
        return;
    }

// The primary instance of the application will run this code, not the new  instance
    app.on('second-instance', (event, args) => {
        if (args.slice(1) && args.slice(1)[2]){
        mainurl = args.slice(1)[2]
        if(win){
            win.webContents.send('open-window', mainurl);
            if(win.isMinimized()){
                win.restore();
            }
            win.focus();
        }
        }
    });
}

app.on('open-url', function (ev, url) {
    ev.preventDefault();
    mainev = ev; mainurl = url;
    if (app.isReady()){
        if(win){
            win.webContents.send('open-window', mainurl);
            if(win.isMinimized()){
                win.restore();
            }
            win.focus();
        }
    }
});

app.on('ready', async () => {
    i18n.on('loaded', (loaded) => {
        const lang = app.getLocale().startsWith('en') ? 'en' : app.getLocale().startsWith('fr') ? 'fr' : app.getLocale().startsWith('es') ? 'es' : 'fr'
        i18n.changeLanguage(lang);
        i18n.off('loaded');
    });

    i18n.on('languageChanged', (lng) => {
        const lang = ['en', 'fr', 'es'].includes(lng ) ? lng : 'fr';
        const templateFull = getMenuAfterAuth(win, i18n);

        const templateNotFull = getMenuBeforeAuth(win, i18n);

        Menu.setApplicationMenu(Menu.buildFromTemplate(templateNotFull));
    });
    result = await createWindow(i18n, dev);
    // console.log('result ----------------' , result);
     console.log('token ----------------' , process.env.GH_TOKEN);
    splash = result.splash;
    if (process.platform === 'win32' &&  process.argv.slice(1) &&  process.argv.slice(1)[0]){
        mainurl = process.argv.slice(1)[0]
    }
    win = result.win;
    new Badge(win, {});
    win.webContents.on('did-finish-load', () => {
        if (mainurl) {
            event.preventDefault();
           let options = {
                title: "Piman Discuss",
                modal: false,
                // parent: win,
                width: 1300,
                height: 800,
                minWidth: 500,
                minHeight: 500,
                webContents: "", // use existing webContents if provided
                show: false
            }
            let new_win = new BrowserWindow(options)
            remoteMain.enable(new_win.webContents);
            new_win.once('ready-to-show', () => {
               // new_win.webContents.send('redirect-to-url', mainurl);
                new_win.show()
                if (dev) {
                    new_win.webContents.openDevTools();
                }
            })
            // if (!options.webContents) {
            new_win.loadURL(mainurl) // existing webContents will be navigated automatically
            // }
            event.newGuest = new_win
           // win.webContents.send('redirect-to-url', mainurl);
            //mainurl = args.slice(1)[2];
            mainurl = null;
        }
    });
});


app.on('before-quit', function () {
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS specific close process
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', async () => {
    // macOS specific close process
    console.log('ONBEFOREUNLOAD -----');
    // protocol.registerSchemesAsPrivileged([
    //     { scheme: 'file', privileges: { standard: true, supportFetchAPI: true, secure: true } }
    // ]);
    if (win === null) {
        win = await createMainWindow(dev)
        new Badge(win, {});
    }
});

exports.setBadge = (count) => app.badgeCount = (count >= 0) ? count : 0;
exports.getPlatformName = () => process.platform;
exports.getVersionName = () => app.getVersion();
// AUTO UPDATER
// app.on('ready', function()  {
//   autoUpdater.checkForUpdates();
// });

ipcMain.on('get-sources', async (event) => {
    //   const has_perms = systemPreferences.getMediaAccessStatus('screen');
     // console.log('has_perms', has_perms);
       const sources = (await desktopCapturer.getSources({ types: ['screen', 'window'] }))
         .map(({ name, id, thumbnail }) => ({ name, id, thumbnail: thumbnail.toDataURL() }));
       event.reply('get-sources-reply', sources);
});

let currentStatus = null;
console.error(__dirname);
ipcMain.on('online-status-changed', (event, status) => {
    console.log('on -----');
    // console.log(status);
    if (status === 'online' && currentStatus !== 'online') {
    currentStatus = 'online';
    splash.loadURL(`file://${__dirname}/assets/splash.html?connection=1`);
    console.info(`file://${__dirname}/dist/index.html`)
    win.loadURL(`file://${__dirname}/dist/index.html`);
    // win.loadURL(`https://piman.private-discuss.com`);
    win.once('ready-to-show', async () => {
        splash.destroy();
    win.show();
    currentStatus = null;
  //  const isAllowedMicrophone = await systemPreferences.getMediaAccessStatus('microphone');
 //  const isAllowedCamera = await systemPreferences.getMediaAccessStatus('camera');
 //  console.log("MICROHPHONE ALLOWED ------" + isAllowedMicrophone);
 //   console.log("Camera ALLOWED ------" + isAllowedCamera);
    initUpdater(win);
});
} else if (status === 'offline' && currentStatus !== 'offline') {
    currentStatus = 'offline';
    splash.loadURL(`file://${__dirname}/assets/splash.html?connection=0`);
}
});

ipcMain.on('download-btn', (e, args) => {
    console.log('---- on download-btn');
    download(BrowserWindow.getFocusedWindow(), args.url)
.then(dl => {
    // console.log(dl.getSavePath());
})
.catch(console.error);
});

ipcMain.on("download", (event, info) => {
    console.log("ipcMain download triggerd");
});
