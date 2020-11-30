/* eslint-disable */

module.exports = class FPlugin {
  constructor(opts) {
    this.hooks = {}
  }

  addHook(name, func) {
    // Initiate an empty array if no hooks were added for `name` before
    if (this.hooks[name] === undefined) {
      this.hooks[name] = []
    }

    // append function to execute for hook with `name`
    this.hooks[name].push(func)
  }

  hasHook(name) {
    return this.hooks[name] !== undefined && this.hooks[name].length > 0
  }

  getHooks(name) {
    return this.hooks[name] !== undefined ? this.hooks[name] : []
  }

  teardown() {}

  webpack(config) {}

  bundles(bundles) {}
}
