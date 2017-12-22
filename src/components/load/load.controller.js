import scraper from 'anime-scrape'
import { existsSync } from 'fs'

class LoadController {
  constructor (
    $mdDialog,
    $state,
    $rootScope,
    DirectoryService,
    AnimeService,
    SettingsService
  ) {
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
    this._$rootScope.updates = undefined

    let animeList = this._animeService.animeList
    if (!animeList.length) {
      animeList = await scraper.getList()
      this._animeService.animeList = animeList
    }
    const foundAnimes = await this._directoryService.scan()
    if (foundAnimes.length) {
      this._animeService.foundAnimes = foundAnimes
    }
    this._$state.go('home')
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
