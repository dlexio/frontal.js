const is = require('is')
const chokidar = require('chokidar')

module.exports = class Watcher {
  constructor() {
    this.files = {}
  }

  watch(f, opts, cb) {
    // ignore watching if f exists in files
    if (this.files[f] !== undefined) {
      return
    }

    const optsObj =
      is.object(opts) && is.function(cb) ? opts : { ignoreInitial: true }
    const _cb = is.object(opts) && is.function(cb) ? cb : opts

    // Initiate a new watcher
    this.files[f] = chokidar.watch(f, optsObj)

    // Register callback for add, change and unlink events
    const callback = (type) => (path) => {
      _cb(type, path)
    }
    this.files[f].on('add', callback('add'))
    this.files[f].on('change', callback('change'))
    this.files[f].on('unlink', callback('unlink'))
  }

  unwatchAll() {
    const promises = []
    for (const f of Object.keys(this.files)) {
      promises.push(this.files[f].close())
    }

    return Promise.all(promises)
  }

  reset() {
    this.files = {}
  }
}
