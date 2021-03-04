const path = require('path')
const fPlugin = require('@frontal/plugin')
const pagesWebpackPlugin = require('./webpack/pages-plugin')

module.exports = class PagesPlugin extends fPlugin {
  constructor(app) {
    super()
    this.app = app

    // Determine pages location
    this.opts = {
      location: this.app.config.get('pages.location', 'pages'),
      partials: this.app.config.get('pages.partials', '.partials'),
      extensions: this.app.config.get('pages.extensions', ['html']),
    }
    this.pagesDir = path.join(this.app.cwd(), this.app.context(), this.opts.location)
    this.partialsDir = path.join(this.app.cwd(), this.app.context(), this.opts.location, this.opts.partials)

    // Only apply the following watchers in dev mode
    if (this.app.inDevMode()) {
      // Register a webpack invalidator when detected pages are changed
      const pagesGlob = path.join(this.pagesDir, `**${path.sep}*.(${this.opts.extensions.join('|')})`)
      this.app.watcher.watch(pagesGlob, (eventType, file) => {
        if (eventType === 'change') {
          this.app.devServer.devMiddleware.waitUntilValid(() => {
            const pageName = file.replace(`${this.pagesDir + path.sep}`, '')
            this.app.devServer.socketServer.write(this.app.devServer.socketServer.sockets, 'page-changed', {
              name: pageName,
            })
          })
        }

        // New files won't be watched by webpack by default, so a manual invalidation is required
        if (eventType === 'add') {
          this.app.invalidate()
        }
      })

      // Emit page-changed events when partials are updated
      const partialsGlob = path.join(this.partialsDir, `**${path.sep}*.html`)
      this.app.watcher.watch(partialsGlob, (eventType) => {
        // Invalidate only when modules are updated
        this.app.invalidate()

        if (eventType === 'change') {
          this.app.devServer.devMiddleware.waitUntilValid(() => {
            this.app.devServer.socketServer.write(this.app.devServer.socketServer.sockets, 'content-changed')
          })
        }
      })
    }
  }

  webpack(config) {
    config.addModuleRule({
      test: /\.html$/i,
      use: [
        {
          loader: path.resolve(__dirname, './webpack/loaders/pages-emitter.js'),
          options: {
            app: this.app,
            pagesDir: this.pagesDir,
          },
        },
        {
          loader: path.resolve(__dirname, './webpack/loaders/apply-plugins-hooks.js'),
          options: {
            app: this.app,
            pagesDir: this.pagesDir,
          },
        },
        {
          loader: path.resolve(__dirname, './webpack/loaders/pages-format.js'),
          options: {
            app: this.app,
          },
        },
        {
          loader: path.resolve(__dirname, './webpack/loaders/pages-bundles.js'),
          options: {
            app: this.app,
            pagesDir: this.pagesDir,
          },
        },
        {
          loader: path.resolve(__dirname, './webpack/loaders/pages-load-modules.js'),
          options: {
            app: this.app,
            pagesDir: this.pagesDir,
          },
        },
        {
          loader: path.resolve(__dirname, './webpack/loaders/pages-lo-templates.js'),
          options: {
            app: this.app,
            pagesDir: this.pagesDir,
            partialsDir: this.partialsDir,
          },
        },
        {
          loader: path.resolve(__dirname, './webpack/loaders/pages-posthtml.js'),
          options: {
            app: this.app,
            pagesDir: this.pagesDir,
            partialsDir: this.partialsDir,
          },
        }
      ],
    })

    config.addPlugin(new pagesWebpackPlugin(this.app, this.pagesDir, this.opts))
  }
}
