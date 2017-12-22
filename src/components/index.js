import angular from 'angular'

import AppComponent from './app'
import HomeComponent from './home'
import LoadComponent from './load'
import TitlebarComponent from './titlebar'
import DownloadComponent from './download'
import AddComponent from './add'

const moduleName = 'app.components'

angular
  .module(moduleName, ['ngMaterial'])
  .component('app', AppComponent)
  .component('home', HomeComponent)
  .component('download', DownloadComponent)
  .component('add', AddComponent)
  .component('titlebar', TitlebarComponent)
  .component('load', LoadComponent)

export default moduleName
