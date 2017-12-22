import scraper from 'anime-scrape'
import { resolve } from 'path'
import progress from 'request-progress'
import request from 'request'
import { remote } from 'electron'
import { createHash } from 'crypto'
import fs from 'fs'

const { app, shell } = remote
const now = (date = new Date()) => date.toTimeString().split(' ')[0]
const homePath = app.getPath('home')
const toMB = value => (value / 1024 / 1024).toFixed(2)

class DownloadController {
  constructor ($mdDialog, $scope, $rootScope, AnimeService, DirectoryService) {
    'ngInject'

    this._$mdDialog = $mdDialog
    this._$scope = $scope
    this._$rootScope = $rootScope
    this._animeService = AnimeService
    this._directoryService = DirectoryService

    this.path = this._directoryService.path
    this.displayPath = this.path.startsWith(homePath)
      ? this.path.replace(homePath, '~')
      : this.path

    const { foundAnimes } = this._animeService

    this.pendingCancel = false
    this.animes = foundAnimes.map(anime => ({
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

  clickPath () {
    return shell.openItem(this.path)
  }

  cancel () {
    this._$mdDialog.hide()
  }

  delete (target) {
    // This shouldn't happen but we'll make sure it doesn't.
    if (!this._$rootScope.isDownloading) {
      const anime = this.animes.find(({ link }) => link === target)
      if (anime) this.animes.splice(this.animes.indexOf(anime), 1)
    }
  }

  start () {
    this.path = this._directoryService.path
    if (!this._$rootScope.isDownloading) {
      this.download()
    }
  }

  stop () {
    if (!this.pendingCancel && this._$rootScope.isDownloading) {
      this.pendingCancel = true
    }
  }

  async download () {
    if (!this.animes.length) {
      this._$rootScope.isDownloading = false
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
    this._$rootScope.isDownloading = true
    const fsStream = fs.createWriteStream(episodeDir)
    const download = progress(request(downloadUrl))

    download.pipe(fsStream)

    download.on('progress', ({ percent, speed, size }) => {
      if (this.pendingCancel) {
        // TODO: find a way to make this stop button to work.
        console.log(download)
        // Resetting values back to default.
        this.animes[0].totalPercentage = 0
        this.pendingCancel = false
        this._$rootScope.isDownloading = false
        process.nextTick(() => {
          fsStream.end()
          if (fs.existsSync(episodeDir)) fs.unlinkSync(episodeDir)
        })
      }
      const downloadIndex =
        currentAnime.totalDownloads - currentAnime.episodes.length + percent
      const totalPercentage = downloadIndex / currentAnime.totalDownloads * 100
      this.animes[0] = {
        ...currentAnime,
        ...{
          totalPercentage,
          download: {
            fileSize: toMB(size.total),
            currFileSize: toMB(size.transferred),
            currDlSpeed: toMB(speed)
          }
        }
      }
      console.log(this.animes[0].totalPercentage)
      if (!this._$scope.$$phase) this._$scope.$apply()
    })

    download.on('end', () => {
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
      this._$rootScope.isDownloading = false
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
  '$rootScope',
  'AnimeService',
  'DirectoryService'
]

export default DownloadController
