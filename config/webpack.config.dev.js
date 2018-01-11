const webpack = require('webpack')
const { spawn } = require('child_process')
const { appDevPort, appDevHostname, appDist } = require('./defaults')

const publicPath = `http://${appDevHostname}:${appDevPort}/`

const baseConfig = Object.assign(
  {},
  {
    devtool: 'source-map',
    entry: ['webpack/hot/dev-server', `webpack-dev-server/client${publicPath}`],
    output: { publicPath },
    plugins: [new webpack.HotModuleReplacementPlugin()]
  },
  require('./webpack.config.base')
)

const devServer = {
  publicPath,
  port: appDevPort,
  contentBase: appDist,
  stats: 'errors-only',
  after () {
    spawn('npm', ['run', 'preview'], { shell: true, stdio: 'inherit' })
      .on('close', code => process.exit(0))
      .on('error', spawnError => {
        throw spawnError
      })
  }
}

module.exports = Object.assign({}, baseConfig, { devServer })
