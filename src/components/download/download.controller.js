import scraper from 'anime-scrape'
import { resolve } from 'path'
import progress from 'request-progress'
import request from 'request'
import { remote } from 'electron'
import { createHash } from 'crypto'
import fs from 'fs'

const { app, shell, powerMonitor } = remote
const now = (date = new Date()) => date.toTimeString().split(' ')[0]
const homePath = app.getPath('home')
const toMB = value => (value / 1024 / 1024).toFixed(2)

class DownloadController {
  constructor (
    $mdDialog,
    $scope,
    AnimeService,
    DirectoryService,
    SettingsService
  ) {
    'ngInject'

    this._$mdDialog = $mdDialog
    this._$scope = $scope
    this._animeService = AnimeService
    this._directoryService = DirectoryService
    this._settingsService = SettingsService

    const { foundAnimes } = this._animeService

    this.path = this._directoryService.path
    this.displayPath = this.path.startsWith(homePath)
      ? this.path.replace(homePath, '~')
      : this.path
    this.isDownloading = false
    this.pendingCancel = false
    this.animes = foundAnimes
      .filter(({ episodes }) => episodes.length)
      .map(anime => ({
        ...anime,
        ...{
          totalPercentage: 0,
          totalDownloads: anime.episodes.length,
          download: {
            fileSize: null,
            currFileSize: null,
            currDlSpeed: null
          }
        }
      }))
  }

  $onInit () {
    powerMonitor.on('suspend', () => {
      if (this.isDownloading) this.stop()
    })

    powerMonitor.on('resume', () => {
      if (!this.isDownloading) this.start()
    })
  }

  clickPath () {
    return shell.openItem(this.path)
  }

  cancel () {
    if (this.isDownloading) this.stop()
    process.nextTick(() => {
      this._$mdDialog.hide()
    })
  }

  delete (target) {
    // This shouldn't happen but we'll make sure it doesn't.
    if (!this.isDownloading) {
      const anime = this.animes.find(({ link }) => link === target)
      if (anime) this.animes.splice(this.animes.indexOf(anime), 1)
    }
  }

  start () {
    this.path = this._directoryService.path
    // This shouldn't happen but we'll make sure it doesn't.
    if (!this.isDownloading) {
      this.download()
    }
  }

  stop () {
    if (!this.pendingCancel && this.isDownloading) {
      this.pendingCancel = true
    }
  }

  resetValues () {
    // For the first anime in the list.
    this.animes[0].totalPercentage = 0
    this.animes[0].download = {
      fileSize: null,
      currFileSize: null,
      currDlSpeed: null
    }
  }

  reloadScope () {
    if (!this._$scope.$$phase) {
      this._$scope.$apply()
    }
  }

  async download () {
    if (!this.animes.length) {
      this.isDownloading = false
      return
    }
    const currentAnime = this.animes[0]
    if (!currentAnime.episodes.length) {
      this.animes.splice(0, 1)
      this.download()
      return
    }
    const { link, episodes } = currentAnime
    const downloadUrl = unescape(await scraper.getDownload(link, episodes[0]))
    const episodeDir = resolve(this.path, link, `Episode ${episodes[0]}.mp4`)
    this.isDownloading = true
    const fsStream = fs.createWriteStream(episodeDir)
    const download = progress(request(downloadUrl))

    if (!fs.existsSync(episodeDir)) fs.closeSync(fs.openSync(episodeDir, 'w'))

    download.pipe(fsStream)

    download.on('progress', ({ percent, speed, size }) => {
      if (this.pendingCancel) {
        download.abort()
        return
      }

      const downloadIndex =
        currentAnime.totalDownloads - currentAnime.episodes.length + percent
      const totalPercentage = downloadIndex / currentAnime.totalDownloads * 100

      this.animes[0].totalPercentage = totalPercentage
      this.animes[0].download = {
        fileSize: toMB(size.total),
        currFileSize: toMB(size.transferred),
        currDlSpeed: toMB(speed)
      }
      this.reloadScope()
    })

    download.on('end', () => {
      if (this.pendingCancel) {
        this.pendingCancel = false
        this.isDownloading = false
        this.resetValues()
        if (fs.existsSync(episodeDir)) fs.unlinkSync(episodeDir)
        this.reloadScope()
        return
      }
      // TODO: create an sha256 checksum, that during loading it'll verify our
      // the current download's integrity and it doesn't match we'll just delete
      // the found file, and add it as an update.
      const fileRead = fs.readFileSync(episodeDir)
      const shaChecksum = createHash('sha256')
        .update(fileRead)
        .digest()
        .toString('hex')
        .toLowerCase()
      const md5Checksum = createHash('md5')
        .update(fileRead)
        .digest()
        .toString('hex')
        .toLowerCase()
      console.log(
        `Episode ${episodes[0]} -> SHA256: ${shaChecksum}, MD5 -> ${
          md5Checksum
        }`
      )
      currentAnime.episodes.splice(0, 1)
      this.download()
    })

    download.on('error', error => {
      this.cancel()
      this.resetValues()
      this.isDownloading = false
      // We'll wait for the file stream to finish.
      process.nextTick(() => {
        fsStream.end()
        if (fs.existsSync(episodeDir)) fs.unlinkSync(episodeDir)
      })
      // We'll warn the user that something bad happened.
      console.error(`[download] ${now()} -> ${error}`)
      this._$mdDialog.show(
        this._$mdDialog
          .alert()
          .clickOutsideToClose()
          .alert()
          .title('Error')
          .textContent(
            error.startsWith('Error') ? error.substr(6, error.length) : error
          )
          .ariaLabel('ErrorDialog')
          .ok('OK')
      )
    })
  }
}

DownloadController.$inject = [
  '$mdDialog',
  '$scope',
  'AnimeService',
  'DirectoryService',
  'SettingsService'
]

export default DownloadController
