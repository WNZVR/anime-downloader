require('dotenv-extended').load({ errorOnMissing: true })

const { join } = require('path')

const projectDir = join(__dirname, '../')

const resolveApp = args => join(projectDir, args)

module.exports = {
  appDevPort: 4200,
  appDevHostname: 'localhost',

  appTitle: 'Anime Downloader',

  appLogoPng: resolveApp('src/assets/images/icon.png'),
  appLogoNotif: resolveApp('src/assets/images/icon_notification.png'),

  appSrc: resolveApp('src'),
  appDist: resolveApp('dist'),
  appReleases: resolveApp('releases'),
  appIndexHtml: resolveApp('dist/index.html'),

  appTemplate: resolveApp('src/assets/index.ejs')
}
