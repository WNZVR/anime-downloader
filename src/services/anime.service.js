import scraper from 'anime-scrape'

class AnimeService {
  animeList = []
  animeListUpdate = null

  foundAnimes = []

  updateList = async () => {
    if (
      (!this.animeList.length && this.animeListUpdate) ||
      !this.animeList.length ||
      this.animeListUpdate >= Date.now() + 1 * 60 * 60 * 1000
    ) {
      const animeList = await scraper.getList()

      for (const anime of animeList) {
        if (!this.animeList.includes(anime)) {
          this.animeList.push(anime)
        }
      }

      this.animeListUpdate = Date.now()
    }

    return this.animeList
  }
}

export default AnimeService
