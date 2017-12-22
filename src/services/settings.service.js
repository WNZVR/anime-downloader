import * as fs from 'fs'
import * as path from 'path'
import { app, remote } from 'electron'

const userData = remote.app.getPath('userData') || app.getPath('userData')

class SettingsService {
  constructor () {
    this._settings = new Map()

    this.config = path.join(userData, 'settings.json')

    if (!fs.existsSync(this.config)) {
      fs.writeFileSync(this.config, '{}', { encoding: 'utf-8' })
    }

    this.has = (...args) => this._settings.has(...args)
    this.get = (...args) => this._settings.get(...args)
    this.set = this.set.bind(this)
    this.clear = this.clear.bind(this)
    this.delete = this.delete.bind(this)
    this.getAll = this.getAll.bind(this)

    this._load()
  }

  _load () {
    const settings = this.getAll()
    for (const key in settings) this._settings.set(key, settings[key])
  }

  _write () {
    const settings = {}
    ;[...this._settings].forEach(([key, value]) => { settings[key] = value })
    console.log('Settings (write) ->', settings)
    fs.writeFileSync(this.config, JSON.stringify(settings, null, 2), { encoding: 'utf-8' })
  }

  set (...args) {
    console.info('Settings (set) ->', args)
    this._settings.set(...args)
    this._write()
  }

  delete (...args) {
    console.info('Settings (delete) ->', args)
    this._settings.delete(...args)
    this._write()
  }

  clear () {
    console.info('Settings (clear)')
    this._settings.clear()
    this._write()
  }

  getAll () { return JSON.parse(fs.readFileSync(this.config, { encoding: 'utf-8' })) }
}

export default SettingsService
