import rimraf from 'rimraf'
import angular from 'angular'
import { join } from 'path'
import { remote, ipcRenderer } from 'electron'
import { existsSync, readdirSync } from 'fs'

const { Menu } = remote

class HomeController {
  constructor ($state, $mdDialog, $rootScope, AnimeService, SettingsService, DirectoryService) {
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
    if (!foundAnimes.length) return
    let updates = 0
    foundAnimes.forEach(({ episodes }) => (updates += episodes.length))
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
          .textContent('Something went wrong, press \'Refresh\' to restart the application.')
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
        onRemoving: this.refreshAnimeUpdates,
        fullscreen: false
      })
    }
  }

  downloadAnime () {
    this._$mdDialog.show({
      ariaLabel: 'Download',
      template: '<download></download>',
      parent: angular.element(document.body),
      onClosing: this.refreshAnimeUpdates,
      escapeToClose: false,
      fullscreen: false
    })
  }

  changeDirectory () {
    if (this._directoryService.change()) {
      this.reload()
    }
  }

  _remove (path, link) {
    const found = this.foundAnimes.find(anime => anime.link === link)
    if (existsSync(path)) {
      rimraf(path, error => {
        if (error) console.error(error)
        this.foundAnimes.splice(this.foundAnimes.indexOf(found), 1)
      })
    }
  }

  contextMenu (event, link) {
    const { clientX, clientY, which } = event
    if (which === 3) {
      const animePath = join(this.path, link)
      const menu = Menu.buildFromTemplate([
        {
          label: 'Delete',
          click: () => {
            if (existsSync(animePath)) {
              if (readdirSync(animePath).length) {
                const confirmation = this._$mdDialog
                  .confirm()
                  .clickOutsideToClose()
                  .title('Error')
                  .textContent(
                    'Are you sure you want to delete this anime along with it\'s contents?'
                  )
                  .ariaLabel('Alert')
                  .ok('Yes')
                  .cancel('No')

                this._$mdDialog.ahow(confirmation).then(
                  () => {
                    this._remove(animePath, link)
                  },
                  () => {}
                )
              } else this._remove(animePath, link)
            } else this._remove(animePath, link)
          }
        },
        {
          label: 'Open Folder',
          click: () => {
            this._directoryService.open(animePath)
          }
        }
      ])
      menu.popup({ x: clientX, y: clientY })
    }
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
