const webpack = require('webpack')
const { spawn } = require('child_process')
const { appDevPort, appDevHostname, appDist } = require('./defaults')
const base = require('./webpack.config.base')

const publicPath = `http://${appDevHostname}:${appDevPort}/`

const baseConfig = Object.assign(
  {},
  base,
  {
    devtool: 'source-map',
    entry: [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?${publicPath}`,
      ...base.entry
    ],
    output: { ...base.output, publicPath },
    plugins: [...base.plugins, new webpack.HotModuleReplacementPlugin()]
  }
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
