import scraper from 'anime-scrape'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

class AddController {
  constructor ($mdDialog, AnimeService, DirectoryService) {
    this._$mdDialog = $mdDialog
    this._animeService = AnimeService
    this._directoryService = DirectoryService

    this.path = this._directoryService.path

    const { foundAnimes, animeList } = this._animeService
    this.foundAnimes = foundAnimes

    this.animes = animeList.map(({ link: value, title: display }) => ({ value, display }))
    this.fail = null
  }

  async add () {
    if (!this.selectedItem) return this.setStatus('You must have a selected anime.')
    const { value } = this.selectedItem
    if (this.foundAnimes.find(anime => anime.link === value)) {
      return this.setStatus('This anime is already in your list.')
    }
    try {
      const animeDetail = await scraper.getDetail(value)
      if (!animeDetail.episodes.length) {
        return this.setStatus('This anime is not supported for download.')
      }
      const animeDir = join(this.path, animeDetail.link)
      if (!existsSync(animeDir)) mkdirSync(animeDir)
      this.foundAnimes.push(animeDetail)
      this.cancel()
    } catch (e) {
      this._$mdDialog.show(
        this._$mdDialog
          .alert()
          .clickOutsideToClose()
          .title('Error')
          .textContent(e.stack || e)
          .ariaLabel('Error')
          .ok('OK')
      )
    }
  }

  cancel () {
    this._$mdDialog.hide()
  }

  querySearch (query) {
    return query
      ? this.animes.filter(
        ({ display }) => display.toLowerCase().indexOf(query.trim().toLowerCase()) !== ~0
      )
      : this.animes
  }

  setStatus (value) {
    this.fail = value
  }
}

AddController.$inject = ['$mdDialog', 'AnimeService', 'DirectoryService']

export default AddController
