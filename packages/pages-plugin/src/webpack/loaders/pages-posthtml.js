const path = require('path')
const { getOptions } = require('loader-utils')
const posthtml = require('posthtml')
const modules = require('posthtml-modules')

/**
 * Posthtml integration loader for the partials feature
 *
 * @param source
 * @returns {string}
 */
module.exports = function (source) {
  this.cacheable(false)

  const ctx = this,
    callback = ctx.async(),
    options = getOptions(ctx)
  const app = options.app

  const posthtmlPlugins = [
    modules({
      initial: true,
      tag: 'partial',
      attribute: 'src',
      root: path.join(
        app.cwd(),
        app.context(),
        app.config.get('pages.location', 'pages'),
        app.config.get('pages.partials', '.partials'),
        '/'
      ),
      from: '/',
    }),
  ]

  posthtml(posthtmlPlugins)
    .process(source)
    .then((result) => {
      callback(null, result.html)
    })
    .catch((e) => {
      callback(e)
    })
}
