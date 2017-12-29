const { readdirSync, readFileSync, lstatSync, writeFileSync, statSync } = require('fs')
const { createHash } = require('crypto')
const { appReleases } = require('../config/defaults')
const rimraf = require('rimraf')
const { join } = require('path')

const releases = readdirSync(appReleases)

releases.forEach(release => {
  const item = join(appReleases, release)
  if (lstatSync(item).isDirectory() || item.includes('blockmap')) {
    rimraf(item, error => {
      if (error) console.error(error)
    })
  } else {
    const fileData = readFileSync(item);
    ['md5', 'sha256'].forEach(algorithm => {
      const hash = createHash(algorithm)
        .update(fileData)
        .digest()
        .toString('hex')
        .toLowerCase()

      writeFileSync(join(appReleases, `${release}.${algorithm}.txt`), hash, {
        encoding: 'utf-8'
      })
    })
  }
})
