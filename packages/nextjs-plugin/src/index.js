const path = require('path')
const fPlugin = require('@frontal/plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const fs = require('fs')

module.exports = class Nextjs extends fPlugin {
  constructor(frontalApp) {
    super()
    const ctx = this
    this.app = frontalApp

    // Detect typescript support
    const tsConfigFile = path.join(this.app.cwd(), this.app.context(), 'tsconfig.json')
    this.typescript = fs.existsSync(tsConfigFile)
    this.app.watcher.watch(tsConfigFile, (event) => {
      if (event === 'add' || event === 'unlink') {
        ctx.app.restart()
      }
    })

    // Detect babel config
    const babelConfigFile = path.join(this.app.cwd(), this.app.context(), 'babel.config.js')
    try {
      // refresh cache
      delete require.cache[babelConfigFile]

      // import babel config
      this.babelConfig = require(babelConfigFile)
    } catch (e) {
      // babel fallback configuration
      this.babelConfig = {
        //sourceType: "unambiguous",
        presets: [
          [
            require.resolve('@babel/preset-env'),
            {
              targets: 'defaults',
              //corejs: '3',
              //useBuiltIns: 'usage'
            },
          ],
        ],
      }
    }
    // Watch babel config for changes
    this.app.watcher.watch(babelConfigFile, () => {
      ctx.app.restart()
    })
  }

  webpack(config) {
    config.merge({
      resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        // modules: [require.resolve('./node_modules')],
      },
    })

    // Add support for Babel
    config.addModuleRule({
      test: /\.m?js$/,
      include: [path.join(this.app.cwd(), this.app.context())],
      exclude: /(core-js)/,
      //exclude: /(node_modules|bower_components|\.file.js)/,
      use: [
        //require.resolve('cache-loader'),
        {
          loader: require.resolve('babel-loader'),
          options: this.babelConfig,
        },
      ],
    })

    // Add support for TypeScript
    if (this.typescript) {
      config.addModuleRule({
        test: /\.tsx?$/,
        exclude: /(node_modules)/,
        use: [
          require.resolve('cache-loader'),
          {
            loader: require.resolve('ts-loader'),
            options: {
              context: path.join(this.app.cwd(), this.app.context()),
              transpileOnly: true,
            },
          },
        ],
      })
      config.addPlugin(new ForkTsCheckerWebpackPlugin())
    }
  }
}
