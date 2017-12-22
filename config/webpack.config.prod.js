const baseConfig = require('./webpack.config.base.js')(true)

module.exports = Object.assign(baseConfig, { stats: 'errors-only' })
