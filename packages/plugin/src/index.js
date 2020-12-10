/* eslint-disable */

module.exports = class FPlugin {
  /**
   * The constructor of the plugin
   *
   * @param app - A frontal.js application instance
   * @param opts - Options object
   */
  constructor(app, opts) {
    this.hooks = {}
  }

  /**
   * Register a function to a certain hook by name, so that other plugins
   * can execute all functions for a certain hook by name
   *
   * @param name - the name of the hook
   * @param func - the function to execute
   */
  addHook(name, func) {
    // Initiate an empty array if no hooks were added for `name` before
    if (this.hooks[name] === undefined) {
      this.hooks[name] = []
    }

    // append function to execute for hook with `name`
    this.hooks[name].push(func)
  }

  /**
   * Check if a certain hook exists by name
   *
   * @param name
   * @returns {boolean}
   */
  hasHook(name) {
    return this.hooks[name] !== undefined && this.hooks[name].length > 0
  }

  /**
   * Returns all registered functions for a certain hook by name
   *
   * @param name
   * @returns []
   */
  getHooks(name) {
    return this.hooks[name] !== undefined ? this.hooks[name] : []
  }

  /**
   * the webpack method enables modifying the Webpack compiler configuration.
   *
   * @param config - An object that exposes methods for modifying webpack configuration
   */
  webpack(config) {}

  /**
   * the bundles method can be used to modify the final bundles object
   * by either adding or removing assets from all bundles or adding
   * new bundles entirely to the build process.
   *
   * @param bundles - the bundles
   * @return bundles - the modified bundles object is returned
   */
  bundles(bundles) {}
}
