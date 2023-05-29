const electron = require('electron')
const { Menu, ipcMain } = electron
const fs = require('graceful-fs');

// Module to control application life.
const app = electron.app

app.commandLine.appendSwitch('--enable-precise-memory-info');

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const os = require('os')
const url = require('url')
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
var backgroundWindows = [];

// single instance
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // Create myWindow, load the rest of the app, etc...
  app.whenReady().then(() => {
    //myWindow = createWindow()
  })  
}

function createMainWindow() {
	
  // Create the browser window.
  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
  
  var frameless = process.platform == 'darwin';
  //var frameless = true;
  
  mainWindow = new BrowserWindow({
    width: Math.ceil(width*0.9), 
    height: Math.ceil(height*0.9), 
    frame: !frameless, 
    show: false,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,      
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './main/index.html'),
    protocol: 'file:',
    slashes: true
  }));
  
  mainWindow.setMenu(null);

  // Open the DevTools.
  if (process.env["deepnest_debug"] === '1') 
    mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  }) 

  if (process.env.SAVE_PLACEMENTS_PATH !== undefined) {
    global.NEST_DIRECTORY = process.env.SAVE_PLACEMENTS_PATH;
  } else {
    global.NEST_DIRECTORY = path.join(os.tmpdir(), "nest");
  }
  // make sure the export directory exists
  if (!fs.existsSync(global.NEST_DIRECTORY))
    fs.mkdirSync(global.NEST_DIRECTORY);
}

let winCount = 0;

function createBackgroundWindows() {
	//busyWindows = [];
	// used to have 8, now just 1 background window
	if(winCount < 1){
		var back = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegration: true
      }
		});
		
    if (process.env["deepnest_debug"] === '1') 
		  back.webContents.openDevTools();
		
		back.loadURL(url.format({
			pathname: path.join(__dirname, './main/background.html'),
			protocol: 'file:',
			slashes: true
		}));
		
		backgroundWindows[winCount] = back;
		
		back.once('ready-to-show', () => {
		  //back.show();
		  winCount++;
		  createBackgroundWindows();
		});
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // https://www.electronjs.org/docs/latest/breaking-changes#planned-breaking-api-changes-90
  app.allowRendererProcessReuse = false;
	createMainWindow();
	mainWindow.once('ready-to-show', () => {
	  mainWindow.show();
	  createBackgroundWindows();
	})
	mainWindow.on('closed', () => {
	  app.quit();
	});
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow()
  }
})

app.on('before-quit', function(){
	var p = path.join(__dirname, './nfpcache')
	  if( fs.existsSync(p) ) {
		fs.readdirSync(p).forEach(function(file,index){
		  var curPath = p + "/" + file;
		  fs.unlinkSync(curPath);
		});
	}
});

//ipcMain.on('background-response', (event, payload) => mainWindow.webContents.send('background-response', payload));
//ipcMain.on('background-start', (event, payload) => backgroundWindows[0].webContents.send('background-start', payload));

ipcMain.on('background-start', function(event, payload){
	console.log('starting background!');
	for(var i=0; i<backgroundWindows.length; i++){
		if(backgroundWindows[i] && !backgroundWindows[i].isBusy){
			backgroundWindows[i].isBusy = true;
			backgroundWindows[i].webContents.send('background-start', payload);
			break;
		}
	}
});

ipcMain.on('background-response', function(event, payload){
	for(var i=0; i<backgroundWindows.length; i++){
    // todo: hack to fix errors on app closing - should instead close workers when window is closed
    try {
		  if(backgroundWindows[i].webContents == event.sender){
		  	mainWindow.webContents.send('background-response', payload);
		   	backgroundWindows[i].isBusy = false;
		  	break;
		  }
    } catch (ex) {
      // ignore errors, as they can reference destroyed objects during a window close event
    }
	}
});

ipcMain.on('background-progress', function(event, payload){
    // todo: hack to fix errors on app closing - should instead close workers when window is closed
    try {
	  mainWindow.webContents.send('background-progress', payload);
  } catch (ex) {
    // when shutting down while processes are running, this error can occur so ignore it for now.
  }
});

ipcMain.on('background-stop', function(event){
	for(var i=0; i<backgroundWindows.length; i++){
		if(backgroundWindows[i]){
			backgroundWindows[i].destroy();
			backgroundWindows[i] = null;
		}
	}
	winCount = 0;
	
	createBackgroundWindows();
	
	console.log('stopped!', backgroundWindows);
});

ipcMain.on('login-success', function(event, payload){
	mainWindow.webContents.send('login-success', payload);
});

ipcMain.on('purchase-success', function(event){
	mainWindow.webContents.send('purchase-success');
});

ipcMain.on("setPlacements", (event, payload) => {
  global.exportedPlacements = payload;
} );

ipcMain.on("test", (event, payload) => {
  global.test = payload;
} );