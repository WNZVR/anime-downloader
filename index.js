const { format } = require('url')
const {
  appIndexHtml,
  appLogoPng,
  appLogoNotif,
  appTitle
} = require('./config/defaults')
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  globalShortcut,
  dialog
} = require('electron')
const updater = require('electron-updater').autoUpdater
const logger = require('./lib/logger')('main')
const isDev = require('electron-is-dev')

// Updater initial settings
Object.assign(updater, {
  autoDownload: false,
  fullChangelog: false,
  logger: null
})

const bytesToMb = byte => parseFloat(Math.round(byte / 1024 / 1024)).toFixed(2)

let mainWindow = null
let mainTray = null

logger.info(`Is Development: ${isDev}`)

const shortchuts = (register = true) => {
  if (!register) return globalShortcut.unregisterAll()

  if (
    !globalShortcut.register('CmdOrCtrl+Shift+J', () => {
      // Make sure the window is focused when we execute the shortchut.
      if (mainWindow && mainWindow.getFocusedWindow()) {
        mainWindow.webContents.toggleDevTools()
      }
    })
  ) {
    logger.error('[hotkey] <CmdOrCtrl+Shift+J> registration failed')
  }
}

const focusWindow = () => {
  if (mainWindow) {
    !mainWindow.isMinimized() || mainWindow.restore()
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
    shortchuts()
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

app.on('ready', async () => {
  if (!isDev) {
    updater.on('checking-for-update', () => {
      logger.info('Checking for updates...')
    })

    updater.on('update-available', () => {
      // @TODO: save into a global variable that the update is available to that the user can decide
      // to download the new one or not.
      logger.info('Update is available..')
      dialog.showMessageBox(
        {
          type: 'info',
          title: 'Anime Downloader',
          message: 'Found updates, do you want to update now?',
          buttons: ['No', 'Yes']
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            return updater.downloadUpdate()
          }
          return true
        }
      )
    })

    updater.on('update-not-available', () => {
      logger.info('No updates available.')
      createWindow()
    })

    updater.on('error', error => {
      logger.error(error)

      dialog.showErrorBox(`Error: ${error ? error.stack || error : 'Unknown'}`)
    })

    updater.on(
      'download-progress',
      ({ bytesPerSecond, percent, total, transferred }) => {
        if (percent === 0) return logger.info('Download started.')
        else if (percent === 0) return logger.info('Download finished.')

        logger.info(
          `Downloading @ ${bytesToMb(
            bytesPerSecond
          )} MB/s, ${percent}%, ${bytesToMb(transferred)}/${bytesToMb(
            total
          )} MB`
        )
      }
    )

    updater.on('update-downloaded', () => {
      logger.info('Update downloaded successfully.')
      dialog.showMessageBox(
        {
          title: 'Anime Downloader',
          message: 'Updates downloaded, application will close to install..'
        },
        () => {
          setImmediate(() => updater.quitAndInstall())
        }
      )
    })

    await updater.checkForUpdates()

    return true
  }

  createWindow()
})

app.on('before-quit', () => {
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools()
    }
  }
})

app.on('will-quit', () => {
  if (mainTray && !mainTray.isDestroyed()) {
    mainTray.destroy()
    mainTray = null
  }

  if (mainWindow) {
    mainWindow = null
    shortchuts(false)
  }
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
