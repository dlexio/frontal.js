const path = require('path')
const { getOptions } = require('loader-utils')

/**
 * Emits the HTML page as an asset
 *
 * @param source
 * @returns {string}
 */
module.exports = function (source) {
  const options = getOptions(this)
  const pageName = this.resourcePath.replace(options.pagesDir + path.sep, '')

  this.emitFile(pageName, source)

  return ''
}
