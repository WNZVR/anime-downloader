class AnimeService {
  constructor ($rootDialog) {
    this._$rootDialog = $rootDialog

    this.animeList = []
    this.foundAnimes = []
    this.refreshUpdates = this.refreshUpdates.bind(this)
  }

  refreshUpdates () {
    let updates = 0
    if (this.foundAnimes.length) {
      updates = this.foundAnimes.reduce(
        (a, b) => a.episodes.length + b.episodes.length
      )
    }
    this._$rootDialog.updates = updates
  }
}

AnimeService.$inject = ['$rootScope']

export default AnimeService
