import rimraf from 'rimraf'
import angular from 'angular'
import { join } from 'path'
import { remote, ipcRenderer } from 'electron'
import { existsSync, readdirSync } from 'fs'

const { Menu } = remote

class HomeController {
  constructor (
    $state,
    $mdDialog,
    $rootScope,
    AnimeService,
    SettingsService,
    DirectoryService
  ) {
    'ngInject'

    this._$state = $state
    this._$mdDialog = $mdDialog
    this._$rootScope = $rootScope
    this._animeService = AnimeService
    this._settingsService = SettingsService
    this._directoryService = DirectoryService

    this.path = this._settingsService.get('path')
    this.animeList = AnimeService.animeList

    if (!this.path) this.reload()
    else if (this.path && !this.animeList.length) this.reload()

    this.foundAnimes = this._animeService.foundAnimes

    this.refreshAnimeUpdates()
  }

  refreshAnimeUpdates () {
    const { foundAnimes } = this._animeService
    let updates = 0
    if (foundAnimes.length) {
      foundAnimes.forEach(({ episodes }) => (updates += episodes.length))
    }
    ipcRenderer.send('TRAY_ICON', !!updates)
    this._$rootScope.updates = updates
  }

  reload () {
    return this._$state.go('load')
  }

  addAnime () {
    if (!this.animeList.length) {
      this._$mdDialog.show(
        this._$mdDialog
          .alert()
          .clickOutsideToClose()
          .title('Error')
          .textContent(
            'Something went wrong, press \'Refresh\' to restart the application.'
          )
          .ariaLabel('Error')
          .ok('OK')
      )
    } else {
      this._$mdDialog.show({
        ariaLabel: 'Add',
        clickOutsideToClose: true,
        escapeToClose: true,
        template: '<add></add>',
        parent: angular.element(document.body),
        onRemoving: this.refreshAnimeUpdates.bind(this),
        fullscreen: false
      })
    }
  }

  downloadAnime () {
    this._$mdDialog.show({
      ariaLabel: 'Download',
      template: '<download></download>',
      parent: angular.element(document.body),
      onClosing: this.refreshAnimeUpdates.bind(this),
      escapeToClose: false,
      fullscreen: false
    })
  }

  changeDirectory () {
    if (this._directoryService.change()) this.reload()
  }

  cleanAnime (path, link) {
    if (existsSync(path)) {
      return rimraf(path, error => {
        if (error) {
          return this._$mdDialog.show(
            this._$mdDialog
              .alert()
              .clickOutsideToClose()
              .title('Error')
              .textContent(error.stack || error)
              .ariaLabel('Error')
              .ok('OK')
          )
        }
        this.foundAnimes.splice(
          this.foundAnimes.indexOf(
            this.foundAnimes.find(anime => anime.link === link)
          ),
          1
        )
        this.refreshAnimeUpdates()
      })
    } else this.refreshAnimeUpdates()
  }

  contextMenu ({ clientX, clientY, which }, link) {
    if (which !== 3) return false
    const animePath = join(this.path, link)
    Menu.buildFromTemplate([
      {
        label: 'Delete',
        click: () => {
          if (existsSync(animePath)) {
            if (readdirSync(animePath).length) {
              const confirm = this._$mdDialog
                .confirm()
                .title('Warning')
                .textContent('Are you sure you want to delete this anime?')
                .ariaLabel('Alert')
                .ok('Yes')
                .cancel('No')
              return this._$mdDialog
                .show(confirm)
                .then(() => this.cleanAnime(animePath, link), () => {})
            }
            return this.cleanAnime(animePath, link)
          }
        }
      },
      {
        label: 'Open Folder',
        click: () => this._directoryService.open(animePath)
      }
    ]).popup({ x: clientX, y: clientY })
  }
}

HomeController.$inject = [
  '$state',
  '$mdDialog',
  '$rootScope',
  'AnimeService',
  'SettingsService',
  'DirectoryService'
]

export default HomeController
