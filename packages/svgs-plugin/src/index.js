const is = require('is')
const fs = require('fs')
const path = require('path')
const fPlugin = require('@frontal/plugin')
const { urlToRequest } = require('loader-utils')
const cheerio = require('cheerio')
const SVGo = require('svgo')
const svgoConfig = (svgsConfig) => ({
  plugins: [
    {
      removeDimensions: svgsConfig.optimize.stripDimensions,
    },
    {
      convertColors: {
        currentColor: svgsConfig.currentColor,
        names2hex: true,
        rgb2hex: true,
        shorthex: true,
        shortname: true,
      },
    },
    {
      prefixIds: true,
    },
    // {
    //   cleanupIDs: {
    //     prefix: {
    //       toString() {
    //         this.counter = this.counter || 0;
    //
    //         return `id-${this.counter++}`;
    //       }
    //     }
    //   }
    // }
  ],
})

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

const handleSvg = (app, loaderCtx, $, elem, svgsConfig, svgo) => {
  const computeSrc = is.function(svgsConfig.computeSrc)
    ? svgsConfig.computeSrc
    : (svgsPath, attrs) => {
        return `~/${svgsPath}/${attrs.set}/${attrs.name}`
      }
  const constructSvg = is.function(svgsConfig.construct)
    ? svgsConfig.construct
    : (attrs, svg) => {
        return svg
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
      svg = computeSrc(app.config.get('svgs.path', 'svgs'), attrs)
    }

    // Apply replacements
    svg = replaceFromMap(svgsConfig.map, svg)

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

        // Ignore SVGO if indicated
        if (attrs['data-load-only']) {
          const $svg = cheerio.load(data.toString())

          // Apply all attributes to the SVG
          Object.keys(attrs)
            .filter((attrKey) => ['src', 'set', 'name', 'data-current-color'].indexOf(attrKey) === -1)
            .forEach((attrKey) => {
              const attrVal = attrs[attrKey]
              $svg('svg').attr(attrKey, attrVal)
            })

          $(elem).replaceWith(constructSvg(attrs, $svg.html(), {}))
          resolve()
        } else {
          // Enable convertColor if indicated by an attr
          if (attrs['data-current-color'] !== undefined) {
            svgo = new SVGo(svgoConfig({ ...svgsConfig, currentColor: true }))
          }

          // Optimize SVG
          svgo
            .optimize(data.toString(), { path: resolvedSvg })
            .then((res) => {
              const $svg = cheerio.load(res.data)

              // Apply all attributes to the SVG
              Object.keys(attrs)
                .filter((attrKey) => ['src', 'set', 'name', 'data-current-color'].indexOf(attrKey) === -1)
                .forEach((attrKey) => {
                  const attrVal = attrs[attrKey]
                  $svg('svg').attr(attrKey, attrVal)
                })

              $(elem).replaceWith(constructSvg(attrs, $svg.html(), res.info))
              resolve()
            })
            .catch((e) => {
              reject(e)
            })
        }
      })
    })
  })
}

module.exports = class SvgsPlugin extends fPlugin {
  constructor(app) {
    super()
    const svgsPath = path.join(app.cwd(), app.context(), app.config.get('svgs.path', 'svgs'))
    const svgsConfigPath = path.join(svgsPath, app.config.get('svgs.configFile', 'svgs.config.js'))

    // Register page hook
    const svgsEnabled = app.config.get('svgs.enabled', true)
    if (svgsEnabled) {
      this.addHook('page:beforeEmit', this.handlePage(svgsPath, svgsConfigPath, app))

      // Add a watcher for the svgs.config.js file
      app.watcher.watch(svgsConfigPath, (eventType) => {
        delete require.cache[svgsConfigPath]
        app.invalidate(() => {
          if (eventType === 'change') {
            app.devServer.socketServer.write(app.devServer.socketServer.sockets, 'content-changed')
          }
        })
      })
    }
  }

  handlePage(svgsPath, svgsConfigPath, app) {
    // Get svgs config
    const defaultSvgsConfig = {
      tag: 'i-svg',
      map: {},
    }

    return async function handlePage(loaderCtx, name, content) {
      const $ = cheerio.load(content)

      // If a config file was found, use its exported config instead of the default one
      let svgsConfig
      try {
        svgsConfig = require(svgsConfigPath)
      } catch (e) {
        svgsConfig = defaultSvgsConfig
      }
      svgsConfig.location = svgsPath

      // Apply default optimize options if not available
      if (is.undefined(svgsConfig.optimize)) {
        svgsConfig.optimize = {
          stripDimensions: true,
        }
      }

      // Initiate a new SVGo instance with plugins based on options
      const svgo = new SVGo(svgoConfig(svgsConfig))

      // Create promises for svgs
      const promises = []

      // Crawl content for <i-tag> tags
      $(svgsConfig.tag).each((i, elem) => {
        promises.push(handleSvg(app, loaderCtx, $, elem, svgsConfig, svgo))
      })

      // Wait for all promises to resolve
      await Promise.all(promises)

      return $.html()
    }
  }
}
