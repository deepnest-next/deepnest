const { app, ipcMain, BrowserWindow, screen, shell, crashReporter  } = require("electron");
const remote = require("@electron/remote/main");
const fs = require("graceful-fs");
const path = require("path");
const os = require("os");
const url = require("url");
const { loadPresets, savePreset, deletePreset } = require("./presets");
const NotificationService = require('./notification-service');
require("events").EventEmitter.defaultMaxListeners = 30;

app.on('render-process-gone', (event, webContents, details) => { console.error('Render process gone:', event, webContents, details); });

remote.initialize();

app.commandLine.appendSwitch("--enable-precise-memory-info");
crashReporter.start({ uploadToServer : false });
console.log(crashReporter.getLastCrashReport());

/*
// main menu for mac
const template = [
{
    label: 'Deepnest',
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
*/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let notificationWindow = null;
var backgroundWindows = [];
const notificationService = new NotificationService();

// single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  app.whenReady().then(() => {
    //myWindow = createWindow()
  });
}

function createMainWindow() {
  // Create the browser window.
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  var frameless = process.platform == "darwin";
  //var frameless = true;

  mainWindow = new BrowserWindow({
    width: Math.ceil(width * 0.9),
    height: Math.ceil(height * 0.9),
    frame: !frameless,
    show: false,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      nativeWindowOpen: true,
    },
  });

  remote.enable(mainWindow.webContents);

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "./main/index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  mainWindow.setMenu(null);

  // Open the DevTools.
  if (process.env["deepnest_debug"] === "1")
    mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  if (process.env.SAVE_PLACEMENTS_PATH !== undefined) {
    global.NEST_DIRECTORY = process.env.SAVE_PLACEMENTS_PATH;
  } else {
    global.NEST_DIRECTORY = path.join(os.tmpdir(), "nest");
  }
  // make sure the export directory exists
  if (!fs.existsSync(global.NEST_DIRECTORY))
    fs.mkdirSync(global.NEST_DIRECTORY);
}

function createNotificationWindow(notification) {
  if (notificationWindow) {
    notificationWindow.close();
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  notificationWindow = new BrowserWindow({
    width: 750,
    height: 500,
    parent: mainWindow,
    alwaysOnTop: true,
    type: "notification",
    center: true,
    maximizable: false,
    minimizable: false,
    resizable: false,
    modal: true,
    show: false,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true
    }
  });

  remote.enable(notificationWindow.webContents);
  notificationWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' }
  })

  notificationWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "./main/notification.html"),
      protocol: "file:",
      slashes: true
    })
  );

  notificationWindow.setMenu(null);
  // Open the DevTools.
  if (process.env["deepnest_debug"] === "1")
    notificationWindow.webContents.openDevTools();

  notificationWindow.once("ready-to-show", () => {
    notificationWindow.show();
  });

  notificationWindow.on("closed", () => {
    notificationWindow = null;
  });

  // Store the notification data for access by the renderer
  notificationWindow.notificationData = notification;
}

async function runNotificationCheck() {
  const notification = await notificationService.checkForNotifications();
  if (notification) {
    createNotificationWindow(notification);
  }
}


let winCount = 0;

function createBackgroundWindows() {
  //busyWindows = [];
  // used to have 8, now just 1 background window
  if (winCount < 1) {
    var back = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegration: true,
        nativeWindowOpen: true,
      },
    });

    remote.enable(back.webContents);

    if (process.env["deepnest_debug"] === "1") back.webContents.openDevTools();

    back.loadURL(
      url.format({
        pathname: path.join(__dirname, "./main/background.html"),
        protocol: "file:",
        slashes: true,
      })
    );

    backgroundWindows[winCount] = back;

    back.once("ready-to-show", () => {
      //back.show();
      winCount++;
      createBackgroundWindows();
    });
    back.webContents.on('render-process-gone', (event, details) => { console.error('Render process gone:', event, details); });
    back.on('render-process-gone', (event) => { console.error('Render process gone:', event); });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createMainWindow();
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    createBackgroundWindows();
    
    // Check for notifications after a short delay to ensure the app is fully loaded
    setTimeout(async () => {
      runNotificationCheck();
    }, 3000); // 3 seconds

    setInterval(async () => {
      runNotificationCheck();
    }, 30*60*1000); // every 30 minutes
  });
  mainWindow.on("closed", () => {
    app.quit();
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  app.quit();
});

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on("before-quit", function () {
  var p = path.join(__dirname, "./nfpcache");
  if (fs.existsSync(p)) {
    fs.readdirSync(p).forEach(function (file, index) {
      var curPath = p + "/" + file;
      fs.unlinkSync(curPath);
    });
  }
});

