const fPlugin = require('@frontal/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = class StylePlugin extends fPlugin {
  constructor(app, opts) {
    super(app, opts)

    this.app = app
    this.inDevMode = app.inDevMode()
  }

  webpack(config) {
    // Add support for less
    const lessLoaders = [
      this.inDevMode
        ? {
            loader: require.resolve('style-loader'),
          }
        : {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
      {
        loader: require.resolve('css-loader'),
      },
      {
        loader: require.resolve('less-loader'),
        options: {
          lessOptions: {
            strictMath: true,
          },
        },
      },
    ]
    if (this.inDevMode) {
      lessLoaders.unshift(require.resolve('cache-loader'))
    }
    config.addModuleRule({
      test: /\.less$/,
      use: lessLoaders,
    })

    // Add support for scss
    const scssLoaders = [
      this.inDevMode ? { loader: require.resolve('style-loader') } : { loader: MiniCssExtractPlugin.loader },
      require.resolve('css-loader'),
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            config: true,
            plugins: [require.resolve('postcss-preset-env')],
          },
        },
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          implementation: require('sass'),
          sassOptions: {
            //fiber: require('fibers'),
          },
        },
      },
    ]
    if (this.inDevMode) {
      scssLoaders.unshift(require.resolve('cache-loader'))
    }

    config.addModuleRule({
      test: /\.(sa|sc|c)ss$/,
      use: scssLoaders,
    })

    // Extract CSS into their own files in production mode
    if (!this.inDevMode) {
      config.addPlugin(
        new MiniCssExtractPlugin({
          filename: 'assets/style/[name].[contenthash].css',
          chunkFilename: 'assets/style/[id].css',
        })
      )
    }
  }
}
