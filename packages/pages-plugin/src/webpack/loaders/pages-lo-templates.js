const { getOptions } = require('loader-utils')
const template = require('lodash.template')

/**
 * Pages lodash templates parser
 *
 * @param source
 * @returns {string}
 */
module.exports = function (source) {
  const ctx = this,
    callback = ctx.async(),
    options = getOptions(ctx)
  const app = options.app

  const compiled = template(source)
  try {
    const newSrc = compiled({
      server: app.config.get('server'),
    })
    callback(null, newSrc)
  } catch (e) {
    callback(e)
  }
}
