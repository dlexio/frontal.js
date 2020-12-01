const path = require('path')
const is = require('is')
const glob = require('glob')

const importHandler = (i) => (is.string(i) ? { path: i } : i)

/**
 * StyleRules instances hold styling files to import for the entire library
 * or for each component used within the library.
 *
 * a StyleRules instance is initiated for the entire library and initiated again
 * for each registered component.
 */
class Styles {
  constructor() {
    this.globals = []
    this.imports = []
  }

  /**
   * Global files are usually for advanced style languages such as Sass, these files
   * should only include language specific helpers, for instance mixins for Sass
   * or Variables for Less files.
   *
   * No styling should be applied to any file imported by the global method, because
   * these files will be loaded multiple times for each import made through the import
   * method
   *
   * @param file
   */
  global(...file) {
    if (is.array(file)) {
      this.globals = this.globals.concat(file)
    } else {
      this.globals.push(file)
    }
  }

  /**
   * Styling files to import
   *
   * Registered global imports within this instance is available for each imported
   * style file.
   *
   * @param file
   */
  import(...file) {
    if (is.array(file)) {
      this.imports = this.imports.concat(file.map(importHandler))
    } else {
      this.imports.push(importHandler(file))
    }
  }
}

/**
 * Scripts enables listing javascript files or modules to import
 * for the initiated Library.
 */
class Scripts {
  constructor() {
    this.imports = []
    this.provideAs = {}
  }

  /**
   * Adds a new file or module to import
   *
   * @param file
   */
  import(...file) {
    if (is.array(file)) {
      this.imports = this.imports.concat(file.map(importHandler))
    } else {
      this.imports.push(importHandler(file))
    }
  }
}

/**
 * Components instance holds all registered components for the current
 * library instance.
 */
class Components {
  constructor(app) {
    this.app = app
    this._components = []
  }

  /**
   * Return an array of components
   */
  get components() {
    return this._components
  }

  /**
   * Register an individual component
   *
   * @param name
   * @param setup
   */
  add(name, setup) {
    this._components.push({
      name,
      setup,
    })
  }

  /**
   * Register an individual component
   *
   * @param file - component's config file
   */
  register(file) {
    // Watch component's config for changes
    this._watchComponent(file)
    this._registerComponent(file)
  }

  /**
   * Automatically traverses a components directory and registers
   * each found component within the current Components instance.
   *
   * @param pattern
   */
  autoRegister(pattern) {
    const files = glob.sync(pattern)

    this._watchComponent(pattern)

    for (const file of files) {
      this._registerComponent(file)
    }
  }

  _watchComponent(pattern) {
    this.app.watcher.watch(pattern, (eventType) => {
      this.app.invalidate(() => {
        if (eventType === 'change') {
          this.app.devServer.socketServer.write(this.app.devServer.socketServer.sockets, 'content-changed')
        }
      })
    })
  }

  /**
   * require a component's config file, initialize it and push it to the components array
   *
   * @param file
   * @private
   */
  _registerComponent(file) {
    delete require.cache[file]

    const comMod = require(file)
    const component = comMod()
    this._components.push(component)
  }

  /**
   * Returns a registered component by name from the current Components instance
   *
   * @param name
   * @returns {null}
   */
  get(name) {
    let component = null
    for (const com of this._components) {
      if (com.name === name) {
        component = com
      }
    }

    return component
  }

  /**
   * Returns true if a component were found to be registered
   * by the given name `name`
   *
   * @param name
   * @returns {boolean}
   */
  exists(name) {
    let found = false
    this._components.forEach((component) => {
      if (component.name === name) {
        found = true
      }
    })

    return found
  }
}

/**
 * Library is an instance that is registered once the used Library
 * within the Frontal application.
 *
 * The Library instance exposes `style`, `js` and `components` properties,
 * as each property initiates an instance that enables the Library developer
 * to define styling, javascript and component modules.
 *
 * @type {library}
 */
module.exports = class library {
  constructor(app, opts) {
    this.app = app
    this.opts = opts
    this.style = new Styles()
    this.js = new Scripts()
    this.components = new Components(app)
  }

  path(file) {
    return path.join(this.opts.dir, file)
  }
}
