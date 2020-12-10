const path = require('path')
const fs = require('fs')
const is = require('is')
const fPlugin = require('@frontal/plugin')
const library = require('./library')

/**
 * Libraries in frontal, augments frontal applications with pre-configured assets
 * and components to make it easier to create frontend pages with less configuration.
 *
 * The behaviour of the library plugin is written to work without configuration:
 * - There is a default path to look into when attempting to resolve a library entry file.
 * - The bundle to use for the library assets will be selected automatically by
 *   looking for a bundle with the name 'main' or pulling the first bundle.
 *
 * @type {LibraryPlugin}
 */
module.exports = class LibraryPlugin extends fPlugin {
  /**
   * Initiate a new Library plugin instance
   *
   * @param app
   * @param opts
   */
  constructor(app, opts) {
    super(app, opts)
    this.app = app

    // Define default path for library
    this.defaultLibraryLocation = path.resolve(this.app.cwd(), this.app.context(), './library/library.config.js')

    // holds the library options to later be used when registering a library
    // for setting up components
    this.libOpts = {}

    // globals holds global styling files grouped by extension in order
    // to be used for importing primary library's files as well as components
    this.globalStlyes = {}
  }

  /**
   * Compose library path by joining cwd, context and library path
   *
   * @param libraryPath
   * @returns {string}
   */
  getLibraryEntryPath(libraryPath) {
    return path.resolve(this.app.cwd(), this.app.context(), libraryPath)
  }

  /**
   * Applies a library's imports to a certain bundle in the form of assets
   *
   * @param lib
   * @param targetBundle
   * @param bundles
   */
  addLibraryAssets(lib, targetBundle, bundles) {
    // Fallback to an empty array of assets if bundle is not defined within final target bundles
    if (bundles[targetBundle] === undefined) {
      bundles[targetBundle] = { assets: [] }
    }

    // Apply style imports as assets to target
    if (lib.style.imports.length > 0) {
      for (let styleImport of lib.style.imports) {
        // Apply globals to the style import based on file extension
        const importExt = path.extname(styleImport.path).replace('.', '')
        if (is.array(this.globalStlyes[importExt]) && this.globalStlyes[importExt].length > 0) {
          styleImport.path = `${styleImport.path}?globals=${this.globalStlyes[importExt].join(',')}`
        }

        // Append style import to bundle's assets
        bundles[targetBundle].assets.push(styleImport)
      }
    }

    // Apply js imports as assets to target
    if (lib.js.imports.length > 0) {
      for (let jsImport of lib.js.imports) {
        // Append style import to bundle assets
        bundles[targetBundle].assets.push(jsImport)
      }
    }
  }

  /**
   * Takes a component name and sets it up with a new Library instance
   * then applies the assets of the component to the targetBundle
   *
   * @param targetBundle - bundle name to apply component assets to
   * @param bundles - bundles reference to update
   * @param component - component to execute
   * @param options - component options to pass to the component's setup function
   */
  addComToBundle(targetBundle, bundles, component, options) {
    // Create a new library instance for component's setup method
    const comLib = new library(this.app, this.libOpts)

    // Ensure that the component have a setup method
    if (is.fn(component.setup)) {
      component.setup(comLib, options)
    }

    this.addLibraryAssets(comLib, targetBundle, bundles)
  }

  /**
   * Add the scss-loader that adds globals automatically via query parameter `globals`
   *
   * @param config
   */
  webpack(config) {
    config.addModuleRule({
      test: /\.(sa|sc|c)ss$/,
      use: [
        {
          loader: path.resolve(__dirname, './loaders/scss-loader.js'),
        },
      ],
    })

    config.addModuleRule({
      test: /\.less$/,
      use: [
        {
          loader: path.resolve(__dirname, './loaders/less-loader.js'),
        },
      ],
    })

    // Add library resolve
    const libraryConfig = this.app.config.get('library.location', this.defaultLibraryLocation)
    const libraryDir = path.dirname(libraryConfig)
    config.merge({
      resolve: {
        alias: {
          '@library': libraryDir,
        },
        modules: [path.join(libraryDir, './node_modules')],
      },
    })
  }

  /**
   * Implement bundles() to update bundles based on the current active library
   * as well as the used components within each bundle defined in the configuration
   * of the Frontal application.
   *
   * @param bundles
   * @returns {{}}
   */
  bundles(bundles) {
    // Ignore applying library if library.enabled is false
    const enabled = this.app.config.get('library.enabled', true)
    if (enabled === false) {
      return bundles
    }

    // 0) get configuration options
    const opts = {
      location: this.app.config.get('library.location', this.defaultLibraryLocation),
      bundle: this.app.config.get('library.bundle', 'main'),
      options: this.app.config.get('library.options', {}),
    }
    this.libOpts = {
      dir: path.dirname(opts.location),
    }

    // 1) resolve the library entry file
    const libEntryPath = opts.location

    // Silently ignore if the library file was not found
    try {
      if (!fs.existsSync(libEntryPath)) {
        return bundles
      }
    } catch (e) {
      return bundles
    }

    // Register library's entry file to invalidate the app when changed
    if (this.app.inDevMode()) {
      this.app.watcher.watch(libEntryPath, (eventType) => {
        delete require.cache[libEntryPath]
        this.app.invalidate(() => {
          if (eventType === 'change') {
            this.app.devServer.socketServer.write(this.app.devServer.socketServer.sockets, 'content-changed')
          }
        })
      })
    }

    // 2) load the library entry module
    const libMod = require(libEntryPath)

    // 3) validate library default export
    if (!is.fn(libMod)) {
      throw new Error(`Chosen library's entry file is mis-configured.`)
    }

    // Initiate a new library instance
    const lib = new library(this.app, this.libOpts)

    // 3) execute library's exported setup function
    libMod(opts.options, lib)

    // Extract globals from library and group by extension
    this.globalStlyes = {}
    if (lib.style.globals.length > 0) {
      for (const global of lib.style.globals) {
        const ext = path.extname(global).replace('.', '')

        if (this.globalStlyes[ext] === undefined) {
          this.globalStlyes[ext] = []
        }

        this.globalStlyes[ext].push(global)
      }
    }

    // Get target bundle for library's primary imports
    const targetBundle = bundles[opts.bundle] !== undefined ? opts.bundle : Object.keys(bundles)[0]

    // Assign an empty object to final bundles modifications
    const fBundles = {}

    // 4) add library's primary assets to selected bundle
    this.addLibraryAssets(lib, targetBundle, fBundles)

    // 5) add assets to bundles based on components choice for each bundle
    for (const name of Object.keys(bundles)) {
      const desc = bundles[name]

      // Handle adding components to bundles if any were defined
      if (!is.undefined(desc.components)) {
        // Handle components if defined as an array of components names
        if (is.array(desc.components) && desc.components.length > 0) {
          for (const componentName of desc.components) {
            this.addComToBundle(name, fBundles, lib.components.get(componentName), {})
          }
        }

        // Handle components if were registered via an object
        if (is.object(desc.components)) {
          for (const componentName of Object.keys(desc.components)) {
            const comDesc = desc.components[componentName]

            // Ignore component if set to false
            if (comDesc === false) {
              continue
            }

            // Determine component's options
            const comOpts = is.object(comDesc) ? comDesc : {}

            // Add component to final bundles
            this.addComToBundle(name, fBundles, lib.components.get(componentName), comOpts)
          }
        }
      }
    }

    return fBundles
  }
}
