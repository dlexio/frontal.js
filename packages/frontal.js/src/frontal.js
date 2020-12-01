const is = require('is')
const path = require('path')
const consola = require('consola')
const webpack = require('@frontal/webpack')
const fPlugin = require('@frontal/plugin')
const Server = require('@frontal/server')
const Watcher = require('./watcher')

module.exports = class Frontal {
  /**
   * Initiate a new frontal application with basic options
   *
   * @param options - Location and mode options
   * @param config Config - Configuration instance
   */
  constructor(config, options) {
    const cwd = process.cwd()
    this.options = Object.assign(
      {},
      {
        context: '.',
        cwd,
        devMode: false,
      },
      options
    )

    this.watcher = new Watcher()

    this.config = config

    this.logger = consola.create({
      reporters: [new consola.FancyReporter()],
      defaults: {
        additionalColor: 'white',
      },
    })
  }

  /**
   * Returns the current working directory
   *
   * @returns {*}
   */
  cwd() {
    return this.options.cwd
  }

  /**
   * Application name is the current working directory's name
   */
  name() {
    const cwd = this.cwd()
    return path.basename(cwd)
  }

  /**
   * Returns the path of the application's directory
   *
   * @returns {*}
   */
  context() {
    return this.options.context
  }

  /**
   * Returns the full path of the public directory
   */
  public() {
    return path.join(this.cwd(), this.context(), this.config.get('server.public'))
  }

  /**
   * Returns true if app is in development mode
   *
   * @returns {boolean}
   */
  inDevMode() {
    return this.options.devMode === true
  }

  /**
   * Setup plugins by walking through the config's plugins then
   * initiating each plugin instance and passing the initiated plugin
   * instance to the this frontal app instance.
   */
  setupPlugins() {
    this.plugins = []

    for (let plugin of this.config.get('plugins')) {
      let module
      let opts = {}

      // ignore plugin item if not an object or a string
      if (!is.object(plugin) && !is.string(plugin)) {
        continue
      }

      // if plugin is of type string, reset it to an object
      if (is.string(plugin)) {
        plugin = {
          plugin,
          opts: {},
        }
      }

      try {
        module = require(plugin.plugin)
        opts = plugin.options !== undefined ? plugin.options : {}

        // Fail if the plugin is not extending @frontal/plugin
        if (!(module.prototype instanceof fPlugin)) {
          this.logger.error(`\`${plugin.plugin}\` is not a valid Frontal plugin.`)
        }

        this.plugins.push(new module(this, opts))
      } catch (e) {
        this.logger.error(`\`${plugin.plugin}\` failed to load Frontal plugin due to: ${e.message}`)
      }
    }
  }

  /**
   * The start method does the following:
   * - creates a development server using express
   * - uses webpack-dev-middleware
   * - creates watchers of .html files to trigger reloads
   * - creates websockets and attaches them in order to enable auto-reloads on file changes
   */
  start(cb) {
    this.logger.info('Initializing Frontal Application!')

    // Initiate plugins
    this.setupPlugins()

    // Initiate a new webpack instance
    this.webpack = new webpack(this)

    // Initiate a new dev server
    this.devServer = new Server(this, {
      host: this.config.get('server.host'),
      port: this.config.get('server.port'),
      contentBase: this.public(),
    })

    // Start development server
    this._startServer(this.devServer, cb)

    // Watch config for changes and restart or invalidate accordingly
    this.config.onChange((before, after, diff) => {
      // Restart the entire development server if changes requires it to:
      // @todo the following array that identifies which config props requires a restart should be provided via a hook that plugins can tell on their own
      //       which properties requires a restart
      if (Object.keys(diff).some((r) => ['server', 'build', 'pages', 'plugins', 'icons'].includes(r))) {
        this.logger.info('Restarting development server')
        this.restart()
      } else {
        this.invalidate(() => {
          this.devServer.socketServer.write(this.devServer.socketServer.sockets, 'content-changed', { target: '*' })
        })
      }
    })
  }

  /**
   * Starts a production server
   */
  serve() {
    // Initiate a new server
    const server = new Server(this, {
      host: this.config.get('server.host'),
      port: this.config.get('server.port'),
      contentBase: path.join(this.cwd(), this.config.get('build.path')),
    })

    this._startServer(server)
  }

  /**
   * Start the given server instance
   *
   * @param server
   * @private
   */
  _startServer(server, cb) {
    server.start((err) => {
      if (err) {
        this.logger.error(`Application server failed to start due to:`, err)
      } else {
        const addr = `http://${server.address()}`
        const broadcastMsg = `Your application is running at: \`${addr}\`.`

        // Call out server address after initial build
        if (this.inDevMode()) {
          server.devMiddleware.waitUntilValid(() => {
            this.logger.success(broadcastMsg)
          })
        } else {
          this.logger.success(broadcastMsg)
        }

        if (cb) {
          cb(addr)
        }
      }
    })
  }

  /**
   * Restarts the current frontal app by closing the current server
   */
  restart() {
    this.watcher.unwatchAll().then()
    this.watcher.reset()

    this.devServer.close()
    this.plugins = []
    this.webpack = undefined
    this.devServer = undefined

    this.start()
  }

  /**
   * Restarts the build process of webpack
   */
  invalidate(cb) {
    this.devServer.devMiddleware.invalidate(cb)
  }

  /**
   * builds an application for production use
   *
   * @returns {Promise<void>}
   */
  build() {
    return new Promise((resolve, reject) => {
      this.logger.info('Initializing Frontal Application!')

      // Initiate plugins
      this.setupPlugins()

      // Initiate a new webpack instance
      this.webpack = new webpack(this)

      // Run the compiler
      this.webpack.run((err) => {
        if (err) {
          reject(err)
        } else {
          // Print out build errors from stats if any available
          // console.log(stats.hasErrors);

          // this.logger.success('Application was built successfully!');
          resolve()
        }
      })
    })
  }
}
