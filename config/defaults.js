const { join } = require('path')
const resolveApp = args => join(__dirname, `../${args}`)

module.exports = {
  // We'll let cross-env dependency decide whether the application
  // is running as production.
  appProduction: process.env.NODE_ENV === 'production',

  appDevPort: 4200,
  appDevHostname: 'localhost',

  appTitle: 'Anime Downloader',

  appLogoPng: resolveApp('src/assets/images/icon.png'),
  appLogoNotif: resolveApp('src/assets/images/icon_notification.png'),

  appSrc: resolveApp('src'),
  appDist: resolveApp('dist'),
  appIndexHtml: resolveApp('dist/index.html')
}
