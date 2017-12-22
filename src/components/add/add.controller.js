import scraper from 'anime-scrape'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

class AddController {
  constructor ($mdDialog, AnimeService, DirectoryService) {
    this._$mdDialog = $mdDialog
    this._animeService = AnimeService
    this._directoryService = DirectoryService

    this.path = this._directoryService.path
    this.foundAnimes = this._animeService.foundAnimes

    const { animeList } = this._animeService

    this.animes = animeList.map(({ link, title }) => ({
      value: link,
      display: title
    }))
    this.fail = null
    this.searchTextChanged = this.resetStatus.bind(this)
    this.selectedItemChanged = this.resetStatus.bind(this)
  }

  async add () {
    if (!this.selectedItem) {
      return this.setStatus('You must have a selected anime.')
    }
    const { value } = this.selectedItem
    if (this.foundAnimes.find(({ link }) => link === value)) {
      return this.setStatus('This anime is already in your list.')
    }
    const animeDetail = await scraper.getDetail(value)
    if (!animeDetail.episodes.length) {
      return this.setStatus('This anime is not supported for download.')
    }
    this.foundAnimes.push(animeDetail)
    this._animeService.foundAnimes = this.foundAnimes
    const animeDir = join(this.path, animeDetail.link)
    if (existsSync(animeDir)) mkdirSync(animeDir)
    this.cancel()
  }

  setStatus (value) {
    this.fail = value
  }

  resetStatus () {
    this.fail = null
  }

  cancel () {
    this._$mdDialog.hide()
  }

  querySearch (query) {
    return query
      ? this.animes.filter(
        ({ display }) =>
          display.toLowerCase().indexOf(query.toLowerCase()) === 0
      )
      : this.animes
  }
}

AddController.$inject = ['$mdDialog', 'AnimeService', 'DirectoryService']

export default AddController
