const fs = require('fs')
const path = require('path')
const bunyan = require('bunyan')
const chalk = require('chalk')
const moment = require('moment')
const { app } = require('electron')

const userData = app.getPath('userData')

const logNames = {
  10: {
    name: 'TRACE',
    color: chalk.gray
  },
  20: {
    name: 'DEBUG',
    color: chalk.magenta
  },
  30: {
    name: ' INFO',
    color: chalk.green
  },
  40: {
    name: ' WARN',
    color: chalk.yellow
  },
  50: {
    name: 'ERROR',
    color: chalk.red
  },
  60: {
    name: 'FATAL',
    color: chalk.blueBright
  }
}

const getErrorMsg = error => (error ? `\n${error.stack || error}` : '')

class RawStream {
  write (record) {
    const level = logNames[record.level] || { name: `LEVEL-${record.level}` }

    // Make sure the message always ends with a fullstop.
    const message = record.msg.endsWith('.') ? record.msg : `${record.msg}`

    process.stdout.write(
      `[${moment(record.time).format('DD/MM/YYYY-HH:mm:ss.SSS')}] ${level.color(level.name)} <${
        record.component
      }> - ${message}\n${getErrorMsg(record.err)}`
    )
    return true
  }
}

const logger = bunyan.createLogger({
  name: 'Anime Downloader',
  serializers: bunyan.stdSerializers,
  streams: [
    {
      level: 0,
      stream: new RawStream({ limit: 100 }),
      type: 'raw'
    },
    {
      level: 0,
      path: (() => {
        const logDir = path.join(userData, 'logs')
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)
        return path.join(logDir, `anime-downloader-${moment(new Date()).format('DD-MM-YY')}.log`)
      })()
    }
  ]
})

module.exports = name => logger.child({ component: name }, true)
