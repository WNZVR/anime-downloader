import angular from 'angular'
import { join } from 'path'
import { remote } from 'electron'
import { existsSync, unlinkSync, readdirSync } from 'fs'

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

    if (this.path && !this.animeList.length) this.reload()

    this.foundAnimes = this._animeService.foundAnimes

    this.refreshAnimeUpdates()
  }

  refreshAnimeUpdates () {
    const { foundAnimes } = this._animeService
    if (!foundAnimes.length) return
    let updates = 0
    foundAnimes.forEach(({ episodes }) => (updates += episodes.length))
    this._$rootScope.updates = updates
  }

  reload () {
    this._$state.go('load')
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
          .ariaLabel('ErrorDialog')
          .ok('OK')
      )
    } else {
      const parent = angular.element(document.querySelector('.md-fab')[0])
      this._$mdDialog.show({
        clickOutsideToClose: true,
        escapeToClose: true,
        template: '<add></add>',
        parent: angular.element(document.body),
        onRemoving: this.refreshAnimeUpdates(),
        openFrom: parent,
        closeTo: parent
      })
    }
  }

  downloadAnime () {
    this._$mdDialog.show({
      template: '<download></download>',
      parent: angular.element(document.body),
      onRemoving: this.refreshAnimeUpdates()
    })
  }

  changeDirectory () {
    if (this._directoryService.change()) {
      this.reload()
    }
  }

  contextMenu (event, link) {
    const { clientX, clientY, which } = event
    if (which === 3) {
      const menu = Menu.buildFromTemplate([
        {
          label: 'Delete',
          click: () => {
            const animePath = join(this.path, link)
            if (readdirSync(animePath).length) {
              this._$mdDialog
                .show(
                  this._$mdDialog
                    .confirm()
                    .clickOutsideToClose()
                    .title('Error')
                    .textContent('Are you sure you want to delete this anime?')
                    .ariaLabel('ErrorDialog')
                    .ok('Yes')
                    .cancel('No')
                )
                .then(() => {
                  const found = this.foundAnimes.find(a => a.link === link)
                  this.foundAnimes.splice(this.foundAnimes.indexOf(found), 1)
                  if (existsSync(animePath)) unlinkSync(animePath)
                }, () => {})
            }
          }
        },
        {
          label: 'Open Folder',
          click: () => {
            this._directoryService.open(join(this.path, link))
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
