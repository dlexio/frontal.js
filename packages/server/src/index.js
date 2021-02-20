const http = require('http')
const express = require('express')
const internalIp = require('internal-ip')
const consola = require('consola')
const socketServer = require('./socket')
const killable = require('killable')
const wdm = require('webpack-dev-middleware')

/**
 * An HTTP server for serving a frontal application either in development
 * or production mode.
 *
 * Usage:
 * ```
 * const server = new Server({
 *     host: 'localhost',
 *     port: 3000,
 * });
 *
 * server.start();
 * ```
 *
 * @type {Server}
 * @param config
 * @param compiler
 */
module.exports = class Server {
  constructor(frontalApp, config) {
    this.frontalApp = frontalApp

    // Apply options defaults
    this.options = Object.assign(
      {},
      {
        host: undefined,
        port: 0,
        contentBase: '/',
        base: '/',
      },
      config
    )

    // Initiate a new logger for the dev server
    this.logger = consola.create({
      // reporters: [new consola.FancyReporter()],
      // defaults: {additionalColor: 'white'}
    })

    // Auto determine a host if none was defined or fallback to localhost
    if (this.options.host === undefined) {
      const host = internalIp.v4.sync()
      this.options.host = host === undefined ? 'localhost' : host
    }

    // Initialize express application
    this.app = express()

    // Serve static files
    this.app.use(this.options.base, express.static(this.options.contentBase))
  }

  /**
   * Setup webpack development environment with HMR
   */
  setupDevEnv() {
    const compiler = this.frontalApp.webpack.compiler()

    // Initiate a new SocketServer
    this.socketServer = new socketServer(this)

    // Setup webpack-dev-middleware
    this.devMiddleware = wdm(compiler, {})
    this.app.use(this.devMiddleware)

    // Initiate the socket server if available
    if (this.socketServer !== undefined) {
      this.socketServer.start()
    }
  }

  /**
   * Starts the current express server
   *
   * @param cb - callback to trigger when the server is started
   */
  async start(cb) {
    const listenCallback = (err) => {
      // Setup development environment based on the frontal app
      if (this.frontalApp.inDevMode()) {
        this.setupDevEnv()
      }

      if (cb) {
        cb.call(err)
      }
    }

    this.httpServer = http.createServer(this.app)
    killable(this.httpServer)

    try {
      await new Promise((resolve, reject) => {
        this.httpServer.on('error', (e) => reject(e))
        this.httpServer.listen(this.options.port, this.options.host, listenCallback)
      })
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        this.logger.info(`Address \`${this.options.host}:${this.options.port}\` is in use, binding to different port.`)
        this.options.port = 0
        return this.start(cb)
      }

      if (cb) {
        cb.call(err)
      }
    }
  }

  /**
   * Returns
   */
  address() {
    const addr = this.httpServer.address()
    return `${addr.address}:${addr.port}`
  }

  /**
   * Closes the current express server
   */
  close(cb) {
    // Close the current socket server
    if (this.socketServer !== undefined) {
      this.socketServer.close()
    }

    // Close the current HTTP server
    this.httpServer.kill(() => {
      if (this.devMiddleware !== undefined) {
        this.devMiddleware.close(cb)
      }
    })
  }
}
