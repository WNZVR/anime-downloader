const { join } = require('path')
const resolveApp = args => join(__dirname, `../${args}`)

// Intitialize Enviornments
require('./env')

module.exports = {
  // We'll only use this for electron's DevTools
  appEnv: process.env.NODE_ENV,

  appDevPort: 4200,
  appDevHostname: 'localhost',

  appTitle: 'Anime Downloader',

  appLogoPng: resolveApp('src/assets/images/icon.png'),
  appLogoNotif: resolveApp('src/assets/images/icon_notification.png'),

  appSrc: resolveApp('src'),
  appDist: resolveApp('dist'),
  appReleases: resolveApp('releases'),
  appIndexHtml: resolveApp('dist/index.html')
}
