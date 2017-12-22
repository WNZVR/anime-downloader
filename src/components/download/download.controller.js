import scraper from 'anime-scrape'
import { resolve } from 'path'
import progress from 'request-progress'
import request from 'request'
import { remote } from 'electron'
import fs from 'fs'

const { app, shell } = remote
const now = (date = new Date()) => date.toTimeString().split(' ').shift()
const homePath = app.getPath('home')

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
    console.log(target)
  }

  start () {
    this.path = this._directoryService.path
    if (!this._$rootScope.isDownloading) {
      this.download()
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
      const downloadIndex =
        currentAnime.totalDownloads - currentAnime.episodes.length + percent
      const totalPercentage = downloadIndex / currentAnime.totalDownloads * 100
      this.animes[0] = {
        ...this.animes[0],
        ...{
          totalPercentage,
          download: {
            fileSize: size.total / 1024 / 1024,
            currFileSize: size.transferred / 1024 / 1024,
            currDlSpeed: speed / 1024 / 1024
          }
        }
      }
      if (!this._$scope.$$phase) this._$scope.$apply()
    })

    download.on('end', () => {
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
      // We'll warn the user that something bad happened..
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
