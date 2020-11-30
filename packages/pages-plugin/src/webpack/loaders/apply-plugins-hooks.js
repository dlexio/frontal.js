const path = require('path')
const { getOptions } = require('loader-utils')
const hookName = 'page:beforeEmit'

const applyHook = async (hooks, loaderCtx, pageName, source) => {
  let newSource = source
  for (const hook of hooks) {
    newSource = await hook(loaderCtx, pageName, newSource)
  }

  return newSource
}

/**
 * Emits the HTML page as an asset
 *
 * @param source
 * @returns {string}
 */
module.exports = function (source) {
  this.cacheable(false)
  const callback = this.async()
  const options = getOptions(this)
  const pageName = this.resourcePath.replace(options.pagesDir + path.sep, '')
  const app = options.app
  const beforeEmitHooks = [].concat.apply(
    [],
    app.plugins
      .filter((plugin) => plugin.hasHook(hookName))
      .map((plugin) => plugin.getHooks(hookName))
  )

  // Ignore if no hooks were found
  if (beforeEmitHooks.length === 0) {
    return callback(null, source)
  }

  // Apply hooks found by all plugins
  applyHook(beforeEmitHooks, this, pageName, source)
    .then((newSource) => {
      callback(null, newSource)
    })
    .catch((err) => {
      callback(err)
    })
}
