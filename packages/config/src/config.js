const path = require('path')
const fs = require('fs')
const vm = require('vm')
const is = require('is')
const _ = require('lodash')
const chokidar = require('chokidar')
const consola = require('consola')
const requireLike = require('require-like')

const defaultConfig = require('./defaults')
const schema = require('./schema.json')
const { validate } = require('schema-utils')

module.exports = class Config {
  /**
   * Construct a new Config instance.
   * Fallback to a default configuration in case no config file was provided.
   *
   * @param cwd - the current working directory of the Frontal application
   * @param configFile - the location of the config file
   * @param defaults - override configuration defaults
   */
  constructor(cwd, configFile, defaults = {}) {
    this.defaults = defaults
    this.path = configFile
    this.cwd = cwd

    // Initiate a new logger for the Config instance
    this.logger = consola.create({
      reporters: [new consola.FancyReporter()],
      defaults: { additionalColor: 'white' },
    })

    // Apply default configuration options
    this.applyDefaults(defaults)

    // Apply custom configuration options
    try {
      // Apply custom configuration to this Config instance
      this.applyCustomConfig()
    } catch (e) {
      this.logger.error(
        `\`${path.basename(
          this.path
        )}\` used for configuration is invalid due to: \n\n${e.message}`
      )
    }
  }

  /**
   * Apply defaults restores the current Config instance to the default state
   * of using the constructor defaults over the ./defaults.js file
   *
   * @param defaults
   */
  applyDefaults(defaults) {
    this.data = _.defaultsDeep({}, defaults, defaultConfig)
  }

  /**
   * Opens the custom config and applies the options
   * over the current Config's instance data
   *
   * @returns {Error|void}
   */
  applyCustomConfig() {
    if (!fs.existsSync(this.path)) {
      return
    }

    // Load a fresh copy of the configuration
    const customConfig = this.getFileConfig()

    // Apply custom configuration to the default configuration
    const conf = _.defaultsDeep({}, customConfig, this.data)

    // Replace bundles entirely
    if (customConfig.bundles !== undefined) {
      conf.bundles = customConfig.bundles
    }

    // validate custom configuration against schema
    validate(schema, conf, { name: this.path, baseDataPath: 'config' })

    this.data = conf
  }

  /**
   * Get a configuration option by path
   *
   * Example: get('server.host');
   *
   * @param path - string path
   * @param defaultValue - default value to apply incase no value was found
   * @returns {*}
   */
  get(path, defaultValue) {
    return _.get(this.data, path, defaultValue)
  }

  set(path, newValue) {
    return _.set(this.data, path, newValue)
  }

  /**
   * The watch method watches the config file for changes
   * then gets the difference between the old config and the new config
   *
   * @param cb
   */
  onChange(cb) {
    // keep a copy of the current configuration
    chokidar
      .watch(this.path, { ignoreInitial: true })
      .on('all', (event, filePath) => {
        const bk = Object.assign({}, this.data)

        // Reset config to the defaults
        this.applyDefaults(this.defaults)

        // Handle each event type of the configuration
        switch (event) {
          case 'add':
          case 'change':
            try {
              // Apply custom configuration to this Config instance
              this.applyCustomConfig()

              // Notify that the custom config file is in use
              if (event === 'add') {
                this.logger.info(
                  `\`${path.basename(filePath)}\` is used for configuration.`
                )
              }
            } catch (e) {
              this.logger.error(
                `\`${path.basename(
                  filePath
                )}\` used for configuration is invalid due to: \n\n${e.message}`
              )
            }
            break
          case 'unlink':
            this.logger.info(
              `\`${path.basename(
                filePath
              )}\` configuration file not found, falling back to default configuration.`
            )
            break
        }

        // Pass a before and after copies of the config in case
        // there was a change to the config.
        const configCopy = Object.assign({}, this.data)
        if (!_.isEqual(bk, configCopy)) {
          cb(bk, configCopy, this.difference(configCopy, bk))
        }
      })
  }

  /**
   * Deep difference between two objects using lodash
   * Taken from: https://gist.github.com/Yimiprod/7ee176597fef230d1451
   *
   * @param object
   * @param base
   * @returns {*}
   */
  difference(object, base) {
    function changes(object, base) {
      return _.transform(object, function (result, value, key) {
        if (!_.isEqual(value, base[key])) {
          result[key] =
            _.isObject(value) && _.isObject(base[key])
              ? changes(value, base[key])
              : value
        }
      })
    }

    return changes(object, base)
  }

  /**
   * Synchronously read the configuration file, execute it and return the configuration object
   *
   * @returns {Error|*}
   */
  getFileConfig() {
    const cwdRequire = requireLike(path.join(this.cwd, '/'))
    const configFile = fs.readFileSync(this.path)
    const sandbox = { require: cwdRequire, module: { exports: undefined } }
    const context = new vm.createContext(sandbox)
    const config = new vm.Script(configFile.toString())
    config.runInContext(context)

    // Fail if the executed code does not result in exporting a function or an object to module.exports
    if (
      !is.function(sandbox.module.exports) &&
      !is.object(sandbox.module.exports)
    ) {
      throw new Error(
        "The application's config should either export an object or a function that returns an object.\n\n" +
          'Object example:\n' +
          '| module.exports = {\n' +
          '|\t...\n' +
          '| };\n' +
          '\n' +
          'Function example:\n' +
          '| module.exports = (env) => ({\n' +
          '|\t...\n' +
          '| });\n' +
          '\n' +
          'Read the documentation for more details on how to configure your frontal application.'
      )
    }

    return is.function(sandbox.module.exports)
      ? sandbox.module.exports()
      : sandbox.module.exports
  }
}
