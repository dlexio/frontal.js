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
    config.addModuleRule({
      test: /\.less$/,
      use: [
        require.resolve('cache-loader'),
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
      ],
    })

    // Add support for scss
    config.addModuleRule({
      test: /\.(sa|sc|c)ss$/,
      use: [
        require.resolve('cache-loader'),
        this.inDevMode
          ? {
              loader: require.resolve('style-loader'),
            }
          : {
              loader: MiniCssExtractPlugin.loader,
              options: {},
            },
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
      ],
    })

    // Extract CSS into their own files in production mode
    if (!this.inDevMode) {
      config.addPlugin(
        new MiniCssExtractPlugin({
          filename: 'assets/style/[name].css',
          chunkFilename: 'assets/style/[id].css',
        })
      )
    }
  }
}
