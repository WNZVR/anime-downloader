import angular from 'angular'

import DirectoryService from './directory.service'
import SettingsService from './settings.service'
import AnimeService from './anime.service'

const moduleName = 'app.services'

angular
  .module(moduleName, [])
  .service('DirectoryService', DirectoryService)
  .service('SettingsService', SettingsService)
  .service('AnimeService', AnimeService)

export default moduleName
