const is = require('is')
const loaderUtils = require('loader-utils')

module.exports = function () {
  // out is an array of each line of the final bundle
  const out = []

  // options is an object with a `files` property, as the value of it is an array
  // of files to require
  const options = loaderUtils.getOptions(this)
  const exposeLoader = require.resolve('expose-loader')
  const importsLoader = require.resolve('imports-loader')

  // Go through each file and construct the final output
  for (const file of options.files) {
    let scopedWith = ''
    let modulePath = is.object(file) ? file.path : file

    // Apply the expose-loader if required to
    if (is.array(file.provideAs) && file.provideAs.length > 0) {
      const exposes = []
      for (const provide of file.provideAs) {
        exposes.push(`exposes[]=${provide}`)
      }

      modulePath = `${exposeLoader}?${exposes.join('&')}!${modulePath}`
    }

    // Disable AMD define if requested
    if (is.bool(file.define) && file.define === false) {
      modulePath = `${importsLoader}?define=>false!${modulePath}`
    }

    // Add imports to library
    if (is.array(file.imports) && file.imports.length > 0) {
      modulePath = `${importsLoader}?imports=${file.imports.join(',')}!${modulePath}`
    }

    // Add scoping if requested
    if (is.array(file.scopedWith) && file.scopedWith.length > 0) {
      scopedWith = `(${file.scopedWith.join(', ')})`
    }

    out.push(`require(${loaderUtils.stringifyRequest(this, modulePath)})${scopedWith}`)
  }

  return out.join('\n')
}
