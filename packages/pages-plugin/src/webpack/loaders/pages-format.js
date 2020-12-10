const { getOptions } = require('loader-utils')
const html_beautify = require('js-beautify').html_beautify
const minify = require('html-minifier-terser').minify

/**
 * Emits the HTML page as an asset
 *
 * @param source
 * @returns {string}
 */
module.exports = function (source) {
  const options = getOptions(this)
  const frontalApp = options.app
  const formatMode = frontalApp.config.get(
    'pages.html.format',
    process.env.NODE_ENV === 'production' ? 'minify' : 'beautify'
  )

  // Handle beautify mode
  if (formatMode === 'beautify') {
    return html_beautify(source)
  }

  // Handle minify mode
  if (formatMode === 'minify') {
    return minify(source, {
      collapseWhitespace: true,
      keepClosingSlash: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
    })
  }

  return source
}
