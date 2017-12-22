import angular from 'angular'
import uiRouter from '@uirouter/angularjs'
import ngMaterial from 'angular-material'

import './assets/style/app.scss'
import '../node_modules/angular-material/angular-material.css'

import componentsModule from './components'
import servicesModule from './services'

angular
  .module('app', [uiRouter, ngMaterial, servicesModule, componentsModule])
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    '$mdThemingProvider',
    ($stateProvider, $urlRouterProvider, $mdThemingProvider) => {
      $mdThemingProvider
        .theme('default')
        .primaryPalette('deep-purple', { default: '500' })
        .accentPalette('purple', { default: '500' })
        .dark()

      $stateProvider
        .state('load', { url: '/load', component: 'load' })
        .state('home', { url: '/home', component: 'home' })

      $urlRouterProvider.otherwise('/home')
    }
  ])
