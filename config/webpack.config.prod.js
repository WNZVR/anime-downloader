const chalk = require('chalk')
const rimraf = require('rimraf')
const baseConfig = require('./webpack.config.base')
const { appDist } = require('./defaults')
const { existsSync } = require('fs')

if (process.env.NODE_ENV === 'development') process.env.NODE_ENV = 'production'

// We'll remove it since it creates hashes builds and there will be
// extra useless files..
if (existsSync(appDist)) {
  console.info(chalk.green('-'), `deleting "${appDist}".. `)
  rimraf(appDist, error => {
    if (error) throw error
  })
}

module.exports = baseConfig
