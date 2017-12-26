import * as fs from 'fs'
import * as path from 'path'
import { app, remote } from 'electron'

const userData = remote.app.getPath('userData') || app.getPath('userData')
const defaultSettings = {
  darkMode: true,
  disableHardwareAcceleration: false,
  powerSave: false
}

class SettingsService {
  constructor () {
    this._settings = new Map()

    this.config = path.join(userData, 'settings.json')

    if (!fs.existsSync(this.config)) this._resetDefault()

    this.has = (...args) => this._settings.has(...args)
    this.get = (...args) => this._settings.get(...args)
    this.set = this.set.bind(this)
    this.clear = this.clear.bind(this)
    this.delete = this.delete.bind(this)
    this.getAll = this.getAll.bind(this)

    this._load()
  }

  _resetDefault () {
    return fs.writeFileSync(
      this.config,
      JSON.stringify(defaultSettings, null, 2),
      {
        encoding: 'utf-8'
      }
    )
  }

  _load () {
    const settings = this.getAll()

    for (const key in settings) {
      this._settings.set(key, settings[key])
    }

    // Check if the user has the default settings and that it's not a modified version
    // otherwise we'll just add the missing keys in.
    Object.keys(defaultSettings).forEach(key => {
      if (!Object.keys(settings).includes(key)) {
        [this, this._settings].forEach(item => {
          item.set(key, defaultSettings[key])
        })
      }
    })
  }

  _write () {
    const settings = {};
    [...this._settings].forEach(([key, value]) => {
      settings[key] = value
    })
    console.info('[settings] write -> %o', settings)
    fs.writeFileSync(this.config, JSON.stringify(settings, null, 2), {
      encoding: 'utf-8'
    })
  }

  set (...args) {
    console.info('[settings] set -> %o', args)
    this._settings.set(...args)
    this._write()
  }

  delete (...args) {
    console.info('[settings] delete -> %o', args)
    this._settings.delete(...args)
    this._write()
  }

  clear () {
    console.info('[settings] clear')
    this._settings.clear()
    this._write()
  }

  getAll () {
    return JSON.parse(fs.readFileSync(this.config, { encoding: 'utf-8' }))
  }
}

export default SettingsService
