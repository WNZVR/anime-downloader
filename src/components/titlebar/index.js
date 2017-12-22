import controller from './titlebar.controller'
import './titlebar.styles.scss'

let template = null
if (process.platform === 'win32') {
  template = require('./titlebar.template.win32.html')
} else {
  template = require('./titlebar.template.other.html')
}

export default {
  controller,
  template,
  controllerAs: 'titlebar'
}
