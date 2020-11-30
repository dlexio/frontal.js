const socketImpl = require('./servers/SockJSServer')

module.exports = class SocketServer {
  constructor(server) {
    this.frontalServer = server
    this.frontalApp = this.frontalServer.frontalApp
    this.sockets = []

    // Setup webpack hooks
    this.setupWebpack()
  }

  setupWebpack() {
    // Listening for events
    const invalidateSignal = () => {
      this.write(this.sockets, 'invalid')
    }

    // Register hooks for invalidation and stats signals
    // console.log('this.frontalApp.webpack.compiler()', this.frontalApp.webpack);
    this.frontalApp.webpack
      .compiler()
      .hooks.compile.tap('frontal-server', invalidateSignal)
    this.frontalApp.webpack
      .compiler()
      .hooks.invalid.tap('frontal-server', invalidateSignal)
    this.frontalApp.webpack
      .compiler()
      .hooks.done.tap('frontal-server', (stats) => {
        this._sendStats(this.sockets, this.getStats(stats))
        this._stats = stats
      })
  }

  // send stats to a socket or multiple sockets
  _sendStats(sockets, stats, force) {
    const shouldEmit =
      !force &&
      stats &&
      (!stats.errors || stats.errors.length === 0) &&
      stats.assets &&
      stats.assets.every((asset) => !asset.emitted)

    if (shouldEmit) {
      return this.write(sockets, 'still-ok')
    }

    this.write(sockets, 'hash', stats.hash)

    if (stats.errors.length > 0) {
      this.write(sockets, 'errors', stats.errors)
    } else if (stats.warnings.length > 0) {
      this.write(sockets, 'warnings', stats.warnings)
    } else {
      this.write(sockets, 'ok')
    }
  }

  write(sockets, type, data) {
    sockets.forEach((socket) => {
      this.server.send(socket, JSON.stringify({ type, data }))
    })
  }

  getStats(statsObj) {
    const stats = {
      all: false,
      hash: true,
      assets: true,
      warnings: true,
      errors: true,
      errorDetails: false,
    }

    return statsObj.toJson(stats)
  }

  start() {
    // Define socket related options to the server instance
    this.frontalServer.sockPath = '/sockjs-node'

    // Initiate a new implementation instance
    this.server = new socketImpl(this.frontalServer)

    this.server.onConnection((connection) => {
      if (!connection) {
        return
      }

      // Keep track of open sockets
      this.sockets.push(connection)

      // Delete the open socket on closure
      this.server.onConnectionClose(connection, () => {
        const idx = this.sockets.indexOf(connection)

        if (idx >= 0) {
          this.sockets.splice(idx, 1)
        }
      })

      this.write([connection], 'log-level', 'silent')
      this.write([connection], 'hot')
      this.write([connection], 'liveReload', true)
      this.write([connection], 'overlay', true)

      if (!this._stats) {
        return
      }

      this._sendStats([connection], this.getStats(this._stats), true)
    })
  }

  close() {
    this.sockets.forEach((socket) => {
      this.server.close(socket)
    })
    this.sockets = []
  }
}
