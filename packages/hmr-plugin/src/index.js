const fPlugin = require('@frontal/plugin')
const hmrClient = require.resolve('./client')
const hmrHot = require.resolve('./hot/dev-server')

module.exports = class HmrPlugin extends fPlugin {
  constructor(app) {
    super()
    this.app = app
  }

  bundles(bundles) {
    const fBundles = {}

    // Ignore plugin if not in development mode
    if (!this.app.inDevMode()) {
      return fBundles
    }

    Object.keys(bundles).forEach((bundleName) => {
      fBundles[bundleName] = {
        assets: [hmrHot],
      }
    })

    fBundles['hmr'] = {
      assets: [hmrClient],
      pages: ['**/*.html'],
    }

    return fBundles
  }
}
