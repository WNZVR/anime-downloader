import fs from 'fs'
import { join } from 'path'
import { remote } from 'electron'
import scraper from 'anime-scrape'

const { dialog, shell, app } = remote

class DirectoryService {
  constructor (SettingsService, AnimeService, $mdDialog) {
    this._settingsService = SettingsService
    this._animeService = AnimeService
    this._$mdDialog = $mdDialog

    this.path = this._settingsService.get('path')

    this.change = this.change.bind(this)
    this.scan = this.scan.bind(this)
  }

  open (path) {
    return shell.openItem(path)
  }

  change () {
    const directory = dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (!directory) {
      this._$mdDialog.show(
        this._$mdDialog
          .alert()
          .clickOutsideToClose()
          .title('Error')
          .textContent('Directory wasn\'t selected.')
          .ariaLabel('ErrorDialog')
          .ok('OK')
      ).then(() => {
        if (!this.path) app.quit()
      })
      return false
    }
    if (directory[0] === this.path) {
      this._$mdDialog.show(
        this._$mdDialog
          .alert()
          .clickOutsideToClose()
          .title('Error')
          .textContent('This is already your directory.')
          .ariaLabel('ErrorDialog')
          .ok('OK')
      )
      return false
    }
    this.path = directory.shift()
    this._settingsService.set('path', this.path)
    return true
  }

  async scan () {
    if (!this.path) throw new Error('"path" is missing.')
    if (!fs.existsSync(this.path)) {
      throw new Error(`The path "${this.path}" doesn't exist.`)
    }
    const foundAnimes = []
    let { animeList } = this._animeService
    animeList = animeList.map(({ link }) => link)
    const foundAnimeFolders = fs
      .readdirSync(this.path)
      .filter(
        folder =>
          fs.lstatSync(join(this.path, folder)).isDirectory() &&
          animeList.includes(folder)
      )
    if (!foundAnimeFolders.length) return foundAnimes
    const animeDetails = await Promise.all(
      foundAnimeFolders.map(folder => scraper.getDetail(folder))
    )
    animeDetails.forEach(({ link, episodes, ...details }) => {
      foundAnimes.push({
        ...details,
        ...{
          link,
          episodes: episodes.filter(
            episode =>
              !fs.existsSync(join(this.path, link, `Episode ${episode}.mp4`))
          )
        }
      })
    })

    return foundAnimes
  }
}

DirectoryService.$inject = ['SettingsService', 'AnimeService', '$mdDialog']

export default DirectoryService
