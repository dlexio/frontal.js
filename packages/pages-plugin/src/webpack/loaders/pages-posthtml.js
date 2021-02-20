const path = require('path')
const { getOptions } = require('loader-utils')
const posthtml = require('posthtml')
const modules = require('posthtml-modules')
const expressions = require('posthtml-expressions')

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
    expressions({
      delimiters: ['[[', ']]'],
      unescapeDelimiters: ['[[[', ']]]'],
      locals: {
        server: app.config.get('server')
      }
    })
  ]

  posthtml(posthtmlPlugins)
    .process(source)
    .then((result) => {
      callback(null, result.html)
    })
    .catch((e) => {
      // console.error('err', e);
      callback(e)
    })
}
