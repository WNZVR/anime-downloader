import { remote } from 'electron'

class TitlebarController {
  constructor ($rootScope) {
    this._$rootScope = $rootScope

    this._$rootScope.updates = undefined
  }
  close () {
    remote.getCurrentWindow().close()
  }

  minimize () {
    remote.getCurrentWindow().minimize()
  }

  maximize () {
    const currentWindow = remote.getCurrentWindow()
    if (currentWindow.isMaximized()) {
      currentWindow.restore()
    } else {
      currentWindow.maximize()
    }
  }
}

TitlebarController.$inject = ['$rootScope']

export default TitlebarController
