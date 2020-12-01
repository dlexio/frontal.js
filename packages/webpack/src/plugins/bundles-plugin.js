const is = require('is')
const _ = require('lodash')
const path = require('path')
const EntryOptionPlugin = require('webpack/lib/EntryOptionPlugin')
const EntryPlugin = require('webpack/lib/EntryPlugin')
const EntryDependency = require('webpack/lib/dependencies/EntryDependency')
const JsBundleLoader = path.join(__dirname, '../loaders/js-bundle-loader.js')
const NoOp = path.join(__dirname, '../loaders/no-op.js')
const id = 'FrontalBundlesPlugin'

module.exports = class FrontalBundlesPlugin {
  constructor(frontalApp) {
    this.app = frontalApp
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
     * Get bundles from current Frontal app's config as well as
     * applying any plugin's bundles() method to manipulate
     * the final bundles object
     *
     * @todo the following implementation of applying bundle changes from plugins to the initial bundles configuration is ugly and should be rewritten
     *
     * @param compiler
     * @param compilation
     * @returns {*}
     */
    const getBundles = (compiler, compilation) => (app) => {
      const mergeCustomizer = (objValue, srcValue) => {
        if (_.isArray(objValue)) {
          return objValue.concat(srcValue)
        }
      }

      // Initiate an empty bundles object containing initial bundle names only
      const initialBundles = {}
      const configBundles = app.config.get('bundles')
      Object.keys(configBundles).forEach((bundleName) => {
        const desc = configBundles[bundleName]
        initialBundles[bundleName] = { ...desc, assets: [], pages: [] }
      })
      let bundles = initialBundles

      // go through plugins and run the .bundles() method for each
      // Apply plugins webpack config modifications
      for (const plugin of app.plugins) {
        if (is.function(plugin.bundles)) {
          try {
            // Pass initial bundles to the plugin bundles method
            const updatedBundles = plugin.bundles(bundles)
            if (is.object(updatedBundles)) {
              // Modify current bundles with changes from the plugin's bundles method
              bundles = _.mergeWith(_.cloneDeep(bundles), updatedBundles, mergeCustomizer)
            }
          } catch (e) {
            // errors being thrown from the plugin's bundles() method will stop the entire
            // build pipeline.
            compilation.errors.push(e)
          }
        }
      }

      // Merge the initial bundles at the end so that plugins take priority in listing assets by default
      bundles = _.mergeWith(_.cloneDeep(bundles), app.config.get('bundles'), mergeCustomizer)

      // Update the app config with the currently computed bundles for other plugins to rely on
      app.config.set('computed_bundles', bundles)

      return { app, bundles: _.cloneDeep(bundles) }
    }

    /**
     * Convert bundles to entries for webpack to accept as modules,
     * bundles with assets of type javascript will go through the bundle-loader.
     *
     * @param bundles
     */
    const bundlesToEntries = ({ bundles }) => {
      const entries = {}

      for (const bundle of Object.keys(bundles)) {
        const desc = bundles[bundle]
        const assets = []

        // Reset assets array to an empty one if it is undefined
        if (desc.assets === undefined) {
          desc.assets = []
        }

        // Normalize assets
        desc.assets = desc.assets.map((assetDesc) => {
          if (is.string(assetDesc)) {
            assetDesc = { path: assetDesc, order: 0 }
          }

          if (is.object(assetDesc) && is.undefined(assetDesc.order)) {
            assetDesc.order = 0
          }

          return assetDesc
        })

        // Apply order of assets
        desc.assets = _.orderBy(desc.assets, ['order'], ['asc'])

        // group javascript assets to load through the bundle-loader
        const jsFiles = desc.assets.filter(
          (n) => ['.js', ''].indexOf(path.extname(is.object(n) ? n.path.split('?')[0] : n.split('?')[0])) > -1
        )

        assets.push(`${JsBundleLoader}?${JSON.stringify({ files: jsFiles })}!${NoOp}`)

        // all other files should be imported as its own module
        desc.assets
          .map((a) => (is.object(a) ? a.path : a))
          .filter((n) => ['.js', ''].indexOf(path.extname(n.split('?')[0])) === -1)
          .forEach((asset) => {
            assets.push(asset)
          })

        // finally add the bundle with imported assets
        entries[bundle] = {
          import: assets.map((asset) => asset.replace(/\\/g, '/')),
        }
      }

      return entries
    }

    /**
     * Apply entry points to webpack compilation
     *
     * @param compiler
     * @param compilation
     */
    const applyEntries = (compiler, compilation) => (entries) => {
      const promises = []

      for (const name of Object.keys(entries)) {
        const entry = entries[name]
        const options = EntryOptionPlugin.entryDescriptionToOptions(compiler, name, entry)

        // Add an entry for each module defined within each chunk
        for (const mod of entry.import) {
          promises.push(
            new Promise((resolve, reject) => {
              compilation.addEntry(compiler.context, EntryPlugin.createDependency(mod, options), options, (err) => {
                if (err) return reject(err)
                resolve()
              })
            })
          )
        }
      }

      return Promise.all(promises)
    }

    compiler.hooks.make.tapPromise(id, (compilation) =>
      Promise.resolve(this.app)
        .then(getBundles(compiler, compilation))
        .then(bundlesToEntries)
        .then(applyEntries(compiler, compilation))
        .then(() => {})
    )
  }
}
