const webpack = require('webpack')
const { spawn } = require('child_process')
const base = require('./webpack.config.base')(false)
const { appDevPort, appDevHostname, appDist } = require('./defaults')

const publicPath = `http://${appDevHostname}:${appDevPort}/`

module.exports = {
  ...base,
  ...{
    devtool: 'source-map',
    entry: [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?${publicPath}`,
      ...base.entry
    ],
    output: {
      ...base.output,
      publicPath
    },
    devServer: {
      publicPath,
      port: appDevPort,
      contentBase: appDist,
      stats: 'errors-only',
      before () {
        spawn('npm', ['run', 'preview'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        })
          .on('close', code => {
            process.exit(code)
          })
          .on('error', spawnError => {
            throw spawnError
          })
      }
    },
    plugins: base.plugins.concat(new webpack.HotModuleReplacementPlugin())
  }
}
