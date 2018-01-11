const { format } = require('url')
const {
  appEnv,
  appIndexHtml,
  appLogoPng,
  appLogoNotif,
  appTitle
} = require('./config/defaults')
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron')

let mainWindow = null
let mainTray = null

const focusWindow = () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }
}

const createTray = () => {
  mainTray = new Tray(appLogoPng)

  mainTray.setToolTip(appTitle)

  mainTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Reload',
        click () {
          if (mainWindow) {
            mainWindow.webContents.reload()
          }
        }
      },
      {
        label: 'Toggle Developer Tools',
        click () {
          if (mainWindow) {
            mainWindow.webContents.toggleDevTools()
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Restore',
        click: focusWindow
      },
      {
        label: 'Quit',
        click () {
          app.quit()
        }
      }
    ])
  )

  mainTray.on('double-click', focusWindow)
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    width: 1152,
    height: 648,
    minWidth: 375,
    minHeight: 667,
    title: appTitle,
    icon: appLogoPng
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (!mainTray) createTray()
  })

  mainWindow.loadURL(
    format({
      pathname: appIndexHtml,
      protocol: 'file:',
      slashes: true
    })
  )
}

ipcMain.on('TRAY_ICON', (event, arg) => {
  if (mainTray) {
    mainTray.setImage(arg ? appLogoNotif : appLogoPng)
  }
})

if (app.makeSingleInstance(focusWindow)) app.quit()

app.on('ready', createWindow)

app.on('before-quit', () => {
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools()
    }
  }
})

app.on('will-quit', () => {
  if (!mainTray.isDestroyed()) {
    mainTray.destroy()
    mainTray = null
  }

  if (mainWindow) mainWindow = null
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
