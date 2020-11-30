const is = require('is')
const querystring = require('querystring')
const { getOptions } = require('loader-utils')
const cheerio = require('cheerio')

/**
 * Determine which bundles should be included in the loaded
 * HTML file based on the Frontal App config
 *
 * @param source
 * @returns {string}
 */
module.exports = function (source) {
  const options = getOptions(this),
    frontalApp = options.app,
    $ = cheerio.load(source),
    cleanQuery = this.resourceQuery.replace('?', ''),
    queryOpts = querystring.parse(cleanQuery)

  // Skip adding bundles if no bundles were provided for the current page
  if (is.undefined(queryOpts.frontal_pages_bundles)) {
    return source
  }

  // Determine bundle names this page should use
  const assets = JSON.parse(queryOpts.frontal_pages_bundles)
  const serverBase = frontalApp.config.get('server.base')

  // Apply css imports
  if (assets.css.length > 0) {
    assets.css.forEach((f) => {
      $('head').append(
        `<link rel="stylesheet" type="text/css" href="${
          serverBase + f
        }" as="style">`
      )
    })
  }

  // Apply js imports as preloads
  if (assets.js.length > 0) {
    assets.js.forEach((f) => {
      $('head').append(
        `<link rel="preload" href="${
          frontalApp.config.get('server.base') + f
        }" as="script">`
      )
    })
  }

  // Apply js imports
  if (assets.js.length > 0) {
    // If the body contains any <script>, attempt to put the js imports before them
    // otherwise just append the script imports to the body tag
    const scripts = $('body').find('script')

    if (scripts.length > 0) {
      const addedScripts = []
      assets.js.forEach((f) => {
        addedScripts.push(`<script src="${serverBase + f}"></script>`)
      })
      scripts.first().before(addedScripts.join('\n'))
    } else {
      assets.js.forEach((f) => {
        $('body').append(`<script src="${serverBase + f}"></script>`)
      })
    }
  }

  // @fixme the following is a hack for fixing slow style load. A better approach would be to extract CSS via a webpack plugin and
  //        separate it in its own module and load that js module in the <head>
  if (frontalApp.inDevMode()) {
    $('head').append(
      '<style id="frontal_style">body { display: none; }</style>'
    )
    $('body').append(`
        <script>
        var frontalStyle = document.getElementById('frontal_style');
        if (frontalStyle) {
            frontalStyle.parentNode.removeChild(frontalStyle);
        }
        </script>
        `)
  }

  return $.html()
}
