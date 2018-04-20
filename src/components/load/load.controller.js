import { existsSync } from 'fs'
import { remote } from 'electron'

class LoadController {
  constructor ($mdDialog, $state, $rootScope, DirectoryService, AnimeService, SettingsService) {
    this._$mdDialog = $mdDialog
    this._$state = $state
    this._$rootScope = $rootScope
    this._directoryService = DirectoryService
    this._animeService = AnimeService
    this._settingsService = SettingsService

    this.path = this._directoryService.path

    if (!this.path || !existsSync(this.path)) {
      this._directoryService.change()
    }

    this.init()
  }

  async init () {
    try {
      this._$rootScope.updates = undefined

      await this._animeService.updateList()

      const foundAnimes = await this._directoryService.scan()
      if (foundAnimes.length) this._animeService.foundAnimes = foundAnimes

      this._$state.go('home')
    } catch (e) {
      this._$mdDialog.show(
        this._$mdDialog
          .alert()
          .clickOutsideToClose()
          .title('Error')
          .textContent(e.message || e)
          .ariaLabel('Error')
          .ok('OK'),
      ).then(() => {
        if (remote && remote.app) remote.app.quit()
      })
    }
  }
}

LoadController.$inject = [
  '$mdDialog',
  '$state',
  '$rootScope',
  'DirectoryService',
  'AnimeService',
  'SettingsService'
]

export default LoadController