//ipcMain.on('background-response', (event, payload) => mainWindow.webContents.send('background-response', payload));
//ipcMain.on('background-start', (event, payload) => backgroundWindows[0].webContents.send('background-start', payload));

ipcMain.on("background-start", function (event, payload) {
  console.log("starting background!");
  for (var i = 0; i < backgroundWindows.length; i++) {
    if (backgroundWindows[i] && !backgroundWindows[i].isBusy) {
      backgroundWindows[i].isBusy = true;
      backgroundWindows[i].webContents.send("background-start", payload);
      break;
    }
  }
});

ipcMain.on("background-response", function (event, payload) {
  for (var i = 0; i < backgroundWindows.length; i++) {
    // todo: hack to fix errors on app closing - should instead close workers when window is closed
    try {
      if (backgroundWindows[i].webContents == event.sender) {
        mainWindow.webContents.send("background-response", payload);
        backgroundWindows[i].isBusy = false;
        break;
      }
    } catch (ex) {
      // ignore errors, as they can reference destroyed objects during a window close event
    }
  }
});

ipcMain.on("background-progress", function (event, payload) {
  // todo: hack to fix errors on app closing - should instead close workers when window is closed
  try {
    mainWindow.webContents.send("background-progress", payload);
  } catch (ex) {
    // when shutting down while processes are running, this error can occur so ignore it for now.
  }
});

ipcMain.on("background-stop", function (event) {
  for (var i = 0; i < backgroundWindows.length; i++) {
    if (backgroundWindows[i]) {
      backgroundWindows[i].destroy();
      backgroundWindows[i] = null;
    }
  }
  winCount = 0;

  createBackgroundWindows();

  console.log("stopped!", backgroundWindows);
});

// Backward compat with https://electron-settings.js.org/index.html#configure
const configPath = path.resolve(app.getPath("userData"), "settings.json");
ipcMain.handle("read-config", () => {
  return fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath).toString().replaceAll("http://convert.deepnest.io", "https://converter.deepnest.app/convert").replaceAll("https://convert.deepnest.io", "https://converter.deepnest.app/convert"))
    : {};
});
ipcMain.handle("write-config", (event, stringifiedConfig) => {
  fs.writeFileSync(configPath, stringifiedConfig);
});

ipcMain.on("login-success", function (event, payload) {
  mainWindow.webContents.send("login-success", payload);
});

ipcMain.on("purchase-success", function (event) {
  mainWindow.webContents.send("purchase-success");
});

ipcMain.on("setPlacements", (event, payload) => {
  global.exportedPlacements = payload;
});

ipcMain.on("test", (event, payload) => {
  global.test = payload;
});

ipcMain.handle("load-presets", () => {
  return loadPresets();
});

ipcMain.handle("save-preset", (event, name, config) => {
  savePreset(name, config);
});

ipcMain.handle("delete-preset", (event, name) => {
  deletePreset(name);
});

// Handle notification window events
ipcMain.on('get-notification-data', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && win.notificationData) {
    event.reply('notification-data', {
      title: win.notificationData.title,
      content: win.notificationData.content
    });
  }
});

ipcMain.on('close-notification', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && win.notificationData && win.notificationData.markAsSeen) {
    win.notificationData.markAsSeen();
  }
  
  // Close the current notification window
  if (win) {
    win.close();
  }
  
  // Check for additional notifications and show them if they exist
  setTimeout(async () => {
    const nextNotification = await notificationService.checkForNotifications();
    if (nextNotification) {
      createNotificationWindow(nextNotification);
    }
  }, 500); // Small delay to ensure clean transition
});
