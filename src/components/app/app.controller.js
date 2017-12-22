class AppController {
  constructor ($rootScope) {
    this._$rootScope = $rootScope

    this._$rootScope.animesFound = null
    this._$rootScope.path = null
  }
}

AppController.$inject = ['$rootScope']

export default AppController
