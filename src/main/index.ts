import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import remote from '@electron/remote/main'
import { join, resolve as pathResolve } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import url from 'node:url'
import os from 'node:os'
import fs from 'graceful-fs'

remote.initialize()

app.commandLine.appendSwitch('--enable-precise-memory-info')

type BackgroundWindow = BrowserWindow & { isBusy: boolean }
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null
const backgroundWindows: BackgroundWindow[] = []

// single instance
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
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

function createWindow(): void {
  // Create the browser window.
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const frameless = process.platform == 'darwin'
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: Math.ceil(width * 0.9),
    height: Math.ceil(height * 0.9),
    title: 'deepnest-next - Nesting for Laser Cutters',
    frame: !frameless,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      contextIsolation: false,
      defaultEncoding: 'UTF-8',
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  remote.enable(mainWindow.webContents)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    createBackgroundWindows()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    console.log('setWindowOpenHandler', details)
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  console.log('is.dev', is.dev)
  console.log('process.env.ELECTRON_RENDERER_URL', process.env['ELECTRON_RENDERER_URL'])
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // and load the index.html of the app.
    mainWindow.loadURL(
      url.format({
        pathname: join(__dirname, '../renderer/index.html'),
        protocol: 'file:',
        slashes: true
      })
    )
  }

  mainWindow.setMenu(null)

  // Open the DevTools.
  if (process.env['deepnest_debug'] === '1') mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    console.log('mainWindow closed')
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    closeBackgroundWindows()
    mainWindow = null
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  if (process.env.SAVE_PLACEMENTS_PATH !== undefined) {
    global.NEST_DIRECTORY = process.env.SAVE_PLACEMENTS_PATH
  } else {
    global.NEST_DIRECTORY = join(os.tmpdir(), 'nest')
  }
  // make sure the export directory exists
  if (!fs.existsSync(global.NEST_DIRECTORY)) fs.mkdirSync(global.NEST_DIRECTORY)
}

let winCount = 0

function closeBackgroundWindows(): void {
  for (let i = 0; i < backgroundWindows.length; i++) {
    if (backgroundWindows[i]) {
      backgroundWindows[i].destroy()
      delete backgroundWindows[i]
    }
  }
}

function createBackgroundWindows(): void {
  //busyWindows = [];
  // used to have 8, now just 1 background window
  if (winCount < 1) {
    const back = new BrowserWindow({
      show: is.dev && process.env['deepnest_debug'] === '1',
      width: 200,
      height: 200,
      closable: false,
      title: 'deepnest-nest - backend',
      webPreferences: {
        contextIsolation: false,
        defaultEncoding: 'UTF-8',
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        nodeIntegrationInSubFrames: true,
        preload: join(__dirname, '../preload/backend.js'),
        sandbox: false
      }
    }) as BackgroundWindow

    remote.enable(back.webContents)
    back.setMenu(null)

    if (process.env['deepnest_debug'] === '1') back.webContents.openDevTools()

    // HMR for renderer base on electron-vite cli.
    console.log('is.dev', is.dev)
    console.log('process.env.ELECTRON_RENDERER_URL', process.env['ELECTRON_RENDERER_URL'])
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      back.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/backend.html')
    } else {
      // and load the index.html of the app.
      back.loadURL(
        url.format({
          pathname: join(__dirname, '../renderer/backend.html'),
          protocol: 'file:',
          slashes: true
        })
      )
    }

    backgroundWindows[winCount] = back

    back.once('ready-to-show', () => {
      //back.show();
      winCount++
      createBackgroundWindows()
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('net.deepnest.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', function () {
  const p = join(__dirname, './nfpcache')
  if (fs.existsSync(p)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fs.readdirSync(p).forEach(function (file, _index) {
      const curPath = join(p, file)
      fs.unlinkSync(curPath)
    })
  }
})

ipcMain.on('background-start', function (_event, payload) {
  console.log('starting background!')
  for (let i = 0; i < backgroundWindows.length; i++) {
    if (backgroundWindows[i] && !backgroundWindows[i].isBusy) {
      backgroundWindows[i].isBusy = true
      backgroundWindows[i].webContents.send('background-start', payload)
      break
    }
  }
})

ipcMain.on('background-response', function (event, payload) {
  for (let i = 0; i < backgroundWindows.length; i++) {
    // todo: hack to fix errors on app closing - should instead close workers when window is closed
    try {
      if (backgroundWindows[i].webContents == event.sender) {
        mainWindow?.webContents.send('background-response', payload)
        backgroundWindows[i].isBusy = false
        break
      }
    } catch (ex) {
      // ignore errors, as they can reference destroyed objects during a window close event
    }
  }
})

ipcMain.on('background-progress', function (_event, payload) {
  // todo: hack to fix errors on app closing - should instead close workers when window is closed
  try {
    mainWindow?.webContents.send('background-progress', payload)
  } catch (ex) {
    // when shutting down while processes are running, this error can occur so ignore it for now.
  }
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ipcMain.on('background-stop', function (_event) {
  for (let i = 0; i < backgroundWindows.length; i++) {
    if (backgroundWindows[i]) {
      backgroundWindows[i].destroy()
      delete backgroundWindows[i]
    }
  }
  winCount = 0

  createBackgroundWindows()

  console.log('stopped!', backgroundWindows)
})

// Backward compat with https://electron-settings.js.org/index.html#configure
const configPath = pathResolve(app.getPath('userData'), 'settings.json')
ipcMain.handle('read-config', () => {
  return fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath).toString()) : {}
})
ipcMain.handle('write-config', (_event, stringifiedConfig) => {
  fs.writeFileSync(configPath, stringifiedConfig)
})

ipcMain.on('login-success', function (_event, payload) {
  mainWindow?.webContents.send('login-success', payload)
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ipcMain.on('purchase-success', function (_event) {
  mainWindow?.webContents.send('purchase-success')
})

ipcMain.on('setPlacements', (_event, payload) => {
  global.exportedPlacements = payload
})

ipcMain.on('test', (_event, payload) => {
  global.test = payload
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
