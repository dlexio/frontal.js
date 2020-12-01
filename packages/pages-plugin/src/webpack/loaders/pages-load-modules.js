const path = require('path')
const cheerio = require('cheerio')
const { getOptions, isUrlRequest, urlToRequest } = require('loader-utils')
const { srcHandler, srcsetHandler } = require('./utils/attrs-handlers')

// rules is an object with keys being tag names and values
// is an object, as each key is the attribute name with the value
// being a function that handles the parsing of the attr value
// as well as adding the URL as a module to the build.
//
// attribute names are CSS attribute selectors.
const rules = {
  audio: {
    src: srcHandler,
  },
  embed: {
    src: srcHandler,
  },
  img: {
    src: srcHandler,
    srcset: srcsetHandler,
  },
  input: {
    src: srcHandler,
  },
  script: {
    src: srcHandler,
    'xlink\\:href': srcHandler,
    href: srcHandler,
  },
  source: {
    src: srcHandler,
    srcset: srcsetHandler,
  },
  track: {
    src: srcHandler,
  },
  video: {
    src: srcHandler,
    poster: srcHandler,
  },
  link: {
    href: srcHandler,
  },
  image: {
    'xlink\\:href': srcHandler,
    href: srcHandler,
  },
  object: {
    data: srcHandler,
  },
  use: {
    'xlink\\:href': srcHandler,
    href: srcHandler,
  },
}

/**
 * Allows adding a certain URL to the webpack compilation as a module
 * upon success, the new URL is returned
 *
 * @param loaderCtx
 * @returns {function(...[*]=)}
 */
const addModule = (loaderCtx) => {
  const options = getOptions(loaderCtx)
  const contextDir = path.join(options.app.cwd(), options.app.context())
  const pagesDir = path.join(contextDir, 'pages') // @todo change static pages and use frontal config instance instead

  return (url, done) => {
    if (isUrlRequest(url)) {
      // The context of the resolve method by default is the (cwd/context)
      let resolveCtx = contextDir

      // If the url were determined to be a relative request, then change
      // the resolve context to the pages directory instead
      if (!path.isAbsolute(url)) {
        resolveCtx = loaderCtx.context
      }

      // Get URL to request
      let request

      // If the URL starts with @ then let webpack handle the resolving directly
      if (url.startsWith('@')) {
        request = url
      } else {
        request = urlToRequest(url, pagesDir)
      }

      // Resolve the requested URL before adding as a module
      loaderCtx.resolve(resolveCtx, request, (err, request) => {
        if (err) {
          done(err)
        } else {
          loaderCtx.loadModule(request, (err, source, sourceMap, module) => {
            if (err) {
              done(err)
            } else {
              // @todo revisit the method used for obtaining the final built asset
              //       for example, extract-loader uses babel to eval the source code.
              const builtAssets = Object.keys(module.buildInfo.assets)
              if (builtAssets.length > 0) {
                done(null, path.join(options.app.config.get('server.base'), builtAssets[0]))
              } else {
                done(new Error(`No built assets were found for: ${request}`), null)
              }
            }
          })
        }
      })
    } else {
      // If url is not a url request, pass it as it is
      done(null, url)
    }
  }
}

/**
 *
 *
 * @param ctx - the loader context
 * @param $ - a cheerio instance of the page source
 * @param tag - the tag to lookup in the source
 * @param attr - the attribute to extract
 * @param attrHandler - a function that handles the extracted attribute
 * @returns {Promise<unknown>}
 */
const handleTagAttr = (ctx, $, tag, attr, attrHandler) => {
  return new Promise((resolve, reject) => {
    const promises = []

    // Find all elements with tag and attribute
    $(`${tag}[${attr}]`).each((i, elem) => {
      const val = $(elem).attr(attr)

      promises.push(
        attrHandler(val, addModule(ctx)).then((newVal) => {
          $(elem).attr(attr, newVal)
        })
      )
    })

    Promise.all(promises)
      .then(() => {
        resolve()
      })
      .catch((err) => reject(err))
  })
}

/**
 * Extracts loadable modules from a given HTML source by crawling
 * source tags and adding each loadable module to webpack then replacing
 * old URLs with new ones
 *
 * @param source
 * @returns {string}
 */
module.exports = function (source) {
  const loaderCtx = this
  const callback = loaderCtx.async()
  const $ = cheerio.load(source)
  const tags = []

  // Start going through the tags map and extract the attrs
  // defined for each tag name specified in the tagsMap
  for (const tagName of Object.keys(rules)) {
    const tagDesc = rules[tagName]

    for (const attrName of Object.keys(tagDesc)) {
      const attrHandler = rules[tagName][attrName]

      tags.push(handleTagAttr(loaderCtx, $, tagName, attrName, attrHandler))
    }
  }

  Promise.all(tags)
    .then(() => {
      callback(null, $.html())
    })
    .catch((e) => {
      callback(e)
    })
}
