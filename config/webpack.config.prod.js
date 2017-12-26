const chalk = require('chalk')
const rimraf = require('rimraf')
const baseConfig = require('./webpack.config.base')(true)
const { appDist } = require('./defaults')
const { existsSync } = require('fs')

// We'll remove it since it creates hashes builds and there will be
// extra useless files..
if (existsSync(appDist)) {
  console.info(chalk.green('-'), `deleting "${appDist}".. `)
  rimraf(appDist, error => {
    if (error) throw error
  })
}

module.exports = baseConfig
