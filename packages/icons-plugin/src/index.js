const is = require('is')
const fs = require('fs')
const path = require('path')
const fPlugin = require('@frontal/plugin')
const { urlToRequest } = require('loader-utils')
const cheerio = require('cheerio')
const SVGo = require('svgo')

const replaceFromMap = (map, str) => {
  // Ignore if replacement is not an object
  if (!is.object(map)) {
    return str
  }

  // replaced indicator
  let replaced = false

  // go through each replacement key
  for (const mapKey of Object.keys(map)) {
    if (replaced) {
      break
    }

    const mapVal = map[mapKey]
    const regex = new RegExp(mapKey, 'u')
    if (regex.test(str)) {
      str = str.replace(regex, mapVal)
      replaced = true
    }
  }

  return str
}

const handleIcon = (app, loaderCtx, $, elem, iconsConfig, svgo) => {
  const computeSrc = is.function(iconsConfig.computeSrc)
    ? iconsConfig.computeSrc
    : (iconsPath, attrs) => {
        return path.join('~', iconsPath, attrs.set, attrs.name)
      }
  const constructIcon = is.function(iconsConfig.construct)
    ? iconsConfig.construct
    : (attrs, icon) => {
        return icon
      }

  return new Promise((resolve, reject) => {
    const attrs = $(elem).attr()
    let ctx = loaderCtx.context
    let svg = ''

    // Use src attribute directly if provided
    const src = $(elem).attr('src')
    if (src !== undefined) {
      svg = src
    } else {
      // Use the computeSrc method
      svg = computeSrc(app.config.get('icons.path', 'icons'), attrs)
    }

    // Apply replacements
    svg = replaceFromMap(iconsConfig.map, svg)

    // Add extension if not found
    if (path.extname(svg) === '') {
      svg = svg + '.svg'
    }

    // Update the context to the public directory if the URL starts with /
    if (svg.startsWith('/')) {
      ctx = app.public()
    }

    // Normalize URL to a request for webpack only if its not starting with an alias
    if (!svg.startsWith('@')) {
      svg = urlToRequest(svg, ctx)
    }

    // Load SVG file
    loaderCtx.resolve(ctx, svg, (err, resolvedSvg) => {
      if (err) {
        reject(err)
        return
      }

      fs.readFile(resolvedSvg, (err, data) => {
        if (err) {
          reject(err)
          return
        }

        // Optimize SVG icon
        svgo
          .optimize(data.toString())
          .then((res) => {
            const $icon = cheerio.load(res.data)

            // Apply all attributes to the SVG
            Object.keys(attrs)
              .filter((attrKey) => ['src', 'set', 'name'].indexOf(attrKey) === -1)
              .forEach((attrKey) => {
                const attrVal = attrs[attrKey]
                $icon('svg').attr(attrKey, attrVal)
              })

            $(elem).replaceWith(constructIcon(attrs, $icon.html(), res.info))
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    })
  })
}

module.exports = class IconsPlugin extends fPlugin {
  constructor(app) {
    super()
    const iconsPath = path.join(app.cwd(), app.context(), app.config.get('icons.path', 'icons'))
    const iconsConfigPath = path.join(iconsPath, app.config.get('icons.configFile', 'icons.config.js'))

    // Register page hook
    const iconsEnabled = app.config.get('icons.enabled', true)
    if (iconsEnabled) {
      this.addHook('page:beforeEmit', this.handlePage(iconsPath, iconsConfigPath, app))

      // Add a watcher for the icons.config.js file
      app.watcher.watch(iconsConfigPath, (eventType) => {
        delete require.cache[iconsConfigPath]
        app.invalidate(() => {
          if (eventType === 'change') {
            app.devServer.socketServer.write(app.devServer.socketServer.sockets, 'content-changed')
          }
        })
      })
    }
  }

  handlePage(iconsPath, iconsConfigPath, app) {
    // Get icons config
    const defaultIconsConfig = {
      tag: 'icon',
      map: {},
    }

    return async function handlePage(loaderCtx, name, content) {
      const $ = cheerio.load(content)

      // If a config file was found, use its exported config instead of the default one
      let iconsConfig
      try {
        iconsConfig = require(iconsConfigPath)
      } catch (e) {
        iconsConfig = defaultIconsConfig
      }
      iconsConfig.location = iconsPath

      // Apply default optimize options if not available
      if (is.undefined(iconsConfig.optimize)) {
        iconsConfig.optimize = {
          stripDimensions: true,
        }
      }

      // Initiate a new SVGo instance with plugins based on options
      const svgo = new SVGo({
        plugins: [{ removeDimensions: iconsConfig.optimize.stripDimensions }],
      })

      // Create promises for each icon
      const promises = []

      // Crawl content for <icon> tags
      $(iconsConfig.tag).each((i, elem) => {
        promises.push(handleIcon(app, loaderCtx, $, elem, iconsConfig, svgo))
      })

      // Wait for all promises to resolve
      await Promise.all(promises)

      return $.html()
    }
  }
}
