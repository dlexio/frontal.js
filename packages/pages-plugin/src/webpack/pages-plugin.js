const path = require('path')
const glob = require('glob')
const is = require('is')
const _ = require('lodash')
const pm = require('picomatch')
const EntryOptionPlugin = require('webpack/lib/EntryOptionPlugin')
const EntryPlugin = require('webpack/lib/EntryPlugin')
const EntryDependency = require('webpack/lib/dependencies/EntryDependency')
const id = 'FrontalPagesPlugin'

module.exports = class PagesWebpackPlugin {
  /**
   * @param app - Frontal app instance
   * @param dir - Directory in which pages will be resolved
   * @param opts - Options regarding the resolving of the pages {partials: '', extensions: []}
   */
  constructor(app, dir, opts) {
    this.app = app
    this.dir = dir
    this.opts = opts
  }

  apply(compiler) {
    /**
     * Register the EntryDependency and normalModuleFactory because initially
     * webpack's config entry field is empty and therefore no factories
     * are registered
     */
    compiler.hooks.compilation.tap(id, (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(EntryDependency, normalModuleFactory)
    })

    /**
     * Return an array of bundle names that belongs to the given `pageName`
     *
     * @param pageName
     * @param bundles
     * @returns {string[]}
     */
    const getPageBundles = (pageName, bundles) =>
      Object.keys(bundles)
        .map((bundleName) => ({ name: bundleName, desc: bundles[bundleName] }))
        .map((bundle) => {
          if (bundle.desc.pages.length === 0) {
            bundle.desc.pages = ['**/*.html']
          }

          return bundle
        })
        .filter((bundle) => is.array(bundle.desc.pages))
        .map(({ name, desc }) => {
          let fBundle = ''
          desc.pages.forEach((pageGlob) => {
            const isMatch = pm(pageGlob)
            if (isMatch(pageName)) {
              fBundle = name
            }
          })

          return fBundle
        })
        .filter((b) => b.length > 0)

    /**
     * Traverse the pages directory for pages
     *
     * @returns {Promise<unknown>}
     */
    const traversePages = () =>
      new Promise((resolve) => {
        // get bundles configuration
        const configBundles = this.app.config.get('computed_bundles', this.app.config.get('bundles'))

        // Get pages
        const pagesGlob = path.join(this.dir, '**', `*.*(${this.opts.extensions.join('|')})`)
        const pages = glob.sync(pagesGlob).map((page) => {
          // glob replaces dir separator to posix, we need to change that to the current sep of the system
          page = page.split(path.posix.sep).join(path.sep)
          const pageName = page.replace(`${this.dir + path.sep}`, '')
          return {
            path: page,
            name: pageName,
            bundles: getPageBundles(pageName, configBundles),
          }
        })

        resolve(pages)
      })

    /**
     * Get compiled assets grouped by entry point names
     *
     * @param compilations - array of compilations to walk through and extract entrypoints and assets from
     * @returns {function(*): {pages: *, bundles: {}}}
     */
    const getCompiledAssets = (compilations) => (pages) => {
      const bundles = {}

      for (const compilation of compilations) {
        const entryNames = Array.from(compilation.entrypoints.keys())

        for (let i = 0; i < entryNames.length; i++) {
          const entryName = entryNames[i]

          // Get files related to entry - make sure to filter out hot updates if found
          const files = compilation.entrypoints
            .get(entryName)
            .getFiles()
            .filter((chunk) => {
              const asset = compilation.getAsset(chunk)
              if (!asset) {
                return true
              }

              const meta = asset.info || {}
              return !(meta.hotModuleReplacement || meta.development)
            })

          bundles[entryName] = {
            js: files.filter((f) => path.extname(f) === '.js').map((f) => f),
            css: files.filter((f) => path.extname(f) === '.css').map((f) => f),
          }
        }
      }

      // return both bundles and pages
      return { pages, bundles }
    }

    /**
     * addPagesAsAssets adds traversed pages to the current compiler as Entries
     *
     * @param compiler
     * @param compilation
     * @returns {function({pages: *, bundles: *}): Promise<unknown[]>}
     */
    const addPagesAsAssets = (compiler, compilation) => ({ pages, bundles }) => {
      const promises = []

      const reducer = function (flattened, other) {
        return flattened.concat(other)
      }

      for (const page of pages) {
        const imports = [page.path]

        const entryOptions = EntryOptionPlugin.entryDescriptionToOptions(compiler, page.name, { import: imports })
        // @todo the way bundles are being determined and flattened can be improved!
        const pageBundles = page.bundles.map((bundleName) => bundles[bundleName])
        const frontalPageSettings = {
          js: _.uniq(
            _.reduce(
              pageBundles.map((b) => b.js),
              reducer,
              []
            )
          ),
          css: _.uniq(
            _.reduce(
              pageBundles.map((b) => b.css),
              reducer,
              []
            )
          ),
        }

        // Add an entry for each module defined within each chunk
        promises.push(
          new Promise((resolve, reject) => {
            compilation.addEntry(
              compiler.context,
              EntryPlugin.createDependency(
                `${page.path}?frontal_pages_bundles=${JSON.stringify(frontalPageSettings)}`,
                entryOptions
              ),
              entryOptions,
              (err) => {
                if (err) return reject(err)
                resolve()
              }
            )
          })
        )
      }

      return Promise.all(promises)
    }

    // During the make of the main compiler
    compiler.hooks.make.tap(id, (compilation) => {
      const childCompiler = compilation.createChildCompiler('pagesCompiler')
      childCompiler.context = compiler.context

      // After assets are emitted
      compilation.hooks.processAssets.tapAsync(id, (assets, callback) => {
        // Within the make phase of the child compiler
        childCompiler.hooks.make.tapAsync(id, (childCompilation, callback) => {
          traversePages()
            .then(getCompiledAssets([compilation]))
            .then(addPagesAsAssets(childCompiler, childCompilation))
            .then(() => {
              callback()
            })
            .catch((e) => {
              callback(e)
            })
        })

        // Run the child compiler
        childCompiler.runAsChild((err, entries, comp) => {
          if (err) {
            callback(err)
            return
          }

          if (comp.errors.length > 0) {
            compilation.errors = comp.errors
          }

          if (comp.warnings.length > 0) {
            compilation.warnings = comp.warnings
          }

          callback()
        })
      })

      // Delete .js assets generated because of the entrypoints of the .html pages
      compilation.hooks.processAssets.tapAsync(id, (assets, callback) => {
        traversePages().then((pages) => {
          pages.forEach((page) => {
            const pageAssetMatch = pm(
              path.join(
                this.app.config.get('build.assets.into'),
                this.app.config.get('build.js.into'),
                `${page.name}.*.js`
              ).split(path.sep).join(path.posix.sep)
            )

            Object.keys(assets).forEach((assetName) => {
              if (pageAssetMatch(assetName)) {
                compilation.deleteAsset(assetName)
              }
            })
          })

          callback()
        })
      })
    })
  }
}
